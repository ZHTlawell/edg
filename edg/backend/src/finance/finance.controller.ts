import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get, Query, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('order')
    async createOrder(@Request() req: any, @Body() body: { studentId?: string; courseId: string }) {
        // 金额与课时数后端权威计算，不接收前端传值
        const isStudent = req.user.role === 'STUDENT';
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
            orderSource: isStudent ? 'student' : 'admin',
            operatorId: operatorId
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('order/renewal')
    async createRenewalOrder(@Request() req: any, @Body() body: { studentId?: string; courseId: string }) {
        const isStudent = req.user.role === 'STUDENT';
        const targetStudentId = isStudent ? (req.user.studentId || body.studentId) : body.studentId;
        const operatorId = isStudent ? undefined : req.user.userId;
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
        const operatorId = req.user.role !== 'STUDENT' ? req.user.userId : undefined;

        return this.financeService.processPayment({
            orderId: body.orderId,
            amount: body.amount,  // 后端会校验与订单金额一致
            channel: body.channel,
            campusId: body.campusId,
            operatorId: operatorId,
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
            approverRole: req.user.role,
            campusId: req.user.campusId,
            isApproved: body.isApproved,
            reviewNote: body.reviewNote
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('low-balance-alert')
    async getLowBalanceAlert(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getLowBalanceAlert(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('low-balance-students/:campusId')
    async getLowBalanceStudentsByCampus(@Request() req: any, @Param('campusId') campusId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询');
        }
        return this.financeService.getLowBalanceStudentsByCampus(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-assets')
    async getMyAssets(@Request() req: any) {
        // 学员用 studentId (EduStudent.id)，管理员用 userId
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getAssetsByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('assets/:studentId')
    async getStudentAssets(@Request() req: any, @Param('studentId') studentId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询学员资产');
        }
        return this.financeService.getAssetsByStudent(studentId);
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
    @Get('assets')
    async getAllAssets(@Request() req: any, @Query('campusId') campusId?: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看全部资产');
        }
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.financeService.getAllAssets(effectiveCampusId);
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
