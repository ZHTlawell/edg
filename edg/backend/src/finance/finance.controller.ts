/**
 * 财务控制器
 * 职责：暴露 /finance 路由，处理订单、支付、退款、资产、余额预警等接口
 * 所属模块：财务管理
 * 关键原则：金额与课时数由后端权威计算，前端传值不可信
 */
import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get, Query, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 财务 HTTP 控制器
 * 所有接口需 JWT；部分接口按角色再细分权限
 */
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    /**
     * 创建报名订单
     * - 学员自报名：自动用登录态 studentId
     * - 管理员代报名：使用 body.studentId 并记录 operatorId
     * @param body.studentId 学员 ID（管理员代操作时传）
     * @param body.courseId 课程 ID
     */
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
    /**
     * 创建续费订单
     * 用于学员已购课程的二次报名 / 续课包
     */
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
    /**
     * 订单支付
     * @param body.orderId 订单 ID
     * @param body.amount 支付金额（后端会与订单金额比对）
     * @param body.channel 支付渠道（如 WECHAT / ALIPAY / OFFLINE）
     * @param body.campusId 校区 ID
     * @param body.classId 可选班级 ID，支付成功后同步入班
     */
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
    /**
     * 查询订单支付状态
     * @param orderId 订单 ID
     */
    @Get('pay/status/:orderId')
    async getPaymentStatus(@Param('orderId') orderId: string) {
        return this.financeService.getPaymentStatus(orderId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 学员/管理员发起退款申请
     * @param body.orderId 订单 ID
     * @param body.refundQty 退课时数（可选，默认全退）
     * @param body.reason 原因
     */
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
    /**
     * 管理员审核退款申请
     * @param body.refundId 退款单 ID
     * @param body.isApproved true=通过 / false=拒绝
     * @param body.reviewNote 审核备注
     */
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
    /**
     * 余额不足预警列表（按当前登录角色过滤校区）
     */
    @Get('low-balance-alert')
    async getLowBalanceAlert(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getLowBalanceAlert(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 查询指定校区下余额偏低的学员列表
     * @param campusId 校区 ID
     */
    @Get('low-balance-students/:campusId')
    async getLowBalanceStudentsByCampus(@Request() req: any, @Param('campusId') campusId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询');
        }
        return this.financeService.getLowBalanceStudentsByCampus(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 获取当前登录学员的资产（课时账户）列表
     */
    @Get('my-assets')
    async getMyAssets(@Request() req: any) {
        // 学员用 studentId (EduStudent.id)，管理员用 userId
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getAssetsByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 管理员查询指定学员的资产列表
     * @param studentId 学员 ID
     */
    @Get('assets/:studentId')
    async getStudentAssets(@Request() req: any, @Param('studentId') studentId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查询学员资产');
        }
        return this.financeService.getAssetsByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 查询学员某课程下已支付的订单（管理员用于补班等场景）
     * @param studentId 学员 ID
     * @param courseId 课程 ID
     */
    @Get('find-order/:studentId/:courseId')
    async findPaidOrder(@Request() req: any, @Param('studentId') studentId: string, @Param('courseId') courseId: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可操作');
        }
        return this.financeService.findPaidOrder(studentId, courseId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 待审批退款申请列表（按校区过滤）
     */
    @Get('refund/pending')
    async getPendingRefunds(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看退费申请');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.financeService.getPendingRefunds(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 所有退款记录（含已通过/拒绝）
     */
    @Get('refund/all')
    async getAllRefunds(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看退费记录');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.financeService.getRefundApplications(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 管理员手动发起退款（针对指定课时账户）
     * @param body.accountId 资产账户 ID
     * @param body.refundQty 退还课时数
     * @param body.reason 原因
     */
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
    /**
     * 当前登录学员的订单列表
     */
    @Get('my-orders')
    async getMyOrders(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getOrdersByStudent(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 当前登录学员发起的退款申请列表
     */
    @Get('my-refunds')
    async getMyRefunds(@Request() req: any) {
        const studentId = req.user.role === 'STUDENT' ? req.user.studentId : req.user.userId;
        return this.financeService.getMyRefunds(studentId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 管理员查看全部学员资产（按校区过滤）
     */
    @Get('assets')
    async getAllAssets(@Request() req: any, @Query('campusId') campusId?: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看全部资产');
        }
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.financeService.getAllAssets(effectiveCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 管理员查看全部订单（按校区过滤）
     */
    @Get('orders')
    async getAllOrders(@Request() req: any, @Query('campusId') campusId?: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可查看全部订单');
        }
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.financeService.getAllOrders(effectiveCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    /**
     * 管理员作废订单（未支付/异常订单）
     * @param id 订单 ID
     */
    @Post('order/:id/void')
    async voidOrder(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可作废订单');
        }
        return this.financeService.voidOrder(id, req.user.userId);
    }
}
