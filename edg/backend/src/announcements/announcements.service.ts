/**
 * 公告服务
 * 职责：封装公告的持久化、状态流转、校区目标绑定、已读回执逻辑
 * 所属模块：消息通知
 * 被 AnnouncementsController 依赖注入使用
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 公告业务服务
 * 处理草稿 -> 发布 -> 撤回的生命周期，以及 ALL / SPECIFIC 两种受众范围
 */
@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    /**
     * 创建公告（初始为 DRAFT 草稿状态）
     * SPECIFIC 范围会写入校区目标关联表
     * @param data.title 标题
     * @param data.content 正文
     * @param data.scope 范围（ALL/SPECIFIC）
     * @param data.publisher_id 发布人用户 ID
     * @param data.campusIds 仅 SPECIFIC 使用的校区 ID 数组
     */
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

    /**
     * 更新公告（仅草稿或已撤回状态可编辑）
     * 如果传入 campusIds，会先清空原目标再重建
     * @param id 公告 ID
     * @param data 可更新字段
     */
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

    /**
     * 发布公告：状态置为 PUBLISHED，记录发布时间
     * SPECIFIC 范围必须已选择目标校区
     * @param id 公告 ID
     */
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

    /**
     * 撤回公告：状态置为 WITHDRAWN，记录撤回时间
     * @param id 公告 ID
     */
    async withdraw(id: string) {
        return this.prisma.sysAnnouncement.update({
            where: { id },
            data: {
                status: 'WITHDRAWN',
                withdrawTime: new Date(),
            },
        });
    }

    /**
     * 删除公告（同时清理目标关联）
     * 仅草稿或已撤回状态可删除
     * @param id 公告 ID
     */
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

    /**
     * 管理端公告列表（按创建时间倒序，含目标校区）
     * @param publisherId 可选的发布人过滤（CAMPUS_ADMIN 仅看自己）
     */
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

    /**
     * 查询指定校区可见的已发布公告
     * 命中规则：scope=ALL 或 targets 包含当前 campusId
     * @param campusId 校区 ID
     */
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

    /**
     * 查询单条公告详情（含目标校区）
     * @param id 公告 ID
     */
    async findOne(id: string) {
        return this.prisma.sysAnnouncement.findUnique({
            where: { id },
            include: { targets: true },
        });
    }

    /**
     * 获取用户未读的已发布公告
     * 通过 reads 关联反查：不存在当前 userId 的已读记录即为未读
     * @param campusId 用户所在校区
     * @param userId 用户 ID
     */
    async findUnreadForUser(campusId: string, userId: string) {
        return this.prisma.sysAnnouncement.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { scope: 'ALL' },
                    { targets: { some: { campus_id: campusId } } },
                ],
                reads: { none: { user_id: userId } },
            },
            orderBy: { publishTime: 'desc' },
        });
    }

    /**
     * 标记公告为已读（幂等 upsert）
     * @param announcementId 公告 ID
     * @param userId 用户 ID
     */
    async markAsRead(announcementId: string, userId: string) {
        return this.prisma.sysAnnouncementRead.upsert({
            where: { announcement_id_user_id: { announcement_id: announcementId, user_id: userId } },
            create: { announcement_id: announcementId, user_id: userId },
            update: {},
        });
    }
}
