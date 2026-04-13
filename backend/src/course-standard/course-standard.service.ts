import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseStandardService {
    constructor(private prisma: PrismaService) { }

    // ─── 课程分类 ─────────────────────────────────────────

    async findAllCategories() {
        return this.prisma.stdCourseCategory.findMany({
            orderBy: [{ sort_order: 'asc' }, { createdAt: 'asc' }],
            include: { _count: { select: { standards: true } } },
        });
    }

    async createCategory(data: { name: string; description?: string; sort_order?: number }) {
        return this.prisma.stdCourseCategory.create({ data });
    }

    async updateCategory(id: string, data: { name?: string; description?: string; sort_order?: number; status?: string }) {
        return this.prisma.stdCourseCategory.update({ where: { id }, data });
    }

    // ─── 课程标准 ─────────────────────────────────────────

    async findAllStandards(filters?: { status?: string; category_id?: string; keyword?: string }) {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category_id) where.category_id = filters.category_id;
        if (filters?.keyword) {
            where.OR = [
                { name: { contains: filters.keyword } },
                { code: { contains: filters.keyword } },
            ];
        }

        return this.prisma.stdCourseStandard.findMany({
            where,
            include: {
                category: true,
                campuses: true,
                templates: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneStandard(id: string) {
        const std = await this.prisma.stdCourseStandard.findUnique({
            where: { id },
            include: {
                category: true,
                campuses: true,
                templates: true,
            },
        });
        if (!std) throw new NotFoundException('课程标准不存在');
        return std;
    }

    async createStandard(data: {
        code: string;
        name: string;
        category_id: string;
        age_min?: number;
        age_max?: number;
        description?: string;
        total_lessons: number;
        lesson_duration?: number;
        suggested_cycle?: string;
        suggested_capacity?: number;
        cover_url?: string;
        campus_ids?: string[];
        creator_id: string;
    }) {
        const exists = await this.prisma.stdCourseStandard.findUnique({ where: { code: data.code } });
        if (exists) throw new ConflictException(`课程编号 ${data.code} 已存在`);

        return this.prisma.$transaction(async (tx) => {
            const standard = await tx.stdCourseStandard.create({
                data: {
                    code: data.code,
                    name: data.name,
                    category_id: data.category_id,
                    age_min: data.age_min,
                    age_max: data.age_max,
                    description: data.description,
                    total_lessons: data.total_lessons,
                    lesson_duration: data.lesson_duration ?? 45,
                    suggested_cycle: data.suggested_cycle,
                    suggested_capacity: data.suggested_capacity ?? 20,
                    cover_url: data.cover_url,
                    creator_id: data.creator_id,
                    status: 'DRAFT',
                },
            });

            // 记录到统一的审计日志（替代原版本表）
            await tx.sysAuditLog.create({
                data: {
                    action: 'STANDARD_CREATE',
                    entity_type: 'COURSE_STANDARD',
                    entity_id: standard.id,
                    operator_id: data.creator_id,
                    details: JSON.stringify({ code: standard.code, name: standard.name, total_lessons: standard.total_lessons }),
                },
            });

            if (data.campus_ids && data.campus_ids.length > 0) {
                await tx.stdCourseStandardCampus.createMany({
                    data: data.campus_ids.map((cid) => ({ standard_id: standard.id, campus_id: cid })),
                });
            }

            return standard;
        });
    }

    async updateStandard(id: string, data: any, operator_id: string) {
        const existing = await this.prisma.stdCourseStandard.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('课程标准不存在');
        if (existing.status === 'DISABLED') throw new ForbiddenException('已停用的课程标准不可编辑');

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.stdCourseStandard.update({
                where: { id },
                data: {
                    ...data,
                    campus_ids: undefined,
                },
            });

            // 记录到审计日志
            await tx.sysAuditLog.create({
                data: {
                    action: 'STANDARD_UPDATE',
                    entity_type: 'COURSE_STANDARD',
                    entity_id: id,
                    operator_id,
                    details: JSON.stringify({ change_note: data.change_note || '字段变更', diff: data }),
                },
            });

            // Update campus authorization
            if (data.campus_ids !== undefined) {
                await tx.stdCourseStandardCampus.deleteMany({ where: { standard_id: id } });
                if (data.campus_ids.length > 0) {
                    await tx.stdCourseStandardCampus.createMany({
                        data: data.campus_ids.map((cid: string) => ({ standard_id: id, campus_id: cid })),
                    });
                }
            }

            return updated;
        });
    }

    async enableStandard(id: string, operator_id: string) {
        const std = await this.prisma.stdCourseStandard.findUnique({
            where: { id },
            include: { campuses: true },
        });
        if (!std) throw new NotFoundException('课程标准不存在');
        if (std.campuses.length === 0) throw new ForbiddenException('请先配置适用校区后再启用');

        return this.prisma.stdCourseStandard.update({
            where: { id },
            data: { status: 'ENABLED' },
        });
    }

    async disableStandard(id: string) {
        return this.prisma.stdCourseStandard.update({
            where: { id },
            data: { status: 'DISABLED' },
        });
    }

    // ─── 课程模板 ─────────────────────────────────────────

    async upsertTemplate(standard_id: string, data: {
        teaching_goal?: string;
        stage_desc?: string;
        default_fee_ref?: number;
        notes?: string;
    }) {
        const existing = await this.prisma.stdCourseTemplate.findFirst({ where: { standard_id } });
        if (existing) {
            return this.prisma.stdCourseTemplate.update({ where: { id: existing.id }, data });
        }
        return this.prisma.stdCourseTemplate.create({ data: { standard_id, ...data } });
    }

    // ─── 变更历史（来源：SysAuditLog） ─────────────────────

    async getVersionHistory(standard_id: string) {
        return this.prisma.sysAuditLog.findMany({
            where: { entity_type: 'COURSE_STANDARD', entity_id: standard_id },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── 校区端查询可用标准 ────────────────────────────────

    async findAvailableForCampus(campus_id: string) {
        return this.prisma.stdCourseStandard.findMany({
            where: {
                status: 'ENABLED',
                OR: [
                    { campuses: { some: { campus_id: 'ALL' } } },
                    { campuses: { some: { campus_id } } },
                ],
            },
            include: { category: true, templates: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
