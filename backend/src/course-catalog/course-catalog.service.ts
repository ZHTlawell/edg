import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseCatalogService {
    constructor(private prisma: PrismaService) { }

    // ─── Get course catalog (chapters + lessons + resources + student progress) ──
    async getCatalog(courseId: string, studentId: string) {
        // Verify student has purchased this course
        const asset = await this.prisma.finAssetAccount.findFirst({
            where: { course_id: courseId, student_id: studentId, status: 'ACTIVE' },
        });
        if (!asset) throw new ForbiddenException('请先购买此课程');

        const course = await this.prisma.edCourse.findUnique({
            where: { id: courseId },
            include: {
                standard: {
                    include: {
                        chapters: {
                            orderBy: { sort_order: 'asc' },
                            include: {
                                lessons: {
                                    orderBy: { sort_order: 'asc' },
                                    include: {
                                        resources: {
                                            orderBy: { sort_order: 'asc' },
                                            include: { resource: true },
                                        },
                                        progress: {
                                            where: { student_id: studentId, course_id: courseId },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!course) throw new NotFoundException('课程不存在');
        if (!course.standard) throw new NotFoundException('该课程尚未关联课程标准，请联系校区');

        // Flatten lessons to compute unlock status (sequential unlock)
        const allLessons: any[] = [];
        course.standard.chapters.forEach(ch => ch.lessons.forEach(ls => allLessons.push(ls)));

        const enriched = course.standard.chapters.map(ch => ({
            ...ch,
            lessons: ch.lessons.map(ls => {
                const idx = allLessons.findIndex(l => l.id === ls.id);
                const prev = idx > 0 ? allLessons[idx - 1] : null;
                const prevCompleted = !prev || prev.progress?.[0]?.status === 'COMPLETED';
                const currentStatus = ls.progress?.[0]?.status || 'NOT_STARTED';

                const unlocked = idx === 0 || prevCompleted;

                return {
                    id: ls.id,
                    title: ls.title,
                    sort_order: ls.sort_order,
                    duration: ls.duration,
                    resources: unlocked
                        ? ls.resources.map(lr => ({
                            ...lr.resource,
                            sort_order: lr.sort_order,
                        }))
                        : [], // locked lessons hide resources
                    progress: currentStatus,
                    unlocked,
                    started_at: ls.progress?.[0]?.started_at,
                    completed_at: ls.progress?.[0]?.completed_at,
                };
            }),
        }));

        const totalLessons = allLessons.length;
        const completedLessons = allLessons.filter(
            l => l.progress?.[0]?.status === 'COMPLETED',
        ).length;

        return {
            course: {
                id: course.id,
                name: course.name,
                description: course.standard.description,
                cover_url: course.standard.cover_url,
                total_lessons: course.standard.total_lessons,
                lesson_duration: course.standard.lesson_duration,
                suggested_capacity: course.standard.suggested_capacity,
                age_min: course.standard.age_min,
                age_max: course.standard.age_max,
            },
            progress: { total: totalLessons, completed: completedLessons },
            chapters: enriched,
        };
    }

    // ─── Update lesson progress ───────────────────────────────────────────────
    async updateProgress(
        studentId: string,
        courseId: string,
        lessonId: string,
        action: 'start' | 'complete',
    ) {
        // Check access
        const asset = await this.prisma.finAssetAccount.findFirst({
            where: { course_id: courseId, student_id: studentId, status: 'ACTIVE' },
        });
        if (!asset) throw new ForbiddenException('未购买此课程');

        // Check sequential unlock
        if (action === 'start' || action === 'complete') {
            const lesson = await this.prisma.stdCourseLesson.findUnique({
                where: { id: lessonId },
                include: { chapter: { include: { standard: { include: { chapters: { include: { lessons: { orderBy: { sort_order: 'asc' } } }, orderBy: { sort_order: 'asc' } } } } } } },
            });
            if (!lesson) throw new NotFoundException('课时不存在');

            const allLessons: string[] = [];
            lesson.chapter.standard.chapters.forEach(ch =>
                ch.lessons.forEach(ls => allLessons.push(ls.id)),
            );
            const idx = allLessons.indexOf(lessonId);
            if (idx > 0) {
                const prevId = allLessons[idx - 1];
                const prevProgress = await this.prisma.studentLessonProgress.findFirst({
                    where: { lesson_id: prevId, student_id: studentId, course_id: courseId },
                });
                if (!prevProgress || prevProgress.status !== 'COMPLETED') {
                    throw new ForbiddenException('请先完成上一课时');
                }
            }
        }

        const now = new Date();
        const updateData =
            action === 'start'
                ? { status: 'IN_PROGRESS', started_at: now }
                : { status: 'COMPLETED', completed_at: now };

        return this.prisma.studentLessonProgress.upsert({
            where: {
                student_id_lesson_id_course_id: {
                    student_id: studentId,
                    lesson_id: lessonId,
                    course_id: courseId,
                },
            },
            create: {
                student_id: studentId,
                lesson_id: lessonId,
                course_id: courseId,
                ...updateData,
                started_at: now,
            },
            update: updateData,
        });
    }

    // ─── List courses available for student to study (purchased) ─────────────
    async getMyStudyCourses(studentId: string) {
        const assets = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId, status: 'ACTIVE', remaining_qty: { gt: 0 } },
            include: {
                course: {
                    include: {
                        standard: { select: { id: true, name: true, cover_url: true, description: true, total_lessons: true, lesson_duration: true } },
                    },
                },
            },
        });

        return assets.map(a => ({
            asset_id: a.id,
            remaining_qty: a.remaining_qty,
            course: a.course,
        }));
    }
}
