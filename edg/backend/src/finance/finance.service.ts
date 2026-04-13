import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // 报名下单流程 (Enrollment & Payment)
    // ==========================================

    async createOrder(data: { studentId: string; courseId: string; orderSource: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法下单');

        // 防重复下单：PENDING_PAYMENT 或 PAID 的订单存在时拒绝
        const existingOrder = await this.prisma.finOrder.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: { in: ['PENDING_PAYMENT', 'PAID'] },
            },
        });
        if (existingOrder) {
            throw new BadRequestException('该课程已有有效订单，无需重复下单');
        }

        // 防重复购买：活跃资产账户仍有课时
        const activeAccount = await this.prisma.finAssetAccount.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: 'ACTIVE',
                remaining_qty: { gt: 0 }
            }
        });
        if (activeAccount) {
            throw new BadRequestException('该学员已购买此课程且仍有剩余课时，如需续费请走续费入口');
        }

        const order = await this.prisma.finOrder.create({
            data: {
                student_id: data.studentId,
                course_id: data.courseId,
                amount: course.price,             // 后端权威
                total_qty: course.total_lessons,  // 后端权威
                order_source: data.orderSource,
                operator_id: data.operatorId,
                status: 'PENDING_PAYMENT',
            },
        });
        return order;
    }

    /**
     * 续费下单：累加到原资产账户（不新建账户），支付完成后由 processPayment 累加
     */
    async createRenewalOrder(data: { studentId: string; courseId: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法续费');

        const existingAccount = await this.prisma.finAssetAccount.findFirst({
            where: { student_id: data.studentId, course_id: data.courseId },
            orderBy: { updatedAt: 'desc' }
        });
        if (!existingAccount) {
            throw new BadRequestException('未找到原资产账户，续费失败（请先首次购课）');
        }

        const order = await this.prisma.finOrder.create({
            data: {
                student_id: data.studentId,
                course_id: data.courseId,
                amount: course.price,
                total_qty: course.total_lessons,
                order_source: 'renewal',
                operator_id: data.operatorId,
                status: 'PENDING_PAYMENT',
            },
        });
        return order;
    }

    /**
     * 支付状态查询（供前端模拟支付轮询使用）
     */
    async getPaymentStatus(orderId: string) {
        const order = await this.prisma.finOrder.findUnique({
            where: { id: orderId },
            include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        if (!order) throw new NotFoundException('订单不存在');
        return {
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            latestPayment: order.payments[0] || null,
        };
    }

    async processPayment(data: { orderId: string; amount: number; channel: string; campusId: string; operatorId?: string; classId?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({ where: { id: data.orderId } });
            if (!order) throw new NotFoundException('找不到该订单');
            if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException(`该订单状态为 ${order.status}，无法重复支付`);

            // 后端金额校验：防篡改
            if (Math.abs(data.amount - order.amount) > 0.01) {
                throw new BadRequestException('支付金额与订单金额不一致');
            }

            const payment = await prisma.finPaymentRecord.create({
                data: {
                    order_id: data.orderId,
                    amount: order.amount,   // 以订单金额为准
                    channel: data.channel,
                    status: 'SUCCESS',
                    operator_id: data.operatorId
                }
            });

            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            // 续费：累加到原账户；首购：新建
            let account: any;
            if (order.order_source === 'renewal') {
                const existing = await prisma.finAssetAccount.findFirst({
                    where: { student_id: order.student_id, course_id: order.course_id },
                    orderBy: { updatedAt: 'desc' }
                });
                if (!existing) throw new BadRequestException('续费失败：未找到原资产账户');
                account = await prisma.finAssetAccount.update({
                    where: { id: existing.id },
                    data: {
                        total_qty: { increment: order.total_qty },
                        remaining_qty: { increment: order.total_qty },
                        status: 'ACTIVE'
                    }
                });
            } else {
                const existingAccount = await prisma.finAssetAccount.findFirst({
                    where: { student_id: order.student_id, course_id: order.course_id, status: 'ACTIVE', remaining_qty: { gt: 0 } }
                });
                if (existingAccount) {
                    throw new BadRequestException('您已购买此课程且仍有剩余课时，无法重复购买');
                }
                account = await prisma.finAssetAccount.create({
                    data: {
                        student_id: order.student_id,
                        course_id: order.course_id,
                        campus_id: data.campusId,
                        total_qty: order.total_qty,
                        remaining_qty: order.total_qty,
                        status: 'ACTIVE',
                    },
                });
            }

            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: order.order_source === 'renewal' ? 'RENEWAL' : 'BUY',
                    change_qty: order.total_qty,
                    balance_snapshot: account.remaining_qty,
                    ref_id: payment.id,
                },
            });

            // 续费订单不重复自动分班
            if (order.order_source === 'renewal') {
                return {
                    message: `续费成功，课时已追加至原账户`,
                    paymentId: payment.id,
                    accountId: account.id,
                    lessons: order.total_qty,
                    className: null,
                };
            }

            // ── 自动分班：购课成功后将学员加入班级 ──
            const course = await prisma.edCourse.findUnique({
                where: { id: order.course_id },
                include: { instructor: true }
            });

            let assignedClassName = '';
            if (course) {
                // 查找该课程在**同校区**的现有未满班级
                const existingClass = await prisma.edClass.findFirst({
                    where: {
                        assignments: { some: { course_id: order.course_id } },
                        campus_id: data.campusId,
                        status: 'ONGOING',
                    },
                    include: { assignments: true }
                });

                if (existingClass && existingClass.enrolled < existingClass.capacity) {
                    const alreadyEnrolled = await prisma.eduStudentInClass.findUnique({
                        where: { student_id_class_id: { student_id: order.student_id, class_id: existingClass.id } }
                    });
                    if (!alreadyEnrolled) {
                        await prisma.eduStudentInClass.create({
                            data: { student_id: order.student_id, class_id: existingClass.id }
                        });
                        // 通过 count 同步 enrolled，避免手动 increment 误差
                        const count = await prisma.eduStudentInClass.count({ where: { class_id: existingClass.id } });
                        await prisma.edClass.update({
                            where: { id: existingClass.id },
                            data: { enrolled: count }
                        });
                    }
                    assignedClassName = existingClass.name;
                } else {
                    // 创建新班级
                    const monthStr = new Date().toISOString().slice(0, 7);
                    const newClass = await prisma.edClass.create({
                        data: {
                            name: `${course.name}-${monthStr}班`,
                            capacity: 30,
                            enrolled: 1,
                            campus_id: data.campusId,
                            status: 'ONGOING',
                        }
                    });

                    // 创建班级-课程-教师分配（课程必须有授课教师才能排课）
                    const teacherId = course.instructor_id;
                    if (teacherId) {
                        const assignment = await prisma.edClassAssignment.create({
                            data: {
                                class_id: newClass.id,
                                course_id: order.course_id,
                                teacher_id: teacherId,
                            }
                        });

                        // 自动排课：每周一节，从下周一开始
                        const startDate = new Date();
                        const dayOfWeek = startDate.getDay(); // 0=Sun … 6=Sat
                        const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Mon=7 days, not 0
                        startDate.setDate(startDate.getDate() + daysUntilNextMonday);
                        startDate.setHours(10, 0, 0, 0);
                        const lessonDuration = course.duration || 45;

                        const scheduleData = [];
                        for (let i = 0; i < Math.min(order.total_qty, 48); i++) {
                            const lessonStart = new Date(startDate);
                            lessonStart.setDate(lessonStart.getDate() + i * 7);
                            const lessonEnd = new Date(lessonStart);
                            lessonEnd.setMinutes(lessonEnd.getMinutes() + lessonDuration);
                            scheduleData.push({
                                assignment_id: assignment.id,
                                course_id: order.course_id,   // 冗余字段，简化后续课消查询
                                lesson_no: i + 1,
                                start_time: lessonStart,
                                end_time: lessonEnd,
                                status: 'PUBLISHED',
                            });
                        }
                        if (scheduleData.length > 0) {
                            await prisma.edLessonSchedule.createMany({ data: scheduleData });
                        }
                    } else {
                        // 课程无教师时不创建排课，仅记录日志
                        console.warn(`[Finance] 课程 ${course.name} 无授课教师，跳过自动排课`);
                    }

                    await prisma.eduStudentInClass.create({
                        data: { student_id: order.student_id, class_id: newClass.id }
                    });
                    assignedClassName = newClass.name;
                }
            }

            return {
                message: assignedClassName
                    ? `支付成功！已分配至「${assignedClassName}」`
                    : '支付成功，已生成课时资产',
                paymentId: payment.id,
                accountId: account.id,
                lessons: order.total_qty,
                className: assignedClassName || null,
            };
        });
    }

    // ==========================================
    // 退费流程 — 仅校区审批，无总部审批
    // ==========================================

    /**
     * 学员申请退费：锁定课时，等待校区审批
     */
    async applyRefund(data: { orderId: string; refundQty?: number; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({
                where: { id: data.orderId },
                include: { course: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            if (!order) throw new NotFoundException('订单不存在');
            if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUNDED') {
                throw new BadRequestException('只有已支付的订单才能申请退费');
            }

            // Find active asset account
            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: order.student_id, course_id: order.course_id, status: 'ACTIVE' },
                orderBy: { updatedAt: 'desc' }
            });
            if (!account) throw new NotFoundException('找不到相关资产账户');

            // Check no pending refund for this account
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { account_id: account.id, status: 'PENDING' }
            });
            if (existingPending) {
                throw new BadRequestException('该课程已有待审批的退费申请');
            }

            // Available = remaining - locked
            const availableQty = account.remaining_qty - account.locked_qty;
            if (availableQty <= 0) {
                throw new BadRequestException('当前无可退课时');
            }

            // 支持部分退费：前端可指定 refundQty，默认退全部可退课时
            const requestedQty = (data.refundQty && data.refundQty > 0) ? data.refundQty : availableQty;
            if (requestedQty > availableQty) {
                throw new BadRequestException(`退费课时数超出可退课时，可退 ${availableQty}`);
            }
            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const estimatedAmount = Math.max(0, Number((unitPrice * requestedQty).toFixed(2)));

            if (estimatedAmount <= 0) {
                throw new BadRequestException('可退金额为0，无法发起退费');
            }

            // 记录原支付渠道
            const refundChannel = order.payments[0]?.channel || '未知';

            // Lock the requested qty
            await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: { locked_qty: { increment: requestedQty } }
            });

            const refundRecord = await prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    account_id: account.id,
                    student_id: order.student_id,
                    requested_qty: requestedQty,
                    estimated_amount: estimatedAmount,
                    amount: 0, // Final amount set on approval
                    refund_channel: refundChannel,
                    reason: data.reason,
                    status: 'PENDING',
                    applicant_id: data.applicantId
                }
            });

            return refundRecord;
        });
    }

    /**
     * 获取校区退费审批阈值（可配置）
     */
    private async getRefundThreshold(campusId: string): Promise<number> {
        const config = await this.prisma.campusConfig.findUnique({ where: { campus_id: campusId } });
        return config?.refund_approval_threshold ?? 1000;
    }

    /**
     * 校区管理员审批退费（无需总部审批）
     */
    async approveRefund(data: { refundId: string; approverId: string; approverRole?: string; campusId?: string; isApproved: boolean; reviewNote?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const refund = await prisma.finRefundRecord.findUnique({
                where: { id: data.refundId },
                include: { order: true }
            });
            if (!refund) throw new NotFoundException('退费申请不存在');
            if (refund.status !== 'PENDING') {
                throw new BadRequestException('该申请已处理');
            }

            // 校区阈值校验：超过阈值需总部审批
            if (data.campusId && refund.estimated_amount) {
                const threshold = await this.getRefundThreshold(data.campusId);
                if (refund.estimated_amount > threshold && data.approverRole !== 'ADMIN') {
                    throw new BadRequestException(`退费金额 ${refund.estimated_amount} 超过校区阈值 ${threshold}，需总部审批`);
                }
            }

            const account = refund.account_id
                ? await prisma.finAssetAccount.findUnique({ where: { id: refund.account_id } })
                : await prisma.finAssetAccount.findFirst({
                    where: { student_id: refund.student_id, course_id: refund.order.course_id },
                    orderBy: { updatedAt: 'desc' }
                });

            if (!account) throw new NotFoundException('找不到相关资产账户');

            if (!data.isApproved) {
                // Reject: unlock qty
                await prisma.finAssetAccount.update({
                    where: { id: account.id },
                    data: { locked_qty: { decrement: refund.requested_qty } }
                });

                return prisma.finRefundRecord.update({
                    where: { id: refund.id },
                    data: {
                        status: 'REJECTED',
                        approver_id: data.approverId,
                        review_note: data.reviewNote || null,
                        reviewedAt: new Date()
                    }
                });
            }

            // Approve: recalculate amount at approval time
            const order = refund.order;
            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const approvedQty = Math.min(refund.requested_qty, account.remaining_qty);
            const isFullRefund = approvedQty >= account.remaining_qty;

            // For full refund, use exact remaining balance to avoid penny-loss from rounding
            const rawAmount = isFullRefund
                ? Math.max(0, order.amount - account.refunded_amount)
                : Math.max(0, unitPrice * approvedQty);
            const approvedAmount = Number(rawAmount.toFixed(2));

            // Cap cumulative refund at order total
            const totalRefunded = account.refunded_amount + approvedAmount;
            const finalAmount = Math.max(0, totalRefunded > order.amount
                ? Number((order.amount - account.refunded_amount).toFixed(2))
                : approvedAmount);

            // Update refund record
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: {
                    status: 'APPROVED',
                    approved_qty: approvedQty,
                    amount: finalAmount,
                    approver_id: data.approverId,
                    review_note: data.reviewNote || null,
                    reviewedAt: new Date()
                }
            });

            // Update asset account
            const updatedAccount = await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: {
                    remaining_qty: { decrement: approvedQty },
                    locked_qty: { decrement: refund.requested_qty },
                    refunded_qty: { increment: approvedQty },
                    refunded_amount: { increment: finalAmount },
                    status: isFullRefund ? 'REFUNDED' : 'ACTIVE'
                }
            });

            // Ledger entry
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: 'REFUND',
                    change_qty: -approvedQty,
                    balance_snapshot: updatedAccount.remaining_qty,
                    ref_id: refund.id,
                }
            });

            // 订单状态智能判定：按已退累计金额判断 REFUNDED vs PARTIAL_REFUNDED
            const allApprovedRefunds = await prisma.finRefundRecord.findMany({
                where: { order_id: order.id, status: { in: ['APPROVED', 'PROCESSED'] } }
            });
            const cumulativeRefunded = allApprovedRefunds.reduce((sum, r) => sum + r.amount, 0) + finalAmount;
            const newOrderStatus = cumulativeRefunded >= order.amount - 0.01 ? 'REFUNDED' : 'PARTIAL_REFUNDED';
            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: newOrderStatus }
            });

            // 模拟退回原支付渠道：记录负额支付流水（替代原先充入钱包 balance）
            await prisma.finPaymentRecord.create({
                data: {
                    order_id: order.id,
                    amount: -finalAmount,
                    channel: refund.refund_channel || '未知',
                    status: 'SUCCESS',
                    operator_id: data.approverId,
                }
            });

            // 退费记录最终状态 → PROCESSED（已退回原渠道）
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: { status: 'PROCESSED' }
            });

            return {
                success: true,
                message: `退费已通过并按原支付方式（${refund.refund_channel}）退回 ¥${finalAmount.toFixed(2)}`,
                approvedQty,
                amount: finalAmount,
                accountStatus: isFullRefund ? 'REFUNDED' : 'ACTIVE'
            };
        });
    }

    /**
     * 欠费与低余额预警
     */
    async getLowBalanceAlert(studentId: string) {
        const accounts = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId, status: 'ACTIVE' },
            include: { course: true }
        });
        const alerts = accounts
            .filter(a => a.remaining_qty <= 5)
            .map(a => ({
                accountId: a.id,
                courseId: a.course_id,
                courseName: a.course.name,
                remainingQty: a.remaining_qty,
                level: a.remaining_qty <= 0 ? 'CRITICAL' : 'WARNING',
            }));
        return { alerts, hasWarning: alerts.length > 0 };
    }

    /**
     * 管理员查询校区内欠费学员
     */
    async getLowBalanceStudentsByCampus(campusId: string) {
        return this.prisma.finAssetAccount.findMany({
            where: {
                campus_id: campusId,
                status: 'ACTIVE',
                remaining_qty: { lte: 5 }
            },
            include: { student: true, course: true },
            orderBy: { remaining_qty: 'asc' }
        });
    }

    /**
     * 管理员手动发起退费
     */
    async manualRefund(data: { accountId: string; refundQty: number; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const account = await prisma.finAssetAccount.findUnique({ where: { id: data.accountId } });
            if (!account) throw new NotFoundException('资产账户不存在');

            const availableQty = account.remaining_qty - account.locked_qty;
            if (availableQty < data.refundQty) {
                throw new BadRequestException(`可退课时(${availableQty})不足`);
            }

            // Check no pending refund for this account
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { account_id: account.id, status: 'PENDING' }
            });
            if (existingPending) {
                throw new BadRequestException('该课程已有待审批的退费申请');
            }

            const order = await prisma.finOrder.findFirst({
                where: { student_id: account.student_id, course_id: account.course_id, status: { in: ['PAID', 'PARTIAL_REFUNDED'] } },
                orderBy: { createdAt: 'desc' }
            });
            if (!order) throw new NotFoundException('找不到对应的已付款订单');

            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const estimatedAmount = Math.max(0, Number((unitPrice * data.refundQty).toFixed(2)));

            // Lock qty
            await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: { locked_qty: { increment: data.refundQty } }
            });

            return prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    account_id: account.id,
                    student_id: account.student_id,
                    requested_qty: data.refundQty,
                    estimated_amount: estimatedAmount,
                    amount: 0,
                    reason: data.reason || '管理员手动发起退费',
                    status: 'PENDING',
                    applicant_id: data.applicantId,
                }
            });
        });
    }

    // ==========================================
    // 查询接口
    // ==========================================

    async getAssetsByStudent(studentId: string) {
        const student = await this.prisma.eduStudent.findUnique({
            where: { id: studentId },
            select: { balance: true }
        });

        const accounts = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId },
            include: {
                course: true,
                ledgers: { orderBy: { occurTime: 'desc' }, take: 10 }
            }
        });

        return { balance: student?.balance || 0, accounts };
    }

    async getAllAssets(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.campus_id = campusId;
        }
        return this.prisma.finAssetAccount.findMany({
            where,
            include: {
                course: true,
                student: true,
                ledgers: { orderBy: { occurTime: 'desc' }, take: 5 }
            }
        });
    }

    async getAllOrders(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.course = { campus_id: campusId };
        }
        const orders = await this.prisma.finOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { course: true, student: true, payments: true }
        });
        return orders.map((o: any) => ({
            id: o.id,
            student_id: o.student_id,
            student_name: o.student?.name || '未知学员',
            course_id: o.course_id,
            course_name: o.course?.name || '未知课程',
            amount: o.amount,
            total_qty: o.total_qty,
            status: o.status,
            channel: o.payments?.[0]?.channel || '-',
            operator_id: o.operator_id,
            campus_id: o.course?.campus_id,
            createdAt: o.createdAt
        }));
    }

    async voidOrder(orderId: string, operatorId: string) {
        const order = await this.prisma.finOrder.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException('订单不存在');
        if (order.status === 'PAID') throw new BadRequestException('已支付订单不可直接作废，请走退费流程');
        if (order.status === 'VOID') throw new BadRequestException('订单已是作废状态');
        return this.prisma.finOrder.update({
            where: { id: orderId },
            data: { status: 'VOID' }
        });
    }

    async getOrdersByStudent(studentId: string) {
        return this.prisma.finOrder.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            include: { course: true }
        });
    }

    /**
     * 通过学员+课程查找已支付订单（用于管理员手动发起退费）
     */
    async findPaidOrder(studentId: string, courseId: string) {
        const order = await this.prisma.finOrder.findFirst({
            where: { student_id: studentId, course_id: courseId, status: { in: ['PAID', 'PARTIAL_REFUNDED'] } },
            orderBy: { createdAt: 'desc' },
        });
        if (!order) throw new NotFoundException('未找到该学员的已支付订单');
        return order;
    }

    async getMyRefunds(studentId: string) {
        return this.prisma.finRefundRecord.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, order_id: true, requested_qty: true, approved_qty: true,
                estimated_amount: true, amount: true, reason: true, status: true,
                review_note: true, createdAt: true, reviewedAt: true,
            }
        });
    }

    async getPendingRefunds(campusId?: string) {
        const where: any = { status: 'PENDING' };
        if (campusId) {
            where.account = { campus_id: campusId };
        }
        return this.prisma.finRefundRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                order: { include: { course: true } },
                account: true
            }
        });
    }

    async getRefundApplications(campusId?: string) {
        const where: any = {};
        if (campusId) {
            where.account = { campus_id: campusId };
        }
        return this.prisma.finRefundRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                order: { include: { course: true } },
                account: true
            }
        });
    }
}
