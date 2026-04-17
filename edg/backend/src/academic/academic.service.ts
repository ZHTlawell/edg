import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 根据排课参数生成课次日期列表
 * 模式1 (默认): 每周一节；模式2: weekdays[] + timeOfDay
 */
export function buildScheduleDates(opts: {
    startDate: string | Date;
    lessonsCount: number;
    durationMinutes: number;
    weekdays?: number[];   // 0=周日 ... 6=周六
    timeOfDay?: string;    // "HH:mm"
}): { start: Date; end: Date }[] {
    const { startDate, lessonsCount, durationMinutes, weekdays, timeOfDay } = opts;
    const results: { start: Date; end: Date }[] = [];
    const base = new Date(startDate);

    if (weekdays && weekdays.length > 0) {
        let [hh, mm] = [base.getHours(), base.getMinutes()];
        if (timeOfDay && /^\d{1,2}:\d{2}$/.test(timeOfDay)) {
            const [h, m] = timeOfDay.split(':').map(n => parseInt(n, 10));
            hh = h; mm = m;
        }
        const cursor = new Date(base);
        cursor.setHours(0, 0, 0, 0);
        while (results.length < lessonsCount) {
            if (weekdays.includes(cursor.getDay())) {
                const start = new Date(cursor);
                start.setHours(hh, mm, 0, 0);
                const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
                if (start >= base) results.push({ start, end });
            }
            cursor.setDate(cursor.getDate() + 1);
            if (cursor.getTime() - base.getTime() > 2 * 365 * 24 * 60 * 60 * 1000) break;
        }
        return results;
    }

    const cur = new Date(base);
    for (let i = 0; i < lessonsCount; i++) {
        results.push({
            start: new Date(cur),
            end: new Date(cur.getTime() + durationMinutes * 60 * 1000)
        });
        cur.setDate(cur.getDate() + 7);
    }
    return results;
}

@Injectable()
export class AcademicService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 课程管理 (Courses)
    // =====================================
    async createCourse(data: any) {
        // standard_id 必填
        const standardId = data.standard_id;
        if (!standardId) {
            throw new BadRequestException('必须基于课程标准创建课程，请先选择标准');
        }

        const standard = await (this.prisma as any).stdCourseStandard.findUnique({ where: { id: standardId } });
        if (!standard) throw new BadRequestException('无效的课程标准');
        if (standard.status !== 'ENABLED' && standard.status !== 'PUBLISHED') {
            throw new BadRequestException(`该课程标准状态为「${standard.status}」，无法开设新课程`);
        }

        const requestedLessons = data.total_lessons || data.totalLessons || standard.total_lessons;

        // ±20% 课时数校验
        const baseLessons = standard.total_lessons;
        const lowerBound = Math.floor(baseLessons * 0.8);
        const upperBound = Math.ceil(baseLessons * 1.2);
        if (requestedLessons < lowerBound || requestedLessons > upperBound) {
            throw new BadRequestException(
                `课时数 ${requestedLessons} 超出标准建议范围 [${lowerBound}, ${upperBound}]（基准 ${baseLessons}）`
            );
        }

        const mappedData = {
            name: data.name,
            category: data.category || (standard as any).category_id || '',
            price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
            total_lessons: requestedLessons,
            standard_id: standardId,
            campus_id: data.campus_id || null,
            instructor_id: data.instructor_id || null,
        };

        return this.prisma.edCourse.create({
            data: {
                ...mappedData,
                status: 'ENABLED'
            },
        });
    }

    async getAllCourses(campusId?: string, page?: number, pageSize?: number) {
        const take = pageSize || 50;
        const skip = page && page > 1 ? (page - 1) * take : 0;

        const where: any = {
            status: 'ENABLED',
            ...(campusId ? {
                OR: [
                    { campus_id: campusId },
                    { campus_id: null }
                ]
            } : {})
        };

        const [courses, total] = await Promise.all([
            this.prisma.edCourse.findMany({
                where,
                include: { instructor: true },
                skip,
                take,
            }),
            this.prisma.edCourse.count({ where })
        ]);

        // 获取所有校区管理员的校区名称映射
        const admins = await this.prisma.sysUser.findMany({
            where: { role: 'CAMPUS_ADMIN' },
            select: { campus_id: true, campusName: true }
        });

        const data = courses.map((c: any) => {
            const campusName = admins.find(a => a.campus_id === c.campus_id)?.campusName || '总校区';
            return {
                id: c.id,
                code: c.id.substring(0, 8).toUpperCase(),
                name: c.name,
                category: c.category,
                level: '中级',
                price: `¥${c.price.toLocaleString()}`,
                totalLessons: c.total_lessons,
                status: c.status.toLowerCase(),
                campus: campusName,
                instructor: c.instructor?.name || '未分配',
                updateTime: new Date().toLocaleDateString(),
                campus_id: c.campus_id
            };
        });

        return { data, total, page: page || 1, pageSize: take };
    }

    async getClassDetail(classId: string) {
        const cls = await (this.prisma as any).edClass.findUnique({
            where: { id: classId },
            include: {
                assignments: {
                    include: {
                        course: true,
                        teacher: { include: { user: true } },
                        schedules: {
                            orderBy: { lesson_no: 'asc' }
                        }
                    }
                },
                students: {
                    include: { student: true }
                }
            }
        });
        if (!cls) throw new NotFoundException('班级不存在');
        return cls;
    }

    // =====================================
    // 班级与排课管理 (Classes & Schedules)
    // =====================================
    async createClass(data: {
        name: string;
        campus_id: string;
        capacity: number;
        min_students?: number;
        assignment?: {
            course_id: string;
            teacher_id: string;
            schedule?: {
                startDate: string;
                lessonsCount: number;
                durationMinutes: number;
                classroom?: string;
            }
        }
    }) {
        return this.prisma.$transaction(async (tx: any) => {
            // 1. Create Class（管理员手动创建的班默认 PENDING，招生满 min_students 后再开班）
            const newClass = await tx.edClass.create({
                data: {
                    name: data.name,
                    campus_id: data.campus_id,
                    capacity: data.capacity,
                    min_students: data.min_students ?? 5,
                    status: 'PENDING'
                }
            });

            // 2. Optional: Create Assignment and Schedules
            if (data.assignment?.course_id && data.assignment?.teacher_id) {
                const newAssignment = await tx.edClassAssignment.create({
                    data: {
                        class_id: newClass.id,
                        course_id: data.assignment.course_id,
                        teacher_id: data.assignment.teacher_id,
                        status: 'ACTIVE'
                    }
                });

                if (data.assignment.schedule && data.assignment.schedule.lessonsCount > 0) {
                    const sched = data.assignment.schedule as any;
                    const { startDate, lessonsCount, durationMinutes, classroom, weekdays, timeOfDay } = sched;

                    const dates = buildScheduleDates({ startDate, lessonsCount, durationMinutes, weekdays, timeOfDay });

                    const schedules = await Promise.all(dates.map(async (dt, i) => {
                        let roomId: string | null = null;
                        let roomName = classroom || '待分配';
                        if (!classroom) {
                            const assigned = await this.autoAssignClassroom({
                                campusId: data.campus_id,
                                classEnrolled: newClass.enrolled || 0,
                                startTime: dt.start,
                                endTime: dt.end,
                                tx,
                            });
                            if (assigned) { roomId = assigned.id; roomName = assigned.name; }
                        }
                        return {
                            assignment_id: newAssignment.id,
                            course_id: data.assignment!.course_id,
                            lesson_no: i + 1,
                            start_time: dt.start,
                            end_time: dt.end,
                            classroom: roomName,
                            classroom_id: roomId,
                            status: 'DRAFT',
                        };
                    }));

                    await tx.edLessonSchedule.createMany({ data: schedules });
                }
            }

            return newClass;
        });
    }

    async assignCourseToClass(data: { class_id: string; course_id: string; teacher_id: string }) {
        const assignment = await (this.prisma as any).edClassAssignment.create({
            data: {
                class_id: data.class_id,
                course_id: data.course_id,
                teacher_id: data.teacher_id,
                status: 'ACTIVE'
            },
            include: {
                course: true,
                teacher: true
            }
        });

        return assignment;
    }

    async getClassesByCampus(campusId: string, page?: number, pageSize?: number) {
        const take = pageSize || 50;
        const skip = page && page > 1 ? (page - 1) * take : 0;

        const where = { campus_id: campusId };
        const [data, total] = await Promise.all([
            (this.prisma as any).edClass.findMany({
                where,
                skip,
                take,
                include: {
                    assignments: {
                        include: {
                            course: true,
                            teacher: true,
                            schedules: {
                                orderBy: { start_time: 'asc' },
                                include: { _count: { select: { attendances: true } } }
                            }
                        }
                    },
                    students: {
                        include: { student: true }
                    }
                }
            }),
            (this.prisma as any).edClass.count({ where })
        ]);

        return { data, total, page: page || 1, pageSize: take };
    }

    async getClassesByStudent(studentId: string) {
        // Find classes where student is enrolled
        const enrollments = await (this.prisma as any).eduStudentInClass.findMany({
            where: { student_id: studentId },
            include: {
                class: {
                    include: {
                        assignments: {
                            include: {
                                course: true,
                                teacher: true,
                                schedules: {
                                    where: { status: { in: ['PUBLISHED', 'COMPLETED'] } },
                                    orderBy: { start_time: 'asc' },
                                    include: { _count: { select: { attendances: true } } }
                                }
                            }
                        }
                    }
                }
            }
        });

        return enrollments.map((e: any) => e.class);
    }

    async getClassesByTeacher(teacherId: string) {
        const assignments = await (this.prisma as any).edClassAssignment.findMany({
            where: { teacher_id: teacherId, status: 'ACTIVE' },
            include: {
                class: {
                    include: { students: { include: { student: true } } }
                },
                course: true,
                teacher: true,
                schedules: {
                    orderBy: { start_time: 'asc' },
                    include: { _count: { select: { attendances: true } } }
                }
            }
        });

        return assignments.map((a: any) => ({
            ...a.class,
            course: a.course,
            teacher: a.teacher,
            teacher_id: a.teacher_id,
            assignment_id: a.id,
            schedules: a.schedules,
            students: a.class.students
        }));
    }

    async generateDraftSchedules(assignmentId: string, startDate: Date, lessonsCount: number, durationMinutes: number, opts?: { weekdays?: number[]; timeOfDay?: string }) {
        const existingPublished = await (this.prisma as any).edLessonSchedule.findMany({
            where: { assignment_id: assignmentId, status: { not: 'DRAFT' } },
            select: { lesson_no: true }
        });
        const maxPublishedNo = existingPublished.length > 0
            ? Math.max(...existingPublished.map((s: any) => s.lesson_no))
            : 0;

        await (this.prisma as any).edLessonSchedule.deleteMany({
            where: { assignment_id: assignmentId, status: 'DRAFT' }
        });

        // 拿 course_id 和 campus_id 回填冗余字段 + 用于教室分配
        const assignment = await (this.prisma as any).edClassAssignment.findUnique({
            where: { id: assignmentId },
            include: { class: { select: { campus_id: true, enrolled: true } } }
        });
        const courseId = assignment?.course_id || null;
        const campusId: string = assignment?.class?.campus_id || '';
        const enrolled: number = assignment?.class?.enrolled || 0;

        const dates = buildScheduleDates({
            startDate: startDate.toISOString(),
            lessonsCount,
            durationMinutes,
            weekdays: opts?.weekdays,
            timeOfDay: opts?.timeOfDay,
        });

        const schedules = await Promise.all(dates.map(async (dt, i) => {
            const assigned = campusId
                ? await this.autoAssignClassroom({ campusId, classEnrolled: enrolled, startTime: dt.start, endTime: dt.end })
                : null;
            return {
                assignment_id: assignmentId,
                course_id: courseId,
                lesson_no: maxPublishedNo + i + 1,
                start_time: dt.start,
                end_time: dt.end,
                classroom: assigned?.name || '待分配',
                classroom_id: assigned?.id || null,
                status: 'DRAFT',
            };
        }));

        return (this.prisma as any).edLessonSchedule.createMany({ data: schedules });
    }

    /**
     * 自动分配教室
     * 策略：同校区、状态 AVAILABLE、容量 >= 班级人数，且目标时段无冲突排课
     * 优先选容量最接近班级人数的教室（避免大教室浪费），全无空闲时返回 null
     */
    async autoAssignClassroom(opts: {
        campusId: string;
        classEnrolled: number;
        startTime: Date;
        endTime: Date;
        excludeScheduleId?: string;
        tx?: any;
    }): Promise<{ id: string; name: string } | null> {
        const client = opts.tx || this.prisma;

        // 查可用教室，按容量从小到大（贴近人数）
        const rooms = await client.eduClassroom.findMany({
            where: {
                campus_id: opts.campusId,
                status: 'AVAILABLE',
                capacity: { gte: opts.classEnrolled > 0 ? opts.classEnrolled : 1 },
            },
            orderBy: { capacity: 'asc' },
        });

        for (const room of rooms) {
            // 检查该时段教室是否已被其他排课占用
            const conflict = await client.edLessonSchedule.findFirst({
                where: {
                    classroom_id: room.id,
                    status: { in: ['PUBLISHED', 'DRAFT'] },
                    start_time: { lt: opts.endTime },
                    end_time:   { gt: opts.startTime },
                    ...(opts.excludeScheduleId ? { id: { not: opts.excludeScheduleId } } : {}),
                },
            });
            if (!conflict) return { id: room.id, name: room.name };
        }
        return null; // 全部教室都冲突，降级为"待分配"
    }

    /**
     * 同步 EdClass.enrolled 字段（基于 EduStudentInClass 实际计数）
     */
    async syncClassEnrolled(classId: string, tx?: any) {
        const client = tx || this.prisma;
        const count = await client.eduStudentInClass.count({ where: { class_id: classId } });
        await client.edClass.update({ where: { id: classId }, data: { enrolled: count } });
        return count;
    }

    /**
     * 批量修复所有班级的 enrolled 字段
     */
    async repairAllClassEnrolled() {
        const classes = await this.prisma.edClass.findMany({ select: { id: true } });
        let repaired = 0;
        for (const cls of classes) {
            await this.syncClassEnrolled(cls.id);
            repaired++;
        }
        return { repaired };
    }

    async publishSchedules(lessonIds: string[], operatorId: string) {
        const lessons = await (this.prisma as any).edLessonSchedule.findMany({
            where: { id: { in: lessonIds } },
            include: { assignment: { include: { teacher: true } } }
        });

        for (const lesson of lessons) {
            const conflict = await (this.prisma as any).edLessonSchedule.findFirst({
                where: {
                    id: { not: lesson.id },
                    status: 'PUBLISHED',
                    OR: [
                        {
                            assignment: { teacher_id: (lesson as any).assignment.teacher_id },
                            start_time: { lt: lesson.end_time },
                            end_time: { gt: lesson.start_time }
                        },
                        {
                            classroom: lesson.classroom,
                            start_time: { lt: lesson.end_time },
                            end_time: { gt: lesson.start_time }
                        }
                    ]
                }
            });

            if (conflict) {
                throw new BadRequestException(`发现排课冲突: 教师/教室在 ${conflict.start_time.toLocaleString()} 已被占用`);
            }
        }

        return this.prisma.$transaction(async (prisma: any) => {
            await prisma.edLessonSchedule.updateMany({
                where: { id: { in: lessonIds } },
                data: { status: 'PUBLISHED' }
            });
            return { success: true };
        });
    }

    async getAllTeachers(campusId?: string) {
        const teachers = await this.prisma.eduTeacher.findMany({
            where: {
                user: {
                    status: 'ACTIVE',
                    ...(campusId ? { campus_id: campusId } : {}),
                }
            },
            include: {
                user: true
            }
        });

        return teachers.map(t => ({
            id: t.id,
            name: t.name,
            department: t.department || '教务部',
            phone: t.user.username,
            campus: t.user.campusName || '总校区',
            campus_id: t.user.campus_id
        }));
    }

    /** 手动将学员加入班级 */
    async enrollStudentInClass(classId: string, studentId: string) {
        return (this.prisma as any).$transaction(async (prisma: any) => {
            const cls = await prisma.edClass.findUnique({
                where: { id: classId },
                include: { assignments: true, students: true }
            });
            if (!cls) throw new NotFoundException('班级不存在');
            if (cls.enrolled >= cls.capacity) throw new BadRequestException('班级已满，无法加入');

            // 防重复
            const existing = cls.students.find((s: any) => s.student_id === studentId);
            if (existing) throw new BadRequestException('该学员已在此班级中');

            // 校验学员是否购买了该班级对应的课程
            const courseIds = cls.assignments.map((a: any) => a.course_id);
            if (courseIds.length > 0) {
                const hasAsset = await prisma.finAssetAccount.findFirst({
                    where: { student_id: studentId, course_id: { in: courseIds }, status: 'ACTIVE' }
                });
                const hasOrder = await prisma.finOrder.findFirst({
                    where: { student_id: studentId, course_id: { in: courseIds }, status: 'PAID' }
                });
                if (!hasAsset && !hasOrder) {
                    throw new BadRequestException('该学员尚未购买此班级对应的课程，请先完成报名缴费');
                }
            }

            await prisma.eduStudentInClass.create({
                data: { student_id: studentId, class_id: classId }
            });
            await prisma.edClass.update({
                where: { id: classId },
                data: { enrolled: { increment: 1 } }
            });
            return { success: true, message: '学员已加入班级' };
        });
    }

    /**
     * 开班：将 PENDING 班升级为 ONGOING，同时发布草稿排课
     * 条件：enrolled >= min_students（否则抛出异常，但 force=true 可强制开班）
     */
    async openClass(classId: string, force = false) {
        const cls = await (this.prisma as any).edClass.findUnique({ where: { id: classId } });
        if (!cls) throw new NotFoundException('班级不存在');
        if (cls.status === 'ONGOING') throw new BadRequestException('班级已处于开班状态');
        if (cls.status === 'CANCELLED' || cls.status === 'COMPLETED') {
            throw new BadRequestException(`班级状态为 ${cls.status}，无法开班`);
        }
        if (!force && cls.enrolled < cls.min_students) {
            throw new BadRequestException(
                `当前人数 ${cls.enrolled} 未达到开班要求 ${cls.min_students} 人，如需强制开班请使用 force=true`
            );
        }
        return (this.prisma as any).$transaction(async (tx: any) => {
            // 升级班级状态
            const updated = await tx.edClass.update({
                where: { id: classId },
                data: { status: 'ONGOING' }
            });
            // 将草稿排课一并发布
            const result = await tx.edLessonSchedule.updateMany({
                where: {
                    assignment: { class_id: classId },
                    status: 'DRAFT'
                },
                data: { status: 'PUBLISHED' }
            });
            return { success: true, class: updated, publishedSchedules: result.count };
        });
    }

    /**
     * 查询招生中（PENDING）的班级列表，便于管理员决定何时开班
     */
    async getPendingClasses(campusId?: string) {
        const where: any = { status: 'PENDING' };
        if (campusId) where.campus_id = campusId;
        const classes = await (this.prisma as any).edClass.findMany({
            where,
            include: {
                assignments: { include: { course: true, teacher: true } },
                students: { include: { student: true } }
            },
            orderBy: { enrolled: 'desc' }
        });
        return classes.map((c: any) => ({
            ...c,
            readyToOpen: c.enrolled >= c.min_students,
            shortage: Math.max(0, c.min_students - c.enrolled)
        }));
    }

    async updateCourse(id: string, data: Partial<{ status: string; name: string; price: number; total_lessons: number; category: string; campus_id: string }>) {
        return (this.prisma as any).edCourse.update({ where: { id }, data });
    }

    async deleteCourse(id: string) {
        // 检查是否有依赖项
        const assignments = await (this.prisma as any).edClassAssignment.count({ where: { course_id: id } });
        if (assignments > 0) {
            throw new BadRequestException('该课程已分配给班级，无法删除，请先移除排课关联');
        }
        
        const orders = await (this.prisma as any).finOrder.count({ where: { course_id: id } });
        if (orders > 0) {
           throw new BadRequestException('该课程已有学生选购订单，无法删除');
        }

        return (this.prisma as any).edCourse.delete({ where: { id } });
    }

    async getClassrooms(campusId?: string) {
        return (this.prisma as any).eduClassroom.findMany({
            where: campusId ? { campus_id: campusId } : {},
            orderBy: { name: 'asc' }
        });
    }

    async findAvailableClassroom(campusId: string, startTime: Date, endTime: Date) {
        const classrooms = await (this.prisma as any).eduClassroom.findMany({
            where: { campus_id: campusId }
        });

        for (const room of classrooms) {
            const conflict = await (this.prisma as any).edLessonSchedule.findFirst({
                where: {
                    classroom_id: room.id,
                    status: 'PUBLISHED',
                    start_time: { lt: endTime },
                    end_time: { gt: startTime }
                }
            });

            if (!conflict) return room;
        }
        return null;
    }
}
