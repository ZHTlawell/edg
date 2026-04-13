import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // 报名下单流程 (Enrollment & Payment)
    // 后端权威：金额、课时数均由后端根据课程计算，忽略前端传值
    // ==========================================

    async createOrder(data: { studentId: string; courseId: string; orderSource: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法下单');

        // 防重复下单：检查未支付订单
        const pendingOrder = await this.prisma.finOrder.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: 'PENDING_PAYMENT'
            }
        });
        if (pendingOrder) {
            throw new BadRequestException('该课程存在未支付订单，请先完成支付或取消原订单');
        }

        // 防重复购买：检查活跃资产账户（已购买且未完全消耗/退费）
        const activeAccount = await this.prisma.finAssetAccount.findFirst({
            where: {
                student_id: data.studentId,
                course_id: data.courseId,
                status: 'ACTIVE',
                remaining_qty: { gt: 0 }
            }
        });
        if (activeAccount) {
            throw new BadRequestException('该学员已购买此课程且仍有剩余课时，不可重复购买（如需续费请走续费入口）');
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
     * 续费下单：在原资产账户基础上追加课时，不新建账户
     */
    async createRenewalOrder(data: { studentId: string; courseId: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');
        if (course.status !== 'ENABLED') throw new BadRequestException('课程已下架，无法续费');

        // 续费要求学员曾经购买过该课程
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

    async processPayment(data: { orderId: string; amount: number; channel: string; campusId: string; operatorId?: string; classId?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({ where: { id: data.orderId } });
            if (!order) throw new NotFoundException('找不到该订单');
            if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException(`该订单状态为 ${order.status}，无法重复支付`);

            // 后端金额校验：前端传入的 amount 必须与订单金额一致（防篡改）
            if (Math.abs(data.amount - order.amount) > 0.01) {
                throw new BadRequestException('支付金额与订单金额不一致');
            }

            // 1. 记录支付凭证
            const payment = await prisma.finPaymentRecord.create({
                data: {
                    order_id: data.orderId,
                    amount: order.amount,   // 以订单金额为准
                    channel: data.channel,
                    status: 'SUCCESS',
                    operator_id: data.operatorId
                }
            });

            // 2. 更新订单状态
            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            // 3. 资产账户：续费累加到原账户，首购新建
            let account: any;
            if (order.order_source === 'renewal') {
                const existing = await prisma.finAssetAccount.findFirst({
                    where: { student_id: order.student_id, course_id: order.course_id },
                    orderBy: { updatedAt: 'desc' }
                });
                if (!existing) {
                    throw new BadRequestException('续费失败：未找到原资产账户');
                }
                account = await prisma.finAssetAccount.update({
                    where: { id: existing.id },
                    data: {
                        total_qty: { increment: order.total_qty },
                        remaining_qty: { increment: order.total_qty },
                        status: 'ACTIVE'
                    }
                });
            } else {
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

            // 4. 流水
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: order.order_source === 'renewal' ? 'RENEWAL' : 'BUY',
                    change_qty: order.total_qty,
                    balance_snapshot: account.remaining_qty,
                    ref_id: payment.id,
                },
            });

            // 5. 自动入班（续费订单无需再入班，已经入过）
            let enrolledClass = null;
            if (data.classId && order.order_source !== 'renewal') {
                const cls = await prisma.edClass.findUnique({ where: { id: data.classId } });
                if (cls) {
                    if (cls.enrolled >= cls.capacity) {
                        throw new BadRequestException('该班级已满，无法入班');
                    }
                    const existing = await prisma.eduStudentInClass.findUnique({
                        where: { student_id_class_id: { student_id: order.student_id, class_id: data.classId } }
                    });
                    if (!existing) {
                        await prisma.eduStudentInClass.create({
                            data: { student_id: order.student_id, class_id: data.classId }
                        });
                        // 通过 count 同步 enrolled，避免手动 increment 误差
                        const count = await prisma.eduStudentInClass.count({ where: { class_id: data.classId } });
                        await prisma.edClass.update({
                            where: { id: data.classId },
                            data: { enrolled: count }
                        });
                    }
                    enrolledClass = cls.name;
                }
            }

            return {
                message: '支付成功，已生成课时资产' + (enrolledClass ? `，已分配至${enrolledClass}` : ''),
                paymentId: payment.id,
                accountId: account.id,
                lessons: order.total_qty,
                enrolledClass,
            };
        });
    }

    /**
     * 查询订单支付状态（用于前端模拟支付轮询）
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

    // ==========================================
    // 退费流程 (Refund Workflow) - 重构支持部分退费、原渠道、校区阈值
    // ==========================================

    /**
     * 获取校区退费审批阈值（可配置）
     */
    private async getRefundThreshold(campusId: string): Promise<number> {
        const config = await this.prisma.campusConfig.findUnique({ where: { campus_id: campusId } });
        return config?.refund_approval_threshold ?? 1000;
    }

    async applyRefund(data: { orderId: string; refundQty?: number; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({
                where: { id: data.orderId },
                include: { course: true, student: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            if (!order) throw new NotFoundException('订单不存在');
            if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUNDED') {
                throw new BadRequestException('只有已支付或部分退款的订单才能申请退费');
            }

            // 防重：检查是否有审批中的退费申请
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { order_id: data.orderId, status: { in: ['PENDING_APPROVAL', 'PENDING_HQ_APPROVAL', 'PROCESSING'] } }
            });
            if (existingPending) {
                throw new BadRequestException('该订单已有待审批/处理中的退费申请');
            }

            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: order.student_id, course_id: order.course_id },
                orderBy: { updatedAt: 'desc' }
            });
            if (!account) throw new NotFoundException('找不到相关资产账户');

            // 部分退费：确定要退的课时数
            const requestedQty = data.refundQty && data.refundQty > 0 ? data.refundQty : account.remaining_qty;
            if (requestedQty > account.remaining_qty) {
                throw new BadRequestException(`退费课时数超出剩余课时，剩余 ${account.remaining_qty}`);
            }

            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const refundAmount = Number((unitPrice * requestedQty).toFixed(2));
            if (refundAmount <= 0) {
                throw new BadRequestException('可退金额为0，无法发起退款');
            }

            // 退回渠道 = 原支付渠道
            const refundChannel = order.payments[0]?.channel || '未知';

            const refundRecord = await prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    student_id: order.student_id,
                    amount: refundAmount,
                    refund_qty: requestedQty,
                    refund_channel: refundChannel,
                    reason: data.reason,
                    status: 'PENDING_APPROVAL',
                    applicant_id: data.applicantId
                }
            });

            return refundRecord;
        });
    }

    async approveRefund(data: { refundId: string; approverId: string; approverRole?: string; campusId?: string; isApproved: boolean }) {
        return this.prisma.$transaction(async (prisma) => {
            const refund = await prisma.finRefundRecord.findUnique({
                where: { id: data.refundId },
                include: { order: true }
            });

            if (!refund) throw new NotFoundException('退费申请单不存在');
            if (refund.status !== 'PENDING_APPROVAL') {
                throw new BadRequestException('该申请单状态非待审批，无法操作');
            }

            if (!data.isApproved) {
                return await prisma.finRefundRecord.update({
                    where: { id: refund.id },
                    data: { status: 'REJECTED', approver_id: data.approverId }
                });
            }

            // 权限：超过校区阈值必须 ADMIN 审批
            if (data.campusId) {
                const threshold = await this.getRefundThreshold(data.campusId);
                if (refund.amount > threshold && data.approverRole !== 'ADMIN') {
                    throw new BadRequestException(`退费金额 ${refund.amount} 超过校区阈值 ${threshold}，需总部审批`);
                }
            }

            // 获取对应资产账户
            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: refund.student_id, course_id: refund.order.course_id },
                orderBy: { updatedAt: 'desc' }
            });
            if (!account) throw new NotFoundException('找不到相关资产账户');

            if (refund.refund_qty > account.remaining_qty) {
                throw new BadRequestException('退费课时数超出剩余课时，审批失败');
            }

            // 1. 部分扣减资产账户（不再清零）
            const newRemaining = account.remaining_qty - refund.refund_qty;
            const updatedAccount = await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: {
                    remaining_qty: newRemaining,
                    refunded_qty: { increment: refund.refund_qty },
                    refunded_amount: { increment: refund.amount },
                    // 账户状态：全部退完且无剩余 → CLOSED，否则保持 ACTIVE
                    status: newRemaining === 0 && account.total_qty === account.refunded_qty + refund.refund_qty ? 'CLOSED' : 'ACTIVE'
                }
            });

            // 2. 写流水
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: 'REFUND',
                    change_qty: -refund.refund_qty,
                    balance_snapshot: updatedAccount.remaining_qty,
                    ref_id: refund.id,
                }
            });

            // 3. 订单状态智能判定
            const allApprovedRefunds = await prisma.finRefundRecord.findMany({
                where: { order_id: refund.order_id, status: { in: ['APPROVED', 'PROCESSED'] } }
            });
            const totalRefunded = allApprovedRefunds.reduce((sum, r) => sum + r.amount, 0) + refund.amount;
            const newOrderStatus = totalRefunded >= refund.order.amount - 0.01 ? 'REFUNDED' : 'PARTIAL_REFUNDED';
            await prisma.finOrder.update({
                where: { id: refund.order_id },
                data: { status: newOrderStatus }
            });

            // 4. 模拟退回原支付渠道（毕设场景：记录负额支付流水）
            await prisma.finPaymentRecord.create({
                data: {
                    order_id: refund.order_id,
                    amount: -refund.amount,                // 负数表示退款
                    channel: refund.refund_channel || '未知',
                    status: 'SUCCESS',
                    operator_id: data.approverId,
                }
            });

            // 5. 更新退款记录状态 → PROCESSED（已退回原渠道）
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: { status: 'PROCESSED', approver_id: data.approverId }
            });

            return {
                success: true,
                message: `退费已审批并按原支付方式（${refund.refund_channel}）退回 ¥${refund.amount.toFixed(2)}`
            };
        });
    }

    /**
     * 查询学员名下的课时资产
     */
    async getAssetsByStudent(studentId: string) {
        const student = await this.prisma.eduStudent.findUnique({
            where: { id: studentId },
            select: { balance: true }
        });

        const accounts = await this.prisma.finAssetAccount.findMany({
            where: { student_id: studentId },
            include: {
                course: true,
                ledgers: {
                    orderBy: { occurTime: 'desc' },
                    take: 10
                }
            }
        });

        return {
            balance: student?.balance || 0,
            accounts: accounts
        };
    }

    /**
     * 欠费与低余额预警（供学员 Dashboard 使用）
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
     * 管理员查询校区内欠费学员（≤5 课时）
     */
    async getLowBalanceStudentsByCampus(campusId: string) {
        return this.prisma.finAssetAccount.findMany({
            where: {
                campus_id: campusId,
                status: 'ACTIVE',
                remaining_qty: { lte: 5 }
            },
            include: {
                student: true,
                course: true
            },
            orderBy: { remaining_qty: 'asc' }
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

    /**
     * 查询订单记录
     */
    async getOrdersByStudent(studentId: string) {
        return this.prisma.finOrder.findMany({
            where: { student_id: studentId },
            orderBy: { createdAt: 'desc' },
            include: {
                course: true
            }
        });
    }

    /**
     * 查询退费申请单 (供管理员审核使用)
     */
    async getRefundApplications(status?: string) {
        return this.prisma.finRefundRecord.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                student: true,
                order: {
                    include: { course: true }
                }
            }
        });
    }
}
