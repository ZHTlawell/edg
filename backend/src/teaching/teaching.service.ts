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
                class_id: data.classId,
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
    async submitAttendance(operatorId: string, data: { lessonId: string; attendances: { studentId: string; status: string; deductAmount: number }[] }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId },
            include: { class: true }
        });
        if (!lesson) throw new NotFoundException('找不到该课次记录');

        // 开启事务：处理所有学生的考勤登记，并对发生了消费的学员扣除课时余额
        return this.prisma.$transaction(async (prisma) => {
            const results = [];

            for (const record of data.attendances) {
                let deductStatus = 'SKIPPED'; // 默认不扣课

                // 如果产生了实际课时消耗 (deductAmount > 0，例如出勤、旷课缺席等)
                if (record.deductAmount > 0) {
                    // 寻找该学生关联此课程的钱包
                    const account = await prisma.finAssetAccount.findFirst({
                        where: {
                            student_id: record.studentId,
                            course_id: lesson.class.course_id
                        }
                    });

                    if (account && account.remaining_qty >= record.deductAmount) {
                        // 扣除课时
                        const updatedAccount = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: {
                                remaining_qty: { decrement: record.deductAmount },
                                status: account.remaining_qty === record.deductAmount ? 'DEPLETED' : account.status
                            }
                        });

                        // 资金链路留痕：生成消课流水 (Ledger)
                        await prisma.finAssetLedger.create({
                            data: {
                                account_id: account.id,
                                type: 'CONSUME',
                                change_qty: -record.deductAmount,
                                balance_snapshot: updatedAccount.remaining_qty,
                                ref_id: `ATTENDANCE-${data.lessonId}`
                            }
                        });

                        deductStatus = 'DEDUCTED';
                    } else {
                        // 余额不足，强行登记但标记为失败，真实场景应触发欠费预警
                        deductStatus = 'FAILED_INSUFFICIENT_BALANCE';
                    }
                }

                // 落库具体的考勤记录单
                const att = await prisma.teachAttendance.create({
                    data: {
                        lesson_id: data.lessonId,
                        student_id: record.studentId,
                        status: record.status,
                        deduct_status: deductStatus,
                        deduct_amount: record.deductAmount
                    }
                });

                results.push(att);
            }

            // 更新本节课的主状态为“已完结”
            await prisma.edLessonSchedule.update({
                where: { id: data.lessonId },
                data: { status: 'COMPLETED' }
            });

            return {
                success: true,
                recordsProcessed: results.length,
                message: '考勤登记完毕，产生的课时消耗已自动核减'
            };
        });
    }
}
