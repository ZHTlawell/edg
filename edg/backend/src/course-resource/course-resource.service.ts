/**
 * 课程资源服务
 * 职责：资源与章节/课节的 CRUD、权限校验、课节-资源绑定关系
 * 所属模块：课程体系
 * 被 CourseResourceController 依赖注入
 */
import {
    Injectable, NotFoundException, ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 课程资源业务服务
 * 提供资源持久化、审批流、课节挂载等能力
 */
@Injectable()
export class CourseResourceService {
    constructor(private prisma: PrismaService) { }

    // ─── Resources ────────────────────────────────────────────────────────────────

    /**
     * 按过滤条件查询资源列表
     * @param filters.type 类型（VIDEO/PPT/…）
     * @param filters.status 状态
     * @param filters.standard_id 所属课程标准
     * @param filters.keyword 标题关键字模糊匹配
     */
    async findAllResources(filters?: {
        type?: string;
        status?: string;
        standard_id?: string;
        keyword?: string;
    }) {
        const where: any = {};
        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        if (filters?.standard_id) where.standard_id = filters.standard_id;
        if (filters?.keyword) where.title = { contains: filters.keyword };

        return this.prisma.stdResource.findMany({
            where,
            include: { standard: { select: { id: true, name: true, code: true } } },
            orderBy: [{ sort_order: 'asc' }, { createdAt: 'desc' }],
        });
    }

    /**
     * 查询单个资源（含所属标准、课节绑定信息）
     * @param id 资源 ID
     */
    async findOneResource(id: string) {
        const res = await this.prisma.stdResource.findUnique({
            where: { id },
            include: {
                standard: { select: { id: true, name: true, code: true } },
                lessonLinks: {
                    include: { lesson: { include: { chapter: true } } },
                },
            },
        });
        if (!res) throw new NotFoundException('资源不存在');
        return res;
    }

    /**
     * 创建资源记录（由 controller 上传完成后调用）
     * @param data 资源完整字段
     */
    async createResource(data: {
        title: string;
        type: string;
        url: string;
        file_name?: string;
        file_size?: number;
        description?: string;
        standard_id?: string;
        class_id?: string;
        scope?: string;
        creator_id: string;
        status?: string;
    }) {
        return this.prisma.stdResource.create({ data });
    }

    /**
     * 查询指定班级已发布的班级资料
     * @param classId 班级 ID
     */
    async findClassMaterials(classId: string) {
        return this.prisma.stdResource.findMany({
            where: { class_id: classId, scope: 'CLASS', status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * 查询学员所有班级的资料
     * 通过 user_id → EduStudent → EduStudentInClass → class → 资料 的链路
     * @param userId 登录用户 ID（SysUser.id）
     */
    async findMaterialsForStudent(userId: string) {
        // userId 是 SysUser.id，先找到 EduStudent.id
        const student = await this.prisma.eduStudent.findUnique({ where: { user_id: userId } });
        if (!student) return [];
        // 查学员所在班级
        const enrollments = await this.prisma.eduStudentInClass.findMany({
            where: { student_id: student.id },
            include: {
                class: {
                    include: {
                        assignments: { include: { course: { select: { id: true, name: true } } }, take: 1 },
                        students: { include: { student: { select: { id: true, name: true, phone: true } } } },
                    },
                },
            },
        });
        // 逐班级拉取资料
        const classIds = enrollments.map(e => e.class_id);
        const materials = classIds.length > 0
            ? await this.prisma.stdResource.findMany({
                where: { class_id: { in: classIds }, scope: 'CLASS', status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' },
            })
            : [];
        // 按班级分组返回
        return enrollments.map(e => ({
            classId: e.class_id,
            className: e.class.name,
            courseId: e.class.assignments?.[0]?.course?.id || '',
            courseName: e.class.assignments?.[0]?.course?.name || '',
            materials: materials.filter(m => m.class_id === e.class_id),
            members: (e.class.students || []).map(s => ({ id: s.student.id, name: s.student.name, phone: s.student.phone })),
        }));
    }

    /**
     * 删除班级资料
     * 权限：仅上传者 user 可删除
     * @param id 资源 ID
     * @param userId 当前操作用户 ID
     */
    async deleteClassMaterial(id: string, userId: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException('资源不存在');
        if (res.scope !== 'CLASS') throw new BadRequestException('仅可删除班级资料');
        if (res.creator_id !== userId) throw new ForbiddenException('仅可删除自己上传的资料');
        return this.prisma.stdResource.delete({ where: { id } });
    }

    /**
     * 权限校验：断言该资源由指定用户创建（CAMPUS_ADMIN 操作前置校验）
     * 不是所有者则抛 Forbidden
     */
    async assertResourceOwner(id: string, userId: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id }, select: { creator_id: true } });
        if (!res) throw new NotFoundException('资源不存在');
        if (res.creator_id !== userId) throw new ForbiddenException('您无权操作其他校区创建的资源');
    }

    /**
     * 更新资源字段
     * @param id 资源 ID
     * @param data 允许更新的子集（标题、类型、URL、描述、排序、标准、状态）
     */
    async updateResource(id: string, data: Partial<{
        title: string;
        description: string;
        standard_id: string;
        sort_order: number;
    }>) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException('资源不存在');
        return this.prisma.stdResource.update({ where: { id }, data });
    }

    /**
     * 发布资源（置为 PUBLISHED）
     */
    async publishResource(id: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException();
        if (res.status === 'PUBLISHED') throw new BadRequestException('资源已发布');
        return this.prisma.stdResource.update({ where: { id }, data: { status: 'PUBLISHED' } });
    }

    /**
     * 撤回资源（回到 DRAFT）
     */
    async withdrawResource(id: string) {
        return this.prisma.stdResource.update({ where: { id }, data: { status: 'WITHDRAWN' } });
    }

    /**
     * 删除资源（数据库记录 + 尝试删除磁盘文件）
     */
    async deleteResource(id: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException();
        if (res.status === 'PUBLISHED') throw new ForbiddenException('已发布资源不可删除，请先下架');

        // Delete local file if it's an upload
        if (res.url && res.url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), res.url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await this.prisma.stdLessonResource.deleteMany({ where: { resource_id: id } });
        return this.prisma.stdResource.delete({ where: { id } });
    }

    // Campus-available resources
    /**
     * 查询某校区可用的资源（关联该校区启用的课程标准下、已发布的资源）
     * @param campus_id 校区 ID
     */
    async findAvailableForCampus(campus_id: string) {
        const authorizedStandards = await this.prisma.stdCourseStandard.findMany({
            where: {
                status: 'ENABLED',
                OR: [
                    { campuses: { some: { campus_id: 'ALL' } } },
                    { campuses: { some: { campus_id } } },
                ],
            },
            select: { id: true },
        });
        const stdIds = authorizedStandards.map(s => s.id);

        return this.prisma.stdResource.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { standard_id: { in: stdIds } },
                    { standard_id: null },
                ],
            },
            include: { standard: { select: { id: true, name: true, code: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── Chapters ─────────────────────────────────────────────────────────────────

    /**
     * 获取某标准下的章节列表（含课节与已绑定的资源）
     * @param standard_id 课程标准 ID
     */
    async findChapters(standard_id: string) {
        return this.prisma.stdCourseChapter.findMany({
            where: { standard_id },
            orderBy: { sort_order: 'asc' },
            include: {
                lessons: {
                    orderBy: { sort_order: 'asc' },
                    include: {
                        resources: {
                            orderBy: { sort_order: 'asc' },
                            include: { resource: true },
                        },
                    },
                },
            },
        });
    }

    /** 创建章节 */
    async createChapter(data: { standard_id: string; title: string; sort_order?: number }) {
        return this.prisma.stdCourseChapter.create({ data });
    }

    /** 更新章节（标题、排序） */
    async updateChapter(id: string, data: { title?: string; sort_order?: number }) {
        return this.prisma.stdCourseChapter.update({ where: { id }, data });
    }

    /** 删除章节（含级联课节） */
    async deleteChapter(id: string) {
        // Cascade: delete lessons and their resource links
        const lessons = await this.prisma.stdCourseLesson.findMany({ where: { chapter_id: id } });
        for (const lesson of lessons) {
            await this.prisma.stdLessonResource.deleteMany({ where: { lesson_id: lesson.id } });
        }
        await this.prisma.stdCourseLesson.deleteMany({ where: { chapter_id: id } });
        return this.prisma.stdCourseChapter.delete({ where: { id } });
    }

    // ─── Lessons ──────────────────────────────────────────────────────────────────

    /** 新建课节 */
    async createLesson(data: { chapter_id: string; title: string; sort_order?: number; duration?: number }) {
        return this.prisma.stdCourseLesson.create({ data });
    }

    /** 更新课节 */
    async updateLesson(id: string, data: { title?: string; sort_order?: number; duration?: number }) {
        return this.prisma.stdCourseLesson.update({ where: { id }, data });
    }

    /** 删除课节（含绑定的资源关联） */
    async deleteLesson(id: string) {
        await this.prisma.stdLessonResource.deleteMany({ where: { lesson_id: id } });
        return this.prisma.stdCourseLesson.delete({ where: { id } });
    }

    // ─── Lesson Resources ─────────────────────────────────────────────────────────

    /**
     * 给课节追加一个资源绑定
     * @param lesson_id 课节 ID
     * @param resource_id 资源 ID
     * @param sort_order 排序（默认 0）
     */
    async addResourceToLesson(lesson_id: string, resource_id: string, sort_order = 0) {
        return this.prisma.stdLessonResource.upsert({
            where: { lesson_id_resource_id: { lesson_id, resource_id } },
            create: { lesson_id, resource_id, sort_order },
            update: { sort_order },
        });
    }

    /** 从课节解绑一个资源 */
    async removeResourceFromLesson(lesson_id: string, resource_id: string) {
        return this.prisma.stdLessonResource.deleteMany({
            where: { lesson_id, resource_id },
        });
    }

    /**
     * 按给定顺序重排课节绑定的资源
     * @param lesson_id 课节 ID
     * @param ordered_resource_ids 目标顺序的资源 ID 数组
     */
    async reorderLessonResources(lesson_id: string, ordered_resource_ids: string[]) {
        const updates = ordered_resource_ids.map((rid, i) =>
            this.prisma.stdLessonResource.updateMany({
                where: { lesson_id, resource_id: rid },
                data: { sort_order: i },
            }),
        );
        return Promise.all(updates);
    }
}
