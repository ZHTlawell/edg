import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('order')
    async createOrder(@Request() req: any, @Body() body: { studentId?: string; courseId: string }) {
        // 学员自己买，或由管理员代操作；金额与课时数由后端权威计算
        const isStudent = req.user.role === 'STUDENT';
        const targetStudentId = isStudent ? (req.user.studentId || req.user.sub) : body.studentId;
        const operatorId = isStudent ? undefined : req.user.sub;

        if (!targetStudentId) {
            throw new UnauthorizedException('缺少学员ID信息');
        }

        return this.financeService.createOrder({
            studentId: targetStudentId,
            courseId: body.courseId,
            orderSource: isStudent ? 'student' : 'admin',
            operatorId: operatorId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('order/renewal')
    async createRenewalOrder(@Request() req: any, @Body() body: { studentId?: string; courseId: string }) {
        const isStudent = req.user.role === 'STUDENT';
        const targetStudentId = isStudent ? (req.user.studentId || req.user.sub) : body.studentId;
        const operatorId = isStudent ? undefined : req.user.sub;

        if (!targetStudentId) throw new UnauthorizedException('缺少学员ID信息');

        return this.financeService.createRenewalOrder({
            studentId: targetStudentId,
            courseId: body.courseId,
            operatorId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('pay')
    async processPayment(@Request() req: any, @Body() body: { orderId: string; amount: number; channel: string; campusId: string; classId?: string }) {
        const operatorId = req.user.role !== 'STUDENT' ? req.user.sub : undefined;

        return this.financeService.processPayment({
            orderId: body.orderId,
            amount: body.amount,
            channel: body.channel,
            campusId: body.campusId,
            operatorId,
            classId: body.classId,
        });
    }

    /**
     * 支付状态查询（用于前端模拟支付轮询）
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('pay/status/:orderId')
    async getPaymentStatus(@Param('orderId') orderId: string) {
        return this.financeService.getPaymentStatus(orderId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('refund/apply')
    async applyRefund(@Request() req: any, @Body() body: { orderId: string; refundQty?: number; reason: string }) {
        return this.financeService.applyRefund({
            orderId: body.orderId,
            refundQty: body.refundQty,
            reason: body.reason,
            applicantId: req.user.sub
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
            approverId: req.user.sub,
            approverRole: req.user.role,
            campusId: req.user.campusId,
            isApproved: body.isApproved
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-assets')
    async getMyAssets(@Request() req: any) {
        return this.financeService.getAssetsByStudent(req.user.studentId || req.user.sub);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('low-balance-alert')
    async getLowBalanceAlert(@Request() req: any) {
        return this.financeService.getLowBalanceAlert(req.user.studentId || req.user.sub);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('low-balance-students/:campusId')
    async getLowBalanceStudentsByCampus(@Request() req: any, @Param('campusId') campusId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询');
        }
        return this.financeService.getLowBalanceStudentsByCampus(campusId);
    }

    // 管理员查询指定学员的课时资产
    @UseGuards(AuthGuard('jwt'))
    @Get('assets/:studentId')
    async getStudentAssets(@Request() req: any, @Param('studentId') studentId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询学员资产');
        }
        return this.financeService.getAssetsByStudent(studentId);
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
    @Get('find-order/:studentId/:courseId')
    async findPaidOrder(@Request() req: any, @Param('studentId') studentId: string, @Param('courseId') courseId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可操作');
        }
        return this.financeService.findPaidOrder(studentId, courseId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-orders')
    async getMyOrders(@Request() req: any) {
        return this.financeService.getOrdersByStudent(req.user.studentId || req.user.sub);
    }
}
