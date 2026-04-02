import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachingService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 作业分发与提交 (Homeworks)
    // =====================================
    async publishHomework(teacherId: string, data: { title: string; content: string; classId: string; deadline: string; lesson_id?: string; attachmentName?: string; attachmentUrl?: string }) {
        const cls = await this.prisma.edClass.findUnique({ where: { id: data.classId } });
        if (!cls) throw new NotFoundException('找不到相关班级');

        return this.prisma.teachHomework.create({
            data: {
                title: data.title,
                content: data.content,
                deadline: new Date(data.deadline),
                assignment_id: data.classId,
                teacher_id: teacherId,
                lesson_id: data.lesson_id || null,
                attachmentName: data.attachmentName,
                attachmentUrl: data.attachmentUrl
            }
        });
    }

    async getHomeworkByLesson(lessonId: string) {
        return this.prisma.teachHomework.findMany({
            where: { lesson_id: lessonId },
            include: {
                teacher: { select: { id: true, name: true } },
                submissions: { select: { id: true, student_id: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async submitHomework(studentId: string, data: { homeworkId: string; content: string }) {
        const hw = await this.prisma.teachHomework.findUnique({ where: { id: data.homeworkId } });
        if (!hw) throw new NotFoundException('找不到指定作业');

        return this.prisma.teachHomeworkSubmission.create({
            data: {
                homework_id: data.homeworkId,
                student_id: studentId,
                content: data.content,
            }
        });
    }

    async gradeHomework(teacherId: string, data: { submissionId: string; score: number; feedback: string }) {
        const sub = await this.prisma.teachHomeworkSubmission.findUnique({
            where: { id: data.submissionId },
            include: { homework: true }
        });

        if (!sub) throw new NotFoundException('找不到该作业提交记录');
        if (sub.homework.teacher_id !== teacherId) {
            throw new BadRequestException('越权访问，只能批改您自己发布的作业');
        }

        return this.prisma.teachHomeworkSubmission.update({
            where: { id: data.submissionId },
            data: {
                score: data.score,
                feedback: data.feedback,
                status: 'GRADED'
            }
        });
    }

    // =====================================
    // 学员作业查询
    // =====================================
    async getStudentHomeworks(studentId: string) {
        // 1. Find classes the student is enrolled in
        const enrollments = await this.prisma.eduStudentInClass.findMany({
            where: { student_id: studentId },
            select: { class_id: true },
        });
        const classIds = enrollments.map(e => e.class_id);
        if (classIds.length === 0) return [];

        // 2. Find class assignments for those classes
        const assignments = await this.prisma.edClassAssignment.findMany({
            where: { class_id: { in: classIds } },
            select: { id: true },
        });
        const assignmentIds = assignments.map(a => a.id);
        if (assignmentIds.length === 0) return [];

        // 3. Find homeworks + student's submissions
        return this.prisma.teachHomework.findMany({
            where: { assignment_id: { in: assignmentIds } },
            include: {
                teacher: { select: { id: true, name: true } },
                submissions: {
                    where: { student_id: studentId },
                    take: 1,
                },
                assignment: {
                    include: { course: { select: { id: true, name: true } } },
                },
            },
            orderBy: { deadline: 'desc' },
        });
    }

    // =====================================
    // 作业种子数据（开发用）
    // =====================================
    async seedHomeworks() {
        // Find an assignment + teacher to attach homeworks to
        const assignment = await this.prisma.edClassAssignment.findFirst({
            include: { course: true, teacher: true },
        });
        if (!assignment) throw new NotFoundException('没有班级课程分配记录，请先购买课程以触发自动分班');

        const existing = await this.prisma.teachHomework.count({
            where: { assignment_id: assignment.id },
        });
        if (existing >= 3) return { message: '作业数据已存在', count: existing };

        const now = new Date();
        const homeworks = [
            {
                title: '第一阶段：核心组件实战',
                content: '请完成一个带有状态流转的订单卡片组件，要求使用 TailwindCSS 实现响应式布局。提交代码截图或在线链接。',
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
                assignment_id: assignment.id,
                teacher_id: assignment.teacher_id,
            },
            {
                title: '第二阶段：数据可视化图表',
                content: '使用 ECharts 或 Recharts 实现一个包含柱状图和折线图的数据仪表盘页面，数据源可自拟。',
                deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 days
                assignment_id: assignment.id,
                teacher_id: assignment.teacher_id,
            },
            {
                title: '第三阶段：全栈 CRUD 模块',
                content: '实现一个完整的学员管理模块，包含列表查询、新增、编辑、删除功能。前端使用 React，后端使用 NestJS + Prisma。',
                deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // +21 days
                assignment_id: assignment.id,
                teacher_id: assignment.teacher_id,
            },
        ];

        const created = [];
        for (const hw of homeworks) {
            const record = await this.prisma.teachHomework.create({ data: hw });
            created.push(record);
        }
        return { message: `已创建 ${created.length} 条作业`, homeworks: created };
    }

    // =====================================
    // 考勤数据查询
    // =====================================
    async getAttendanceRecords(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.lesson = { assignment: { class: { campus_id: campusId } } };
        }
        const records = await this.prisma.teachAttendance.findMany({
            where,
            include: {
                lesson: {
                    include: {
                        assignment: {
                            include: { class: true, course: true }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' },
            take: 500
        });
        return records.map(r => ({
            id: r.id,
            lesson_id: r.lesson_id,
            student_id: r.student_id,
            class_id: r.lesson?.assignment?.class?.id,
            course_id: r.lesson?.assignment?.course_id,
            status: r.status.toLowerCase(),
            deductHours: r.deduct_amount,
            createdAt: (r.lesson?.start_time ?? new Date()).toISOString()
        }));
    }

    // =====================================
    // 考勤登记与核减资产 (Attendance & Deductions)
    // =====================================
    async submitAttendance(data: { lessonId: string; attendances: { studentId: string; status: string; deductAmount: number }[] }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId }
        });
        if (!lesson) throw new NotFoundException('找不到该课次记录');

        return this.prisma.$transaction(async (prisma) => {
            // Get approved leaves for this lesson
            const approvedLeaves = await prisma.leaveRequest.findMany({
                where: { lesson_id: data.lessonId, status: 'APPROVED' },
                select: { student_id: true }
            });
            const leaveStudentIds = new Set(approvedLeaves.map(l => l.student_id));

            const results = [];
            for (const record of data.attendances) {
                // Force approved-leave students to LEAVE status with 0 deduction
                const isOnLeave = leaveStudentIds.has(record.studentId);
                const att = await prisma.teachAttendance.create({
                    data: {
                        lesson_id: data.lessonId,
                        student_id: record.studentId,
                        status: isOnLeave ? 'LEAVE' : record.status,
                        deduct_status: isOnLeave ? 'NO_DEDUCTION' : 'PENDING',
                        deduct_amount: isOnLeave ? 0 : record.deductAmount
                    }
                });
                results.push(att);
            }

            // 更新课次状态为 COMPLETED，但 is_consumed 仍为 false
            await prisma.edLessonSchedule.update({
                where: { id: data.lessonId },
                data: { status: 'COMPLETED' }
            });

            return { success: true, recordsProcessed: results.length };
        });
    }

    // =====================================
    // 请假流程 (Leave Requests)
    // =====================================

    async applyLeave(studentId: string, data: { lessonId: string; reason: string; campusId?: string }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId },
            include: { assignment: { include: { class: true } } }
        });
        if (!lesson) throw new NotFoundException('课次不存在');
        if (lesson.is_consumed) throw new BadRequestException('该课次已完成，无法请假');
        if (new Date(lesson.start_time) < new Date()) throw new BadRequestException('课程已开始，无法请假');

        // Check no existing pending/approved leave
        const existing = await this.prisma.leaveRequest.findFirst({
            where: { lesson_id: data.lessonId, student_id: studentId, status: { in: ['PENDING', 'APPROVED'] } }
        });
        if (existing) throw new BadRequestException('该课次已有请假记录');

        return this.prisma.leaveRequest.create({
            data: {
                lesson_id: data.lessonId,
                student_id: studentId,
                campus_id: data.campusId || lesson.assignment.class.campus_id,
                reason: data.reason,
                status: 'PENDING',
            }
        });
    }

    async reviewLeave(data: { leaveRequestId: string; approverId: string; isApproved: boolean; reviewNote?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const leave = await prisma.leaveRequest.findUnique({
                where: { id: data.leaveRequestId },
                include: { lesson: true }
            });
            if (!leave) throw new NotFoundException('请假记录不存在');
            if (leave.status !== 'PENDING') throw new BadRequestException('该请假已处理');

            const updatedLeave = await prisma.leaveRequest.update({
                where: { id: leave.id },
                data: {
                    status: data.isApproved ? 'APPROVED' : 'REJECTED',
                    approver_id: data.approverId,
                    review_note: data.reviewNote || null,
                    reviewedAt: new Date(),
                }
            });

            // If approved, sync attendance to LEAVE with deduct_amount = 0
            if (data.isApproved) {
                const existingAtt = await prisma.teachAttendance.findFirst({
                    where: { lesson_id: leave.lesson_id, student_id: leave.student_id }
                });
                if (existingAtt && existingAtt.deduct_status !== 'DEDUCTED') {
                    await prisma.teachAttendance.update({
                        where: { id: existingAtt.id },
                        data: { status: 'LEAVE', deduct_amount: 0, deduct_status: 'NO_DEDUCTION' }
                    });
                }
            }

            return updatedLeave;
        });
    }

    async cancelLeave(leaveRequestId: string, studentId: string) {
        const leave = await this.prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
        if (!leave) throw new NotFoundException('请假记录不存在');
        if (leave.student_id !== studentId) throw new BadRequestException('无权操作');
        if (leave.status !== 'PENDING') throw new BadRequestException('只能撤回待审批的请假');

        return this.prisma.leaveRequest.update({
            where: { id: leave.id },
            data: { status: 'CANCELLED', updatedAt: new Date() }
        });
    }

    async getMyLeaves(studentId: string) {
        return this.prisma.leaveRequest.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            include: {
                lesson: {
                    include: { assignment: { include: { class: true, course: true } } }
                }
            }
        });
    }

    async getPendingLeaves(campusId?: string) {
        const where: any = { status: 'PENDING' };
        if (campusId) where.campus_id = campusId;
        return this.prisma.leaveRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                lesson: {
                    include: { assignment: { include: { class: true, course: true } } }
                }
            }
        });
    }

    // TC-01, TC-08: 校区端确认课消 (Confirm Consumption)
    async confirmLessonConsumption(lessonId: string, operatorId: string) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: lessonId },
            include: {
                assignment: {
                    include: {
                        class: true,
                        course: true
                    }
                },
                attendances: true
            }
        });

        if (!lesson) throw new NotFoundException('课次不存在');
        if (lesson.is_consumed) throw new BadRequestException('该课次已完成课消，不可重复操作');

        return this.prisma.$transaction(async (prisma) => {
            for (const att of lesson.attendances) {
                // Skip LEAVE / NO_DEDUCTION records
                if (att.deduct_status === 'NO_DEDUCTION' || att.deduct_status === 'DEDUCTED') continue;

                if (att.deduct_amount > 0 && att.deduct_status === 'PENDING') {
                    const account = await prisma.finAssetAccount.findFirst({
                        where: {
                            student_id: att.student_id,
                            course_id: (lesson as any).assignment.course_id
                        }
                    });

                    // Available = remaining - locked (locked lessons are pending refund)
                    const availableQty = account ? account.remaining_qty - account.locked_qty : 0;
                    if (account && availableQty >= att.deduct_amount) {
                        const updatedAccount = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: {
                                remaining_qty: { decrement: att.deduct_amount },
                                status: account.remaining_qty === att.deduct_amount ? 'DEPLETED' : account.status
                            }
                        });

                        await prisma.finAssetLedger.create({
                            data: {
                                account_id: account.id,
                                type: 'CONSUME',
                                change_qty: -att.deduct_amount,
                                balance_snapshot: updatedAccount.remaining_qty,
                                ref_id: `CONSUME-${lessonId}-${att.student_id}`
                            }
                        });

                        await prisma.teachAttendance.update({
                            where: { id: att.id },
                            data: { deduct_status: 'DEDUCTED' }
                        });
                    } else {
                        await prisma.teachAttendance.update({
                            where: { id: att.id },
                            data: { deduct_status: 'FAILED_INSUFFICIENT_BALANCE' }
                        });
                    }
                }
            }

            await prisma.edLessonSchedule.update({
                where: { id: lessonId },
                data: { is_consumed: true }
            });

            await prisma.sysAuditLog.create({
                data: {
                    action: 'LESSON_CONSUMPTION_CONFIRM',
                    entity_type: 'LESSON_SCHEDULE',
                    entity_id: lessonId,
                    operator_id: operatorId,
                    details: JSON.stringify({ lesson_no: lesson.lesson_no })
                }
            });

            return { success: true };
        });
    }
}
