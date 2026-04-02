
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { title: string; content: string; scope: string; publisher_id: string; campusIds?: string[] }) {
        try {
            console.log('Creating announcement with data:', data);
            return await this.prisma.$transaction(async (tx) => {
                const announcement = await tx.sysAnnouncement.create({
                    data: {
                        title: data.title,
                        content: data.content,
                        scope: data.scope,
                        publisher_id: data.publisher_id,
                        status: 'DRAFT',
                    },
                });

                if (data.scope === 'SPECIFIC' && data.campusIds) {
                    await tx.sysAnnouncementTarget.createMany({
                        data: data.campusIds.map((cid) => ({
                            announcement_id: announcement.id,
                            campus_id: cid,
                        })),
                    });
                }

                return announcement;
            });
        } catch (error) {
            console.error('Error creating announcement:', error);
            throw error;
        }
    }

    async update(id: string, data: { title?: string; content?: string; scope?: string; campusIds?: string[] }) {
        const existing = await this.prisma.sysAnnouncement.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('公告不存在');
        if (!['DRAFT', 'WITHDRAWN'].includes(existing.status)) throw new ForbiddenException('仅草稿或已撤回状态可编辑');

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.sysAnnouncement.update({
                where: { id },
                data: {
                    title: data.title,
                    content: data.content,
                    scope: data.scope,
                },
            });

            if (data.campusIds) {
                await tx.sysAnnouncementTarget.deleteMany({ where: { announcement_id: id } });
                if (data.scope === 'SPECIFIC' || updated.scope === 'SPECIFIC') {
                    await tx.sysAnnouncementTarget.createMany({
                        data: data.campusIds.map((cid) => ({
                            announcement_id: id,
                            campus_id: cid,
                        })),
                    });
                }
            }

            return updated;
        });
    }

    async publish(id: string) {
        const announcement = await this.prisma.sysAnnouncement.findUnique({
            where: { id },
            include: { targets: true }
        });
        if (!announcement) throw new NotFoundException('公告不存在');
        if (announcement.scope === 'SPECIFIC' && announcement.targets.length === 0) {
            throw new ForbiddenException('指定范围发布前必须选择校区');
        }

        return this.prisma.sysAnnouncement.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishTime: new Date(),
            },
        });
    }

    async withdraw(id: string) {
        return this.prisma.sysAnnouncement.update({
            where: { id },
            data: {
                status: 'WITHDRAWN',
                withdrawTime: new Date(),
            },
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.sysAnnouncement.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('公告不存在');
        if (!['DRAFT', 'WITHDRAWN'].includes(existing.status)) {
            throw new ForbiddenException('仅草稿或已撤回状态可删除');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.sysAnnouncementTarget.deleteMany({ where: { announcement_id: id } });
            return tx.sysAnnouncement.delete({ where: { id } });
        });
    }

    async findAllForAdmin(publisherId?: string) {
        const where: any = {};
        if (publisherId) {
            where.publisher_id = publisherId;
        }
        return this.prisma.sysAnnouncement.findMany({
            where,
            include: { targets: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActiveForCampus(campusId: string) {
        return this.prisma.sysAnnouncement.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { scope: 'ALL' },
                    { targets: { some: { campus_id: campusId } } },
                ],
            },
            orderBy: { publishTime: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.sysAnnouncement.findUnique({
            where: { id },
            include: { targets: true },
        });
    }
}
