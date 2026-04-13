import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachingService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 作业分发与提交 (Homeworks)
    // =====================================
    async publishHomework(teacherId: string, data: { title: string; content: string; classId: string; assignmentId?: string; deadline: string; attachmentName?: string; attachmentUrl?: string }) {
        // 优先使用 assignmentId，否则用 classId 查 assignment（兼容老前端）
        const assignmentId = data.assignmentId || data.classId;
        const assignment = await this.prisma.edClassAssignment.findUnique({
            where: { id: assignmentId }
        });
        if (!assignment) throw new NotFoundException('找不到对应教学分配');

        return this.prisma.teachHomework.create({
            data: {
                title: data.title,
                content: data.content,
                deadline: new Date(data.deadline),
                assignment_id: assignment.id,
                class_id: assignment.class_id,   // 冗余字段，简化学员查询
                teacher_id: teacherId,
                attachmentName: data.attachmentName,
                attachmentUrl: data.attachmentUrl
            }
        });
    }

    async submitHomework(studentId: string, data: { homeworkId: string; content: string }) {
        const hw = await this.prisma.teachHomework.findUnique({ where: { id: data.homeworkId } });
        if (!hw) throw new NotFoundException('找不到指定作业');

        // 欠费校验：剩余课时 > 0 才可提交作业
        if (hw.class_id) {
            const assignment = await this.prisma.edClassAssignment.findFirst({ where: { class_id: hw.class_id } });
            if (assignment) {
                const account = await this.prisma.finAssetAccount.findFirst({
                    where: { student_id: studentId, course_id: assignment.course_id, status: 'ACTIVE' }
                });
                if (account && account.remaining_qty <= 0) {
                    throw new ForbiddenException('课时余额为0，请先续费后再提交作业');
                }
            }
        }

        const now = new Date();
        const isLate = now > hw.deadline;

        // 查是否存在已退回的提交，如果存在则覆盖重交（submission_count + 1）
        const existing = await this.prisma.teachHomeworkSubmission.findFirst({
            where: { homework_id: data.homeworkId, student_id: studentId }
        });

        if (existing) {
            if (existing.status !== 'RETURNED') {
                throw new BadRequestException('您已提交过该作业，如需修改请等待教师退回');
            }
            // 重新提交
            return this.prisma.teachHomeworkSubmission.update({
                where: { id: existing.id },
                data: {
                    content: data.content,
                    status: isLate ? 'LATE' : 'SUBMITTED',
                    submission_count: { increment: 1 },
                    submittedAt: now,
                    score: null,
                    feedback: null,
                }
            });
        }

        return this.prisma.teachHomeworkSubmission.create({
            data: {
                homework_id: data.homeworkId,
                student_id: studentId,
                content: data.content,
                status: isLate ? 'LATE' : 'SUBMITTED',
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
        if (sub.status === 'RETURNED') {
            throw new BadRequestException('该提交已被退回，等待学员重交后再批改');
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

    /**
     * 教师退回作业，要求学员重新提交
     */
    async returnSubmission(teacherId: string, data: { submissionId: string; feedback: string }) {
        const sub = await this.prisma.teachHomeworkSubmission.findUnique({
            where: { id: data.submissionId },
            include: { homework: true }
        });
        if (!sub) throw new NotFoundException('找不到该作业提交记录');
        if (sub.homework.teacher_id !== teacherId) {
            throw new BadRequestException('越权访问');
        }
        if (sub.status === 'RETURNED') {
            throw new BadRequestException('已处于退回状态');
        }

        return this.prisma.teachHomeworkSubmission.update({
            where: { id: data.submissionId },
            data: { status: 'RETURNED', feedback: data.feedback }
        });
    }

    /**
     * 学员视角查询自己的作业（优化查询链路，利用 TeachHomework.class_id 冗余字段）
     */
    async getMyHomeworks(studentId: string) {
        const inClasses = await this.prisma.eduStudentInClass.findMany({
            where: { student_id: studentId },
            select: { class_id: true }
        });
        const classIds = inClasses.map(c => c.class_id);
        if (classIds.length === 0) return [];

        return this.prisma.teachHomework.findMany({
            where: { class_id: { in: classIds } },
            orderBy: { createdAt: 'desc' },
            include: {
                submissions: { where: { student_id: studentId } },
                assignment: { include: { course: true, class: true } }
            }
        });
    }

    // =====================================
    // 考勤 + 课消合并流程
    // 教师录入考勤即自动扣课时；请假(leave)不扣
    // =====================================
    async submitAttendance(data: { lessonId: string; operatorId: string; attendances: { studentId: string; status: string }[] }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId },
            include: { assignment: true }
        });
        if (!lesson) throw new NotFoundException('找不到该课次记录');
        if (lesson.is_consumed) throw new BadRequestException('该课次已完成课消，不可重复登记');

        // 获取课程 id：优先用冗余的 course_id，否则回退 assignment.course_id
        const courseId = lesson.course_id || lesson.assignment.course_id;

        return this.prisma.$transaction(async (prisma) => {
            for (const record of data.attendances) {
                // 后端权威计算 deduct_amount
                const computedDeduct =
                    record.status === 'leave' ? 0 :   // 请假不扣
                    record.status === 'present' ? 1 :
                    record.status === 'late' ? 1 :
                    record.status === 'absent' ? 1 : 0;

                const att = await prisma.teachAttendance.create({
                    data: {
                        lesson_id: data.lessonId,
                        student_id: record.studentId,
                        status: record.status,
                        deduct_amount: computedDeduct,
                        deduct_status: 'PENDING'
                    }
                });

                // 立即扣课时（如果 deduct > 0）
                if (computedDeduct > 0) {
                    const account = await prisma.finAssetAccount.findFirst({
                        where: { student_id: record.studentId, course_id: courseId },
                        orderBy: { updatedAt: 'desc' }
                    });

                    if (account && account.remaining_qty >= computedDeduct) {
                        const updated = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: {
                                remaining_qty: { decrement: computedDeduct },
                            }
                        });
                        await prisma.finAssetLedger.create({
                            data: {
                                account_id: account.id,
                                type: 'CONSUME',
                                change_qty: -computedDeduct,
                                balance_snapshot: updated.remaining_qty,
                                ref_id: `CONSUME-${data.lessonId}-${record.studentId}`
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

            // 课次标记完成并扣费
            await prisma.edLessonSchedule.update({
                where: { id: data.lessonId },
                data: { status: 'COMPLETED', is_consumed: true }
            });

            await prisma.sysAuditLog.create({
                data: {
                    action: 'ATTENDANCE_AND_CONSUMPTION',
                    entity_type: 'LESSON_SCHEDULE',
                    entity_id: data.lessonId,
                    operator_id: data.operatorId,
                    details: JSON.stringify({ count: data.attendances.length })
                }
            });

            return { success: true, recordsProcessed: data.attendances.length };
        });
    }

    /**
     * 课消撤销（T+3 天内允许 CAMPUS_ADMIN/ADMIN 撤销）
     */
    async revokeConsumption(lessonId: string, operatorId: string, operatorRole: string) {
        if (operatorRole !== 'ADMIN' && operatorRole !== 'CAMPUS_ADMIN') {
            throw new ForbiddenException('仅 ADMIN/CAMPUS_ADMIN 可撤销课消');
        }

        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: lessonId },
            include: { attendances: true }
        });
        if (!lesson) throw new NotFoundException('课次不存在');
        if (!lesson.is_consumed) throw new BadRequestException('该课次尚未完成课消，无需撤销');

        // T+3 天限制
        const now = Date.now();
        const lessonEnd = lesson.end_time.getTime();
        if (now - lessonEnd > 3 * 24 * 60 * 60 * 1000) {
            throw new BadRequestException('超出撤销时限（课次结束后 3 天内可撤销）');
        }

        return this.prisma.$transaction(async (prisma) => {
            for (const att of lesson.attendances) {
                if (att.deduct_status === 'DEDUCTED' && att.deduct_amount > 0) {
                    const courseId = lesson.course_id;
                    const account = await prisma.finAssetAccount.findFirst({
                        where: { student_id: att.student_id, ...(courseId ? { course_id: courseId } : {}) },
                        orderBy: { updatedAt: 'desc' }
                    });
                    if (account) {
                        const updated = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: { remaining_qty: { increment: att.deduct_amount } }
                        });
                        await prisma.finAssetLedger.create({
                            data: {
                                account_id: account.id,
                                type: 'CONSUME_REVOKE',
                                change_qty: att.deduct_amount,
                                balance_snapshot: updated.remaining_qty,
                                ref_id: `REVOKE-${lessonId}-${att.student_id}`
                            }
                        });
                    }
                }
                await prisma.teachAttendance.update({
                    where: { id: att.id },
                    data: { deduct_status: 'REVOKED', revoked_at: new Date() }
                });
            }

            await prisma.edLessonSchedule.update({
                where: { id: lessonId },
                data: { is_consumed: false, status: 'SCHEDULED' }
            });

            await prisma.sysAuditLog.create({
                data: {
                    action: 'CONSUMPTION_REVOKE',
                    entity_type: 'LESSON_SCHEDULE',
                    entity_id: lessonId,
                    operator_id: operatorId,
                    details: JSON.stringify({ lesson_no: lesson.lesson_no, reverted: lesson.attendances.length })
                }
            });

            return { success: true, message: '课消已撤销，课时已恢复' };
        });
    }

    // =====================================
    // 请假补课管理 (Leave & Makeup)
    // =====================================
    async applyLeave(data: { studentId: string; lessonId: string; reason: string; applicantId: string }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({ where: { id: data.lessonId } });
        if (!lesson) throw new NotFoundException('课次不存在');
        if (lesson.status === 'COMPLETED') throw new BadRequestException('该课次已结束，无法请假');

        const existing = await (this.prisma as any).leaveRecord.findFirst({
            where: { student_id: data.studentId, lesson_id: data.lessonId, status: 'PENDING' }
        });
        if (existing) throw new BadRequestException('已有待审批的请假申请');

        return (this.prisma as any).leaveRecord.create({
            data: {
                student_id: data.studentId,
                lesson_id: data.lessonId,
                reason: data.reason,
                status: 'PENDING',
                applicant_id: data.applicantId,
            },
        });
    }

    async approveLeave(data: { leaveId: string; approverId: string; isApproved: boolean; makeupLessonId?: string }) {
        const leave = await (this.prisma as any).leaveRecord.findUnique({ where: { id: data.leaveId } });
        if (!leave) throw new NotFoundException('请假记录不存在');
        if (leave.status !== 'PENDING') throw new BadRequestException('该申请已处理');

        return (this.prisma as any).leaveRecord.update({
            where: { id: data.leaveId },
            data: {
                status: data.isApproved ? 'APPROVED' : 'REJECTED',
                approver_id: data.approverId,
                makeup_lesson_id: data.makeupLessonId || null,
            },
        });
    }

    async getLeaveRecords(filters?: { studentId?: string; status?: string }) {
        return (this.prisma as any).leaveRecord.findMany({
            where: {
                ...(filters?.studentId ? { student_id: filters.studentId } : {}),
                ...(filters?.status ? { status: filters.status } : {}),
            },
            include: {
                student: true,
                lesson: { include: { assignment: { include: { course: true, class: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // 兼容旧接口：保留 confirmLessonConsumption 作为补扣入口
    async confirmLessonConsumption(lessonId: string, operatorId: string) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: lessonId },
            include: { assignment: true, attendances: true }
        });

        if (!lesson) throw new NotFoundException('课次不存在');

        const courseId = lesson.course_id || lesson.assignment.course_id;

        return this.prisma.$transaction(async (prisma) => {
            for (const att of lesson.attendances) {
                if (att.deduct_amount > 0 && att.deduct_status === 'PENDING') {
                    const account = await prisma.finAssetAccount.findFirst({
                        where: { student_id: att.student_id, course_id: courseId },
                        orderBy: { updatedAt: 'desc' }
                    });

                    if (account && account.remaining_qty >= att.deduct_amount) {
                        const updatedAccount = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: { remaining_qty: { decrement: att.deduct_amount } }
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
