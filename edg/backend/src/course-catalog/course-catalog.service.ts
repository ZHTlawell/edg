/**
 * 课程目录服务
 * 职责：课程预览、章节/课节目录查询、学习进度记录、已购课程检索
 * 所属模块：课程体系
 * 被 CourseCatalogController 依赖注入
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 课程目录业务服务
 * 面向学员端：课前预览、课中学习目录、学习进度流转
 */
@Injectable()
export class CourseCatalogService {
    constructor(private prisma: PrismaService) { }

    /**
     * 公开预览课程：返回章节 + 课节（不含资源、无进度）
     * 未关联标准时返回空章节结构
     * @param courseId 课程 ID
     */
    // ─── Public course preview (chapters + lessons, no resources/progress) ────────
    async getPreview(courseId: string) {
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
                                    select: { id: true, title: true, sort_order: true, duration: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!course) throw new NotFoundException('课程不存在');
        if (!course.standard) {
            return {
                course: { id: course.id, name: course.name, description: '', cover_url: null, total_lessons: course.total_lessons || 0, lesson_duration: 45 },
                chapters: [],
            };
        }
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
            chapters: course.standard.chapters.map(ch => ({
                id: ch.id,
                title: ch.title,
                sort_order: ch.sort_order,
                lessons: ch.lessons.map(ls => ({
                    id: ls.id,
                    title: ls.title,
                    sort_order: ls.sort_order,
                    duration: ls.duration,
                })),
            })),
        };
    }

    /**
     * 获取课程学习目录：章节 + 课节 + 资源 + 当前学员进度
     * 需要学员对该课程有有效的资产账号，否则 403
     * @param courseId 课程 ID
     * @param studentId 学员 ID
     */
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

        // If no standard linked, return course info with empty chapters (graceful degradation)
        if (!course.standard) {
            return {
                course: {
                    id: course.id,
                    name: course.name,
                    description: (course as any).description || '',
                    cover_url: null,
                    total_lessons: course.total_lessons || 0,
                    lesson_duration: 45,
                    suggested_capacity: null,
                    age_min: null,
                    age_max: null,
                },
                progress: { total: 0, completed: 0 },
                chapters: [],
                notice: '该课程暂未上传课程内容，请联系校区获取线下课程资料。',
            };
        }

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

    /**
     * 更新某节课的学习进度（开始 / 完成）
     * 规则：
     *  1. 必须拥有该课程的有效资产
     *  2. 必须按顺序解锁（前一节未完成则禁止）
     *  3. 完成操作只在首次 COMPLETED 时扣一节课时
     * @param studentId 学员 ID
     * @param courseId 课程 ID
     * @param lessonId 课节 ID
     * @param action 行为：start / complete
     */
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

        // Check if already completed (prevent double-deduction)
        const existingProgress = await this.prisma.studentLessonProgress.findFirst({
            where: { student_id: studentId, lesson_id: lessonId, course_id: courseId },
        });
        const alreadyCompleted = existingProgress?.status === 'COMPLETED';

        const now = new Date();
        const updateData =
            action === 'start'
                ? { status: 'IN_PROGRESS', started_at: now }
                : { status: 'COMPLETED', completed_at: now };

        const result = await this.prisma.studentLessonProgress.upsert({
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

        // Deduct one lesson slot from asset account when completing (only once)
        if (action === 'complete' && !alreadyCompleted) {
            await this.prisma.finAssetAccount.updateMany({
                where: {
                    student_id: studentId,
                    course_id: courseId,
                    status: 'ACTIVE',
                    remaining_qty: { gt: 0 },
                },
                data: { remaining_qty: { decrement: 1 } },
            });
        }

        return result;
    }

    /**
     * 查询学员已购买、可学习的课程列表
     * 通过 finAssetAccount（资产账户）反查课程
     * @param studentId 学员 ID
     */
    // ─── List courses available for student to study (purchased) ─────────────
    async getMyStudyCourses(studentId: string) {
        const assets = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId, status: 'ACTIVE' },
            include: {
                course: {
                    include: {
                        standard: { select: { id: true, name: true, cover_url: true, description: true, total_lessons: true, lesson_duration: true } },
                    },
                },
            },
        });

        // Aggregate by course_id: merge remaining_qty and total_qty
        const courseMap = new Map<string, { asset_id: string; remaining_qty: number; total_qty: number; course: any }>();
        for (const a of assets) {
            const existing = courseMap.get(a.course_id);
            if (existing) {
                existing.remaining_qty += a.remaining_qty;
                existing.total_qty += a.total_qty;
            } else {
                courseMap.set(a.course_id, {
                    asset_id: a.id,
                    remaining_qty: a.remaining_qty,
                    total_qty: a.total_qty,
                    course: a.course,
                });
            }
        }

        return Array.from(courseMap.values());
    }
}
