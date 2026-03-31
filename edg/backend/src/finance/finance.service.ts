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

            const payment = await prisma.finPaymentRecord.create({
                data: {
                    order_id: data.orderId,
                    amount: data.amount,
                    channel: data.channel,
                    status: 'SUCCESS',
                    operator_id: data.operatorId
                }
            });

            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            const existingAccount = await prisma.finAssetAccount.findFirst({
                where: { student_id: order.student_id, course_id: order.course_id, status: 'ACTIVE' }
            });
            if (existingAccount) {
                throw new BadRequestException('您已购买此课程，无需重复购买');
            }

            const account = await prisma.finAssetAccount.create({
                data: {
                    student_id: order.student_id,
                    course_id: order.course_id,
                    campus_id: data.campusId,
                    total_qty: order.total_qty,
                    remaining_qty: order.total_qty,
                    status: 'ACTIVE',
                },
            });

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
    // 退费流程 — 仅校区审批，无总部审批
    // ==========================================

    /**
     * 学员申请退费：锁定课时，等待校区审批
     */
    async applyRefund(data: { orderId: string; reason: string; applicantId: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.finOrder.findUnique({
                where: { id: data.orderId },
                include: { course: true }
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

            // Refund all available lessons (student can only request full remaining refund)
            const requestedQty = availableQty;
            const unitPrice = order.total_qty > 0 ? order.amount / order.total_qty : 0;
            const estimatedAmount = Math.max(0, Number((unitPrice * requestedQty).toFixed(2)));

            if (estimatedAmount <= 0) {
                throw new BadRequestException('可退金额为0，无法发起退费');
            }

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
                    reason: data.reason,
                    status: 'PENDING',
                    applicant_id: data.applicantId
                }
            });

            return refundRecord;
        });
    }

    /**
     * 校区管理员审批退费（无需总部审批）
     */
    async approveRefund(data: { refundId: string; approverId: string; isApproved: boolean; reviewNote?: string }) {
        return this.prisma.$transaction(async (prisma) => {
            const refund = await prisma.finRefundRecord.findUnique({
                where: { id: data.refundId },
                include: { order: true }
            });
            if (!refund) throw new NotFoundException('退费申请不存在');
            if (refund.status !== 'PENDING') {
                throw new BadRequestException('该申请已处理');
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
            const approvedAmount = Math.max(0, Number((unitPrice * approvedQty).toFixed(2)));

            // Cap cumulative refund at order total
            const totalRefunded = account.refunded_amount + approvedAmount;
            const finalAmount = totalRefunded > order.amount
                ? Number((order.amount - account.refunded_amount).toFixed(2))
                : approvedAmount;

            const isFullRefund = approvedQty >= account.remaining_qty;

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

            // Update order status
            await prisma.finOrder.update({
                where: { id: order.id },
                data: { status: isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUNDED' }
            });

            // Refund to student wallet
            await prisma.eduStudent.update({
                where: { id: refund.student_id },
                data: { balance: { increment: finalAmount } }
            });

            return {
                success: true,
                message: '退费已通过',
                approvedQty,
                amount: finalAmount,
                accountStatus: isFullRefund ? 'REFUNDED' : 'ACTIVE'
            };
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

            const order = await prisma.finOrder.findFirst({
                where: { student_id: account.student_id, course_id: account.course_id, status: { in: ['PAID', 'PARTIAL_REFUNDED'] } },
                orderBy: { createdAt: 'desc' }
            });
            if (!order) throw new NotFoundException('找不到对应的已付款订单');

            const unitPrice = order.amount / order.total_qty;
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
