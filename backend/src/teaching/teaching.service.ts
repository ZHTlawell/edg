import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachingService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 作业分发与提交 (Homeworks)
    // =====================================
    async publishHomework(teacherId: string, data: { title: string; content: string; classId: string; deadline: string; attachmentName?: string; attachmentUrl?: string }) {
        const cls = await this.prisma.edClass.findUnique({ where: { id: data.classId } });
        if (!cls) throw new NotFoundException('找不到相关班级');

        return this.prisma.teachHomework.create({
            data: {
                title: data.title,
                content: data.content,
                deadline: new Date(data.deadline),
                assignment_id: data.classId, // Here the frontend 'classId' should be the assignmentId for homework
                teacher_id: teacherId,
                attachmentName: data.attachmentName,
                attachmentUrl: data.attachmentUrl
            }
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
    // 考勤登记与核减资产 (Attendance & Deductions)
    // =====================================
    async submitAttendance(data: { lessonId: string; attendances: { studentId: string; status: string; deductAmount: number }[] }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId }
        });
        if (!lesson) throw new NotFoundException('找不到该课次记录');

        return this.prisma.$transaction(async (prisma) => {
            const results = [];
            for (const record of data.attendances) {
                const att = await prisma.teachAttendance.create({
                    data: {
                        lesson_id: data.lessonId,
                        student_id: record.studentId,
                        status: record.status,
                        deduct_status: 'PENDING',
                        deduct_amount: record.deductAmount
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
                if (att.deduct_amount > 0 && att.deduct_status === 'PENDING') {
                    const account = await prisma.finAssetAccount.findFirst({
                        where: {
                            student_id: att.student_id,
                            course_id: (lesson as any).assignment.course_id
                        }
                    });

                    if (account && account.remaining_qty >= att.deduct_amount) {
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
