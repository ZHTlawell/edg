/**
 * 课程标准服务
 * 职责：课程分类 / 课程标准 / 模板 / 版本历史的维护
 * 所属模块：课程体系
 * 被 CourseStandardController 依赖注入
 */
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 课程标准业务服务
 * 提供标准全生命周期（创建 / 更新 / 启用 / 禁用 / 版本）管理
 */
@Injectable()
export class CourseStandardService {
    constructor(private prisma: PrismaService) { }

    // ─── 课程分类 ─────────────────────────────────────────

    /**
     * 查询所有分类（附标准数量统计）
     */
    async findAllCategories() {
        return this.prisma.stdCourseCategory.findMany({
            orderBy: [{ sort_order: 'asc' }, { createdAt: 'asc' }],
            include: { _count: { select: { standards: true } } },
        });
    }

    /** 新建分类 */
    async createCategory(data: { name: string; description?: string; sort_order?: number }) {
        return this.prisma.stdCourseCategory.create({ data });
    }

    /** 更新分类 */
    async updateCategory(id: string, data: { name?: string; description?: string; sort_order?: number; status?: string }) {
        return this.prisma.stdCourseCategory.update({ where: { id }, data });
    }

    // ─── 课程标准 ─────────────────────────────────────────

    /**
     * 按条件查询课程标准列表
     * @param filters.status 状态
     * @param filters.category_id 分类
     * @param filters.keyword 名称/编码关键字
     */
    async findAllStandards(filters?: { status?: string; category_id?: string; keyword?: string; include_archived?: string }) {
        const where: any = {};
        if (filters?.status) {
            where.status = filters.status;
        } else if (filters?.include_archived !== 'true' && filters?.include_archived !== '1') {
            // 默认不返回已归档标准；需要在"归档库"页面显式传 include_archived=true
            where.status = { not: 'ARCHIVED' };
        }
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
                _count: { select: { versions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * 查询单个课程标准详情（含章节、课节、模板）
     * @param id 标准 ID
     */
    async findOneStandard(id: string) {
        const std = await this.prisma.stdCourseStandard.findUnique({
            where: { id },
            include: {
                category: true,
                campuses: true,
                templates: true,
                versions: { orderBy: { version: 'desc' } },
            },
        });
        if (!std) throw new NotFoundException('课程标准不存在');
        return std;
    }

    /**
     * 创建课程标准
     * 写入初始版本，状态默认 DRAFT
     * @param data 标准字段（name、code、category_id、章节、课节等）
     */
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
                    version: 1,
                },
            });

            await tx.stdCourseVersion.create({
                data: {
                    standard_id: standard.id,
                    version: 1,
                    snapshot: JSON.stringify({ ...standard }),
                    change_note: '初始版本',
                    operator_id: data.creator_id,
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

    /**
     * 更新课程标准（同时追加一条版本历史记录）
     * @param id 标准 ID
     * @param data 新字段
     * @param operator_id 操作人 ID（写入版本记录）
     */
    async updateStandard(id: string, data: any, operator_id: string) {
        const existing = await this.prisma.stdCourseStandard.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('课程标准不存在');
        if (existing.status === 'DISABLED') throw new ForbiddenException('已停用的课程标准不可编辑');

        // Increment version if key rules change
        const rulesChanged =
            data.total_lessons !== undefined ||
            data.lesson_duration !== undefined ||
            data.suggested_capacity !== undefined;

        const newVersion = rulesChanged ? existing.version + 1 : existing.version;

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.stdCourseStandard.update({
                where: { id },
                data: {
                    ...data,
                    campus_ids: undefined,
                    version: newVersion,
                },
            });

            if (rulesChanged) {
                await tx.stdCourseVersion.create({
                    data: {
                        standard_id: id,
                        version: newVersion,
                        snapshot: JSON.stringify({ ...updated }),
                        change_note: data.change_note || '规则字段变更',
                        operator_id,
                    },
                });
            }

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

    /**
     * 启用标准（置为 ENABLED，校区可引用）
     * @param id 标准 ID
     * @param operator_id 操作人
     */
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

    /**
     * 禁用标准（置为 DISABLED）
     */
    async disableStandard(id: string) {
        return this.prisma.stdCourseStandard.update({
            where: { id },
            data: { status: 'DISABLED' },
        });
    }

    /**
     * 归档课程标准（软删除，置为 ARCHIVED）
     * - 归档后不再出现在默认列表和校区可用列表
     * - 历史订单/班级中对此标准的引用仍然保留，避免破坏财务/教学数据
     * @param id 标准 ID
     */
    async archiveStandard(id: string, operator_id: string) {
        const existing = await this.prisma.stdCourseStandard.findUnique({
            where: { id },
            include: { courses: { select: { id: true } } },
        });
        if (!existing) throw new NotFoundException('课程标准不存在');
        if (existing.status === 'ARCHIVED') throw new ConflictException('该课程标准已归档');

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.stdCourseStandard.update({
                where: { id },
                data: { status: 'ARCHIVED' },
            });
            await tx.stdCourseVersion.create({
                data: {
                    standard_id: id,
                    version: existing.version,
                    snapshot: JSON.stringify({ ...existing, status: 'ARCHIVED' }),
                    change_note: '归档下架',
                    operator_id,
                },
            });
            return updated;
        });
    }

    /**
     * 取消归档（恢复为 DISABLED，由管理员再手动启用）
     */
    async unarchiveStandard(id: string, operator_id: string) {
        const existing = await this.prisma.stdCourseStandard.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('课程标准不存在');
        if (existing.status !== 'ARCHIVED') throw new ConflictException('该课程标准未处于归档状态');

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.stdCourseStandard.update({
                where: { id },
                data: { status: 'DISABLED' },
            });
            await tx.stdCourseVersion.create({
                data: {
                    standard_id: id,
                    version: existing.version,
                    snapshot: JSON.stringify({ ...existing, status: 'DISABLED' }),
                    change_note: '取消归档',
                    operator_id,
                },
            });
            return updated;
        });
    }

    // ─── 课程模板 ─────────────────────────────────────────

    /**
     * 新增或更新标准的教学模板（幂等 upsert）
     * @param standard_id 标准 ID
     * @param data 模板内容
     */
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

    // ─── 版本历史 ─────────────────────────────────────────

    /**
     * 获取某课程标准的版本变更历史
     * @param standard_id 标准 ID
     */
    async getVersionHistory(standard_id: string) {
        return this.prisma.stdCourseVersion.findMany({
            where: { standard_id },
            orderBy: { version: 'desc' },
        });
    }

    // ─── 校区端查询可用标准 ────────────────────────────────

    /**
     * 查询某校区可用的课程标准
     * 规则：启用状态 + 未被校区禁用
     * @param campus_id 校区 ID
     */
    async findAvailableForCampus(campus_id: string) {
        return this.prisma.stdCourseStandard.findMany({
            where: {
                status: { in: ['ENABLED', 'PUBLISHED'] },
                OR: [
                    { campuses: { some: { campus_id: 'ALL' } } },
                    { campuses: { some: { campus_id } } },
                    { campuses: { none: {} } }, // 未配置校区限制 → 全校区可用
                ],
            },
            include: { category: true, templates: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
