import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // 报名下单流程 (Enrollment & Payment)
    // ==========================================

    async createOrder(data: { studentId: string; courseId: string; amount: number; totalQty?: number; orderSource: string; operatorId?: string }) {
        const course = await this.prisma.edCourse.findUnique({ where: { id: data.courseId } });
        if (!course) throw new NotFoundException('找不到该课程');

        const order = await this.prisma.finOrder.create({
            data: {
                student_id: data.studentId,
                course_id: data.courseId,
                amount: data.amount,
                total_qty: data.totalQty || course.total_lessons,
                order_source: data.orderSource,
                operator_id: data.operatorId,
                status: 'PENDING_PAYMENT',
            },
        });
        return order;
    }

    async processPayment(data: { orderId: string; amount: number; channel: string; campusId: string; operatorId?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({ where: { id: data.orderId } });
            if (!order) throw new NotFoundException('找不到该订单');
            if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException(`该订单状态为 ${order.status}，无法重复支付`);

            // 1. 记录支付凭证
            const payment = await prisma.finPaymentRecord.create({
                data: {
                    order_id: data.orderId,
                    amount: data.amount,
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

            // 3. 开设对应的学员资产钱包 (Asset Account)
            const account = await prisma.finAssetAccount.create({
                data: {
                    student_id: order.student_id,
                    course_id: order.course_id,
                    campus_id: data.campusId, // 归属校区
                    total_qty: order.total_qty,
                    remaining_qty: order.total_qty,
                    status: 'ACTIVE',
                },
            });

            // 4. 生成资金入账初始流水
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: 'BUY',
                    change_qty: order.total_qty,
                    balance_snapshot: order.total_qty,
                    ref_id: payment.id,
                },
            });

            return {
                message: '支付成功，已生成课时资产',
                paymentId: payment.id,
                accountId: account.id,
                lessons: order.total_qty
            };
        });
    }

    // ==========================================
    // 退费流程 (Refund Workflow)
    // ==========================================

    async applyRefund(data: { orderId: string; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({
                where: { id: data.orderId },
                include: { course: true, student: true }
            });
            if (!order) throw new NotFoundException('订单不存在');
            if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUNDED') {
                throw new BadRequestException('只有已支付或部分退款的订单才能申请退费');
            }

            // 防重：检查是否有审批中的退费申请
            const existingPending = await prisma.finRefundRecord.findFirst({
                where: { order_id: data.orderId, status: 'PENDING_APPROVAL' }
            });
            if (existingPending) {
                throw new BadRequestException('该订单已有待审批的退费申请，请勿重复发起');
            }

            // 获取资产账户计算剩余价值
            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: order.student_id, course_id: order.course_id },
                orderBy: { updatedAt: 'desc' }
            });

            if (!account) throw new NotFoundException('找不到相关资产账户，无法退款');

            // 退费金额规则 = 实付金额 - 已消耗金额 - 已退金额
            let refundableAmount = 0;
            if (order.total_qty > 0) {
                const unitPrice = order.amount / order.total_qty;
                const consumedQty = order.total_qty - account.remaining_qty - account.refunded_qty;
                const consumedAmount = unitPrice * consumedQty;
                refundableAmount = order.amount - consumedAmount - account.refunded_amount;
            }

            refundableAmount = Math.max(0, Number(refundableAmount.toFixed(2)));
            if (refundableAmount <= 0) {
                throw new BadRequestException('可退金额核算为0，无法发起退款');
            }

            const refundRecord = await prisma.finRefundRecord.create({
                data: {
                    order_id: order.id,
                    student_id: order.student_id,
                    amount: refundableAmount,
                    reason: data.reason,
                    status: 'PENDING_APPROVAL',
                    applicant_id: data.applicantId
                }
            });

            return refundRecord;
        });
    }

    async approveRefund(data: { refundId: string; approverId: string; isApproved: boolean }) {
        return this.prisma.$transaction(async (prisma) => {
            const refund = await prisma.finRefundRecord.findUnique({
                where: { id: data.refundId },
                include: { order: true }
            });

            if (!refund) throw new NotFoundException('退费申请单不存在');
            if (refund.status !== 'PENDING_APPROVAL') throw new BadRequestException('该申请单状态非待审批，无法操作');

            if (!data.isApproved) {
                return await prisma.finRefundRecord.update({
                    where: { id: refund.id },
                    data: { status: 'REJECTED', approver_id: data.approverId }
                });
            }

            // 1. 获取对应资产账户
            const account = await prisma.finAssetAccount.findFirst({
                where: { student_id: refund.student_id, course_id: refund.order.course_id },
                orderBy: { updatedAt: 'desc' }
            });

            if (!account) throw new NotFoundException('找不到相关资产账户');

            // 扣除相应可退课时（按照比例倒推或全退）这里为了简化，按退费直接全清账户剩余
            const refundQty = account.remaining_qty;

            // 2. 更新退款记录状态
            await prisma.finRefundRecord.update({
                where: { id: refund.id },
                data: { status: 'APPROVED', approver_id: data.approverId }
            });

            // 3. 扣除资产并累计退款金额
            const updatedAccount = await prisma.finAssetAccount.update({
                where: { id: account.id },
                data: {
                    remaining_qty: 0,
                    refunded_qty: { increment: refundQty },
                    refunded_amount: { increment: refund.amount },
                    status: 'REFUNDED'
                }
            });

            // 4. 生成流水
            await prisma.finAssetLedger.create({
                data: {
                    account_id: account.id,
                    type: 'REFUND',
                    change_qty: -refundQty,
                    balance_snapshot: updatedAccount.remaining_qty,
                    ref_id: refund.id,
                }
            });

            // 5. 更新订单状态
            await prisma.finOrder.update({
                where: { id: refund.order_id },
                data: { status: 'REFUNDED' }
            });

            // 6. 将钱退至学生钱包余额
            await prisma.eduStudent.update({
                where: { id: refund.student_id },
                data: { balance: { increment: refund.amount } }
            });

            return { success: true, message: '退费审批通过并已核销，资金已退还学生钱包' };
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
