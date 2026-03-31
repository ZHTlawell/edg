import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get, Query, Param } from '@nestjs/common';
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
        // 学员下单使用 EduStudent.id (优先 JWT.studentId > body.studentId)，而非 SysUser.id
        const targetStudentId = isStudent
            ? (req.user.studentId || body.studentId)
            : body.studentId;
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
    async approveRefund(@Request() req: any, @Body() body: { refundId: string; isApproved: boolean; reviewNote?: string }) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可审批退费申请');
        }
        return this.financeService.approveRefund({
            refundId: body.refundId,
            approverId: req.user.userId,
            isApproved: body.isApproved,
            reviewNote: body.reviewNote
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-assets')
    async getMyAssets(@Request() req: any) {
        // 学员用 studentId (EduStudent.id)，管理员用 userId
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getAssetsByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('refund/pending')
    async getPendingRefunds(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看退费申请');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.financeService.getPendingRefunds(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('refund/all')
    async getAllRefunds(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看退费记录');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.financeService.getRefundApplications(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('refund/manual')
    async manualRefund(@Request() req: any, @Body() body: { accountId: string; refundQty: number; reason: string }) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可手动发起退费');
        }
        return this.financeService.manualRefund({
            accountId: body.accountId,
            refundQty: body.refundQty,
            reason: body.reason,
            applicantId: req.user.userId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-orders')
    async getMyOrders(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getOrdersByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-refunds')
    async getMyRefunds(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getMyRefunds(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('orders')
    async getAllOrders(@Request() req: any, @Query('campusId') campusId?: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看全部订单');
        }
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.financeService.getAllOrders(effectiveCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('order/:id/void')
    async voidOrder(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可作废订单');
        }
        return this.financeService.voidOrder(id, req.user.userId);
    }
}
