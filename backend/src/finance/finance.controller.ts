import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('order')
    async createOrder(@Request() req: any, @Body() body: { studentId?: string; courseId: string; amount: number; totalQty?: number }) {
        // 学员自己买，或由管理员代操作
        const isStudent = req.user.role === 'STUDENT';
        const targetStudentId = isStudent ? req.user.userId : body.studentId;
        const operatorId = isStudent ? undefined : req.user.userId;

        if (!targetStudentId) {
            throw new UnauthorizedException('缺少学员ID信息');
        }

        return this.financeService.createOrder({
            studentId: targetStudentId,
            courseId: body.courseId,
            amount: body.amount,
            totalQty: body.totalQty,
            orderSource: isStudent ? 'student' : 'admin',
            operatorId: operatorId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('pay')
    async processPayment(@Request() req: any, @Body() body: { orderId: string; amount: number; channel: string; campusId: string }) {
        // 简单处理，如果是管理员操作，则传入 operatorId 留痕
        const operatorId = req.user.role !== 'STUDENT' ? req.user.userId : undefined;

        return this.financeService.processPayment({
            orderId: body.orderId,
            amount: body.amount,
            channel: body.channel,
            campusId: body.campusId,
            operatorId: operatorId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('refund/apply')
    async applyRefund(@Request() req: any, @Body() body: { orderId: string; reason: string }) {
        return this.financeService.applyRefund({
            orderId: body.orderId,
            reason: body.reason,
            applicantId: req.user.userId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('refund/approve')
    async approveRefund(@Request() req: any, @Body() body: { refundId: string; isApproved: boolean }) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可审批退费申请');
        }
        return this.financeService.approveRefund({
            refundId: body.refundId,
            approverId: req.user.userId,
            isApproved: body.isApproved
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-assets')
    async getMyAssets(@Request() req: any) {
        return this.financeService.getAssetsByStudent(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('refund/pending')
    async getPendingRefunds(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看退费申请');
        }
        return this.financeService.getRefundApplications('PENDING_APPROVAL');
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-orders')
    async getMyOrders(@Request() req: any) {
        return this.financeService.getOrdersByStudent(req.user.userId);
    }
}
