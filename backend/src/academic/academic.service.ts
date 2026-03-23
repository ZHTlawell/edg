import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 课程管理 (Courses)
    // =====================================
    async createCourse(data: any) {
        // Map frontend fields (if present) to backend schema
        const mappedData = {
            name: data.name,
            category: data.category,
            price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
            total_lessons: data.total_lessons || data.totalLessons || 10,
            is_standard: !!data.is_standard,
            standard_id: data.standard_id || null,
            campus_id: data.campus_id || null,
            instructor_id: data.instructor_id || null,
        };

        if (mappedData.standard_id) {
            const standard = await (this.prisma as any).stdCourseStandard.findUnique({ where: { id: mappedData.standard_id } });
            if (!standard) throw new BadRequestException('无效的课程标准');
            if (standard.status === 'DISABLED') throw new BadRequestException('该课程标准已停用，无法开设新课程');
        }

        return this.prisma.edCourse.create({
            data: {
                ...mappedData,
                status: 'ENABLED'
            },
        });
    }

    async getAllCourses(campusId?: string) {
        console.log(`[AcademicService] Fetching courses. Filter campusId: "${campusId}"`);
        const query: any = {
            where: {
                status: 'ENABLED',
                ...(campusId ? {
                    OR: [
                        { campus_id: campusId },
                        { campus_id: null },
                        { is_standard: true }
                    ]
                } : {})
            },
            include: {
                instructor: true,
            }
        };
        const courses = await this.prisma.edCourse.findMany(query);
        console.log(`[AcademicService] Found ${courses.length} courses in DB after filter.`);
        if (courses.length > 0) {
            console.log(`[AcademicService] Sample courses: ${courses.slice(0, 3).map(c => c.name).join(', ')}`);
        }

        // 获取所有校区管理员的校区名称映射
        const admins = await this.prisma.sysUser.findMany({
            where: { role: 'CAMPUS_ADMIN' },
            select: { campus_id: true, campusName: true }
        });

        return courses.map((c: any) => {
            const campusName = admins.find(a => a.campus_id === c.campus_id)?.campusName || '总校区';
            return {
                id: c.id,
                code: c.id.substring(0, 8).toUpperCase(), // 临时生成编号
                name: c.name,
                category: c.category,
                level: '中级', // 默认
                price: `¥${c.price.toLocaleString()}`,
                totalLessons: c.total_lessons,
                status: c.status.toLowerCase(),
                campus: campusName,
                instructor: c.instructor?.name || '未分配',
                updateTime: new Date().toLocaleDateString(),
                campus_id: c.campus_id
            };
        });
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
            // 1. Create Class
            const newClass = await tx.edClass.create({
                data: {
                    name: data.name,
                    campus_id: data.campus_id,
                    capacity: data.capacity,
                    status: 'ONGOING'
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
                    const { startDate, lessonsCount, durationMinutes, classroom } = data.assignment.schedule;
                    
                    // 自动分配逻辑：如果前端没传具体教室，我们尝试从本校区选一个
                    let autoRoom = null;
                    if (!classroom) {
                        const rooms = await tx.eduClassroom.findMany({ where: { campus_id: data.campus_id } });
                        if (rooms.length > 0) autoRoom = rooms[0]; // 简化逻辑：暂选第一个，后续逻辑可优化为查重
                    }

                    const schedules = [];
                    let currentDate = new Date(startDate);

                    for (let i = 1; i <= lessonsCount; i++) {
                        schedules.push({
                            assignment_id: newAssignment.id,
                            lesson_no: i,
                            start_time: new Date(currentDate),
                            end_time: new Date(currentDate.getTime() + durationMinutes * 60 * 1000),
                            classroom: classroom || autoRoom?.name || '待分配',
                            classroom_id: autoRoom?.id || null,
                            status: 'DRAFT'
                        });
                        currentDate.setDate(currentDate.getDate() + 7);
                    }

                    await tx.edLessonSchedule.createMany({
                        data: schedules
                    });
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

    async getClassesByCampus(campusId: string) {
        return (this.prisma as any).edClass.findMany({
            where: { campus_id: campusId },
            include: {
                assignments: {
                    include: {
                        course: true,
                        teacher: true,
                        schedules: true
                    }
                }
            }
        });
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
                                    where: { status: 'PUBLISHED' },
                                    orderBy: { start_time: 'asc' }
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
                class: true,
                course: true,
                teacher: true,
                schedules: {
                    orderBy: { start_time: 'asc' }
                }
            }
        });

        return assignments.map((a: any) => ({
            ...a.class,
            course: a.course,
            teacher: a.teacher,
            teacher_id: a.teacher_id,
            assignment_id: a.id,
            schedules: a.schedules
        }));
    }

    async generateDraftSchedules(assignmentId: string, startDate: Date, lessonsCount: number, durationMinutes: number) {
        const schedules = [];
        let currentDate = new Date(startDate);

        for (let i = 1; i <= lessonsCount; i++) {
            schedules.push({
                assignment_id: assignmentId,
                lesson_no: i,
                start_time: new Date(currentDate),
                end_time: new Date(currentDate.getTime() + durationMinutes * 60 * 1000),
                classroom: '待分配',
                status: 'DRAFT'
            });
            currentDate.setDate(currentDate.getDate() + 7);
        }

        return (this.prisma as any).edLessonSchedule.createMany({
            data: schedules
        });
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

    async getClassrooms(campusId: string) {
        return (this.prisma as any).eduClassroom.findMany({
            where: { campus_id: campusId },
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
