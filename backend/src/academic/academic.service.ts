import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 课程管理 (Courses)
    // =====================================
    async createCourse(data: { name: string; category: string; price: number; total_lessons: number; campus_id?: string; instructor_id?: string }) {
        return this.prisma.edCourse.create({
            data,
        });
    }

    async getAllCourses() {
        return this.prisma.edCourse.findMany({
            where: { status: 'ENABLED' },
            include: {
                instructor: true,
                classes: {
                    include: {
                        teacher: true
                    }
                }
            }
        });
    }

    // =====================================
    // 班级与排课管理 (Classes & Schedules)
    // =====================================
    async createClass(data: { name: string; course_id: string; teacher_id: string; campus_id: string; capacity: number }) {
        // 校验课程和教师是否存在
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.course_id } });
        if (!course) throw new NotFoundException('找不到对应课程');

        return this.prisma.edClass.create({
            data: {
                name: data.name,
                course_id: data.course_id,
                teacher_id: data.teacher_id,
                campus_id: data.campus_id,
                capacity: data.capacity,
                status: 'ONGOING'
            },
        });
    }

    async getClassesByCampus(campusId: string) {
        return this.prisma.edClass.findMany({
            where: { campus_id: campusId },
            include: {
                course: true,
                teacher: true,
            }
        });
    }

    async getClassesByTeacher(teacherId: string) {
        return this.prisma.edClass.findMany({
            where: { teacher_id: teacherId, status: 'ONGOING' },
            include: {
                course: true,
                schedules: {
                    where: { status: 'SCHEDULED' },
                    orderBy: { start_time: 'asc' }
                }
            }
        });
    }

    // 为某个班级一键生成课次表 (Schedule lessons)
    async autoSchedule(classId: string, startDate: Date, lessonsCount: number, timesPerWeek: number) {
        const cls = await this.prisma.edClass.findUnique({ where: { id: classId } });
        if (!cls) throw new NotFoundException('班级不存在');

        // 这里是一个简化的自动排课逻辑演示：比如按每周的特定时间生成 N 节课
        // (实际项目应基于日历控件输入具体的日期和时间)
        const schedules = [];
        let currentDate = new Date(startDate);

        for (let i = 0; i < lessonsCount; i++) {
            schedules.push({
                class_id: classId,
                start_time: new Date(currentDate),
                end_time: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000), // 假设每节课2小时
                classroom: 'Default Room'
            });
            currentDate.setDate(currentDate.getDate() + 7); // 简化为每周同一天的课
        }

        await this.prisma.edLessonSchedule.createMany({
            data: schedules
        });

        return { message: `✅ 成功为班级生成 ${lessonsCount} 节次课表` };
    }
}
