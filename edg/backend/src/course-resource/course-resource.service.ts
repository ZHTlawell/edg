import {
    Injectable, NotFoundException, ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CourseResourceService {
    constructor(private prisma: PrismaService) { }

    // ─── Resources ────────────────────────────────────────────────────────────────

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

    async findClassMaterials(classId: string) {
        return this.prisma.stdResource.findMany({
            where: { class_id: classId, scope: 'CLASS', status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
        });
    }

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

    async deleteClassMaterial(id: string, userId: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException('资源不存在');
        if (res.scope !== 'CLASS') throw new BadRequestException('仅可删除班级资料');
        if (res.creator_id !== userId) throw new ForbiddenException('仅可删除自己上传的资料');
        return this.prisma.stdResource.delete({ where: { id } });
    }

    async assertResourceOwner(id: string, userId: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id }, select: { creator_id: true } });
        if (!res) throw new NotFoundException('资源不存在');
        if (res.creator_id !== userId) throw new ForbiddenException('您无权操作其他校区创建的资源');
    }

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

    async publishResource(id: string) {
        const res = await this.prisma.stdResource.findUnique({ where: { id } });
        if (!res) throw new NotFoundException();
        if (res.status === 'PUBLISHED') throw new BadRequestException('资源已发布');
        return this.prisma.stdResource.update({ where: { id }, data: { status: 'PUBLISHED' } });
    }

    async withdrawResource(id: string) {
        return this.prisma.stdResource.update({ where: { id }, data: { status: 'WITHDRAWN' } });
    }

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

    async createChapter(data: { standard_id: string; title: string; sort_order?: number }) {
        return this.prisma.stdCourseChapter.create({ data });
    }

    async updateChapter(id: string, data: { title?: string; sort_order?: number }) {
        return this.prisma.stdCourseChapter.update({ where: { id }, data });
    }

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

    async createLesson(data: { chapter_id: string; title: string; sort_order?: number; duration?: number }) {
        return this.prisma.stdCourseLesson.create({ data });
    }

    async updateLesson(id: string, data: { title?: string; sort_order?: number; duration?: number }) {
        return this.prisma.stdCourseLesson.update({ where: { id }, data });
    }

    async deleteLesson(id: string) {
        await this.prisma.stdLessonResource.deleteMany({ where: { lesson_id: id } });
        return this.prisma.stdCourseLesson.delete({ where: { id } });
    }

    // ─── Lesson Resources ─────────────────────────────────────────────────────────

    async addResourceToLesson(lesson_id: string, resource_id: string, sort_order = 0) {
        return this.prisma.stdLessonResource.upsert({
            where: { lesson_id_resource_id: { lesson_id, resource_id } },
            create: { lesson_id, resource_id, sort_order },
            update: { sort_order },
        });
    }

    async removeResourceFromLesson(lesson_id: string, resource_id: string) {
        return this.prisma.stdLessonResource.deleteMany({
            where: { lesson_id, resource_id },
        });
    }

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
