/**
 * 教学服务
 * 职责：作业全生命周期、考勤登记与撤销、请假申请与审批、课消核算
 * 所属模块：教学运营
 * 被 TeachingController 依赖注入，内部大量 $transaction 保证数据一致性
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 教学业务服务
 * 提供教师作业发布、学员提交、考勤、课消、请假等核心流程
 */
@Injectable()
export class TeachingService {
    constructor(private prisma: PrismaService) { }

    // =====================================
    // 作业分发与提交 (Homeworks)
    // =====================================
    /**
     * 教师发布作业
     * @param teacherId 教师 ID（来自 JWT）
     * @param data 作业字段（含 classId/lessonId/title/content/附件等）
     */
    async publishHomework(teacherId: string, data: {
        title: string; content: string;
        classId?: string; class_id?: string;       // 兼容驼峰与下划线
        assignmentId?: string; assignment_id?: string;
        deadline: string; lesson_id?: string;
        attachmentName?: string; attachmentUrl?: string;
    }) {
        // 兼容前端字段名：assignmentId / assignment_id > classId / class_id
        const rawId = data.assignmentId || data.assignment_id || data.classId || data.class_id || '';

        // 先尝试直接当 assignment_id
        let assignment = await this.prisma.edClassAssignment.findUnique({ where: { id: rawId } });

        // 如果找不到，rawId 可能是 class_id，查该班级下属于此教师的 assignment
        if (!assignment && rawId) {
            assignment = await this.prisma.edClassAssignment.findFirst({
                where: { class_id: rawId, teacher_id: teacherId }
            });
        }

        if (!assignment) throw new NotFoundException('找不到对应教学分配，请确认班级与教师分配关系');

        return this.prisma.teachHomework.create({
            data: {
                title: data.title,
                content: data.content,
                deadline: new Date(data.deadline),
                assignment_id: assignment.id,
                class_id: assignment.class_id,     // 冗余字段，简化学员查询作业
                teacher_id: teacherId,
                lesson_id: data.lesson_id || null,
                attachmentName: data.attachmentName,
                attachmentUrl: data.attachmentUrl
            }
        });
    }

    /** 查询某课节关联的作业（含提交统计） */
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

    /**
     * 学员提交作业（文本或文件）
     * 幂等：同一作业重复提交更新记录
     */
    async submitHomework(studentId: string, data: { homeworkId: string; content: string; attachmentName?: string; attachmentUrl?: string }) {
        const hw = await this.prisma.teachHomework.findUnique({ where: { id: data.homeworkId } });
        if (!hw) throw new NotFoundException('找不到指定作业');

        // 欠费校验：剩余课时 > 0 才可提交
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

        // 支持退回后重交（status=RETURNED 的旧提交可覆盖）
        const existing = await this.prisma.teachHomeworkSubmission.findFirst({
            where: { homework_id: data.homeworkId, student_id: studentId }
        });
        if (existing) {
            if (existing.status !== 'RETURNED') {
                throw new BadRequestException('您已提交过该作业，如需修改请等待教师退回');
            }
            return this.prisma.teachHomeworkSubmission.update({
                where: { id: existing.id },
                data: {
                    content: data.content,
                    attachmentName: data.attachmentName ?? null,
                    attachmentUrl: data.attachmentUrl ?? null,
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
                attachmentName: data.attachmentName ?? null,
                attachmentUrl: data.attachmentUrl ?? null,
                status: isLate ? 'LATE' : 'SUBMITTED',
            }
        });
    }

    // 学生编辑已提交作业（仅 SUBMITTED/LATE 状态可编辑，GRADED 不可）
    /**
     * 学员编辑已提交但未批改的作业
     * 权限：只允许提交者本人修改
     */
    async editSubmission(studentId: string, data: { submissionId: string; content: string; attachmentName?: string; attachmentUrl?: string }) {
        const sub = await this.prisma.teachHomeworkSubmission.findUnique({ where: { id: data.submissionId } });
        if (!sub) throw new NotFoundException('找不到该提交记录');
        if (sub.student_id !== studentId) throw new ForbiddenException('只能编辑自己的提交');
        if (sub.status === 'GRADED') throw new BadRequestException('已批改的作业无法编辑');
        return this.prisma.teachHomeworkSubmission.update({
            where: { id: data.submissionId },
            data: {
                content: data.content,
                attachmentName: data.attachmentName ?? sub.attachmentName,
                attachmentUrl: data.attachmentUrl ?? sub.attachmentUrl,
                submittedAt: new Date(),
            }
        });
    }

    // 教师编辑已发布作业
    /**
     * 教师编辑已发布作业（标题/内容/截止日期/附件）
     * 权限：仅原发布教师可编辑
     */
    async editHomework(teacherId: string, data: { homeworkId: string; title?: string; content?: string; deadline?: string; attachmentName?: string; attachmentUrl?: string }) {
        const hw = await this.prisma.teachHomework.findUnique({ where: { id: data.homeworkId } });
        if (!hw) throw new NotFoundException('找不到该作业');
        if (hw.teacher_id !== teacherId) throw new ForbiddenException('只能编辑自己发布的作业');
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);
        if (data.attachmentName !== undefined) updateData.attachmentName = data.attachmentName;
        if (data.attachmentUrl !== undefined) updateData.attachmentUrl = data.attachmentUrl;
        return this.prisma.teachHomework.update({ where: { id: data.homeworkId }, data: updateData });
    }

    // 教师删除作业（级联删除所有提交）
    /**
     * 删除作业（级联删除提交记录）
     * 权限：仅原发布教师可删除
     */
    async deleteHomework(teacherId: string, homeworkId: string) {
        const hw = await this.prisma.teachHomework.findUnique({ where: { id: homeworkId } });
        if (!hw) throw new NotFoundException('找不到该作业');
        if (hw.teacher_id !== teacherId) throw new ForbiddenException('只能删除自己发布的作业');
        // 先删提交记录，再删作业
        await this.prisma.teachHomeworkSubmission.deleteMany({ where: { homework_id: homeworkId } });
        await this.prisma.teachHomework.delete({ where: { id: homeworkId } });
        return { success: true, message: '作业已删除' };
    }

    /**
     * 批改作业（给分 + 评语）
     * @param teacherId JWT 权威教师 ID（不信任前端）
     */
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
    /** 教师退回作业，要求学员重新提交 */
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

    // =====================================
    // 学员作业查询
    // =====================================
    /** 获取学员全部作业（含提交状态、批改结果） */
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

    /** 获取教师发布的全部作业（含提交统计） */
    async getTeacherHomeworks(teacherId: string) {
        return this.prisma.teachHomework.findMany({
            where: { teacher_id: teacherId },
            include: {
                teacher: { select: { id: true, name: true } },
                assignment: {
                    include: {
                        course: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                    },
                },
                submissions: {
                    select: { id: true, student_id: true, status: true, score: true, content: true, feedback: true, submittedAt: true, attachmentName: true, attachmentUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // =====================================
    // 作业种子数据（开发用）
    // =====================================
    /** 种子作业数据（演示/调试用） */
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
    // 班级成员查询（考勤用）
    // =====================================
    /** 查询班级成员（含学员基础信息） */
    async getClassMembers(classId: string) {
        const members = await this.prisma.eduStudentInClass.findMany({
            where: { class_id: classId },
            include: {
                student: {
                    select: { id: true, name: true, phone: true, accounts: { select: { remaining_qty: true } } },
                },
            },
        });
        return members.map(m => ({
            student_id: m.student_id,
            name: m.student.name,
            phone: m.student.phone,
            remainingQty: m.student.accounts?.reduce((sum: number, a: any) => sum + (a.remaining_qty || 0), 0) || 0,
        }));
    }

    // =====================================
    // 考勤数据查询
    // =====================================
    /**
     * 查询考勤记录
     * 根据 scope 中的 campusId / classId / studentId / teacherId / 时间范围过滤
     */
    async getAttendanceRecords(scope: { campusId?: string; classId?: string; studentId?: string; teacherId?: string; from?: string; to?: string } = {}) {
        const where: any = {};
        // 学员维度过滤
        if (scope.studentId) where.student_id = scope.studentId;
        // lesson 链路条件
        const lessonWhere: any = {};
        const assignmentWhere: any = {};
        if (scope.campusId) assignmentWhere.class = { campus_id: scope.campusId };
        if (scope.classId) assignmentWhere.class_id = scope.classId;
        if (scope.teacherId) assignmentWhere.teacher_id = scope.teacherId;
        if (Object.keys(assignmentWhere).length) lessonWhere.assignment = assignmentWhere;
        // 时间区间（按课次开始时间）
        if (scope.from || scope.to) {
            lessonWhere.start_time = {};
            if (scope.from) lessonWhere.start_time.gte = new Date(scope.from);
            if (scope.to) lessonWhere.start_time.lte = new Date(scope.to);
        }
        if (Object.keys(lessonWhere).length) where.lesson = lessonWhere;

        const records = await this.prisma.teachAttendance.findMany({
            where,
            include: {
                student: { select: { id: true, name: true } },
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
            student_name: (r as any).student?.name || '',
            class_id: r.lesson?.assignment?.class?.id,
            course_id: r.lesson?.assignment?.course_id,
            status: r.status.toLowerCase(),
            deductHours: r.deduct_amount,
            deductStatus: r.deduct_status?.toLowerCase(),
            createdAt: (r.lesson?.start_time ?? new Date()).toISOString()
        }));
    }

    // =====================================
    // 考勤登记与核减资产 (Attendance & Deductions)
    // =====================================
    /**
     * 提交考勤并触发课消
     * 事务内：写 TeachAttendance、扣减资产课时、更新课次状态
     */
    async submitAttendance(data: { lessonId: string; operatorId?: string; operatorRole?: string; operatorTeacherId?: string; operatorCampusId?: string; attendances: { studentId: string; status: string; deductAmount?: number }[] }) {
        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: data.lessonId },
            include: { assignment: { include: { class: true } } }
        });
        if (!lesson) throw new NotFoundException('找不到该课次记录');
        if (lesson.is_consumed) throw new BadRequestException('该课次已完成课消，不可重复登记');

        // 归属校验：教师只能登记自己授课的课次；校区管理员只能登记本校区课次
        if (data.operatorRole === 'TEACHER') {
            if (!data.operatorTeacherId || lesson.assignment.teacher_id !== data.operatorTeacherId) {
                throw new ForbiddenException('只能登记自己授课的课次考勤');
            }
        } else if (data.operatorRole === 'CAMPUS_ADMIN') {
            if (!data.operatorCampusId || lesson.assignment.class?.campus_id !== data.operatorCampusId) {
                throw new ForbiddenException('只能登记本校区的课次考勤');
            }
        }

        const courseId = lesson.course_id || lesson.assignment.course_id;

        return this.prisma.$transaction(async (prisma) => {
            // Get approved leaves for this lesson
            const approvedLeaves = await prisma.leaveRequest.findMany({
                where: { lesson_id: data.lessonId, status: 'APPROVED' },
                select: { student_id: true }
            });
            const leaveStudentIds = new Set(approvedLeaves.map(l => l.student_id));

            const results = [];
            for (const record of data.attendances) {
                const isOnLeave = leaveStudentIds.has(record.studentId);
                // 后端权威计算 deduct_amount：请假=0，其余默认 1（若前端传入则用前端值）
                const computedDeduct = isOnLeave ? 0 :
                    (record.status === 'leave' || record.status === 'LEAVE') ? 0 :
                    (record.deductAmount !== undefined ? record.deductAmount : 1);

                const att = await prisma.teachAttendance.create({
                    data: {
                        lesson_id: data.lessonId,
                        student_id: record.studentId,
                        status: isOnLeave ? 'LEAVE' : record.status,
                        deduct_status: isOnLeave ? 'NO_DEDUCTION' : 'PENDING',
                        deduct_amount: computedDeduct
                    }
                });

                // 自动扣课时（考勤即扣）
                if (computedDeduct > 0) {
                    const account = await prisma.finAssetAccount.findFirst({
                        where: { student_id: record.studentId, course_id: courseId, status: 'ACTIVE' },
                        orderBy: { updatedAt: 'desc' }
                    });
                    const availableQty = account ? account.remaining_qty - account.locked_qty : 0;
                    if (account && availableQty >= computedDeduct) {
                        const updated = await prisma.finAssetAccount.update({
                            where: { id: account.id },
                            data: { remaining_qty: { decrement: computedDeduct } }
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
                results.push(att);
            }

            // 考勤即扣：课次完成且已扣费
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

            return { success: true, recordsProcessed: results.length };
        });
    }

    /**
     * 课消撤销（T+3 天内允许 CAMPUS_ADMIN/ADMIN 撤销）
     */
    /**
     * 撤销课消：回滚已扣课时，课次状态回到未消状态
     * 权限：仅教师本人或本校区管理员
     */
    async revokeConsumption(lessonId: string, operatorId: string, operatorRole: string, operatorCampusId?: string) {
        if (operatorRole !== 'ADMIN' && operatorRole !== 'CAMPUS_ADMIN') {
            throw new ForbiddenException('仅 ADMIN/CAMPUS_ADMIN 可撤销课消');
        }

        const lesson = await this.prisma.edLessonSchedule.findUnique({
            where: { id: lessonId },
            include: { attendances: true, assignment: { include: { class: true } } }
        });
        if (!lesson) throw new NotFoundException('课次不存在');
        if (!lesson.is_consumed) throw new BadRequestException('该课次尚未完成课消，无需撤销');

        // 校区管理员只能撤销本校区课次
        if (operatorRole === 'CAMPUS_ADMIN') {
            if (!operatorCampusId || lesson.assignment.class?.campus_id !== operatorCampusId) {
                throw new ForbiddenException('只能撤销本校区课次的课消');
            }
        }

        const now = Date.now();
        if (now - lesson.end_time.getTime() > 3 * 24 * 60 * 60 * 1000) {
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
    // 请假流程 (Leave Requests)
    // =====================================

    /** 学员发起请假申请 */
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

    /** 教师/管理员审批请假（通过/拒绝） */
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

    /** 学员撤回自己未审批的请假 */
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

    /** 查询学员本人的所有请假记录 */
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

    /** 查询某课次已通过的请假记录（考勤登记时使用） */
    async getApprovedLeavesByLesson(lessonId: string) {
        return this.prisma.leaveRequest.findMany({
            where: { lesson_id: lessonId, status: 'APPROVED' },
            select: { id: true, student_id: true, reason: true }
        });
    }

    /** 查询待审批请假（按教师或校区过滤） */
    async getPendingLeaves(campusId?: string, teacherId?: string) {
        const where: any = { status: 'PENDING' };
        if (campusId) where.campus_id = campusId;
        // 教师只看自己所授课次的请假
        if (teacherId) where.lesson = { assignment: { teacher_id: teacherId } };
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
    /**
     * 教务主管确认课消
     * 将课次置为最终已课消状态（结转至财务），不可再撤销
     */
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
