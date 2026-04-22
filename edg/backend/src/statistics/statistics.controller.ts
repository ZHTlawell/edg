/**
 * 统计控制器
 * 职责：暴露 /statistics 路由，提供工作台概览、出勤、营收、退费统计以及订单 CSV 导出
 * 所属模块：数据分析
 * 所有接口需登录；大部分仅 ADMIN / CAMPUS_ADMIN 可访问
 */
import { Controller, Get, Res, Query, UseGuards, UnauthorizedException, ForbiddenException, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

/**
 * 统计数据 HTTP 控制器
 * 为管理端 Dashboard 提供各类聚合数据
 */
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    /**
     * 总部工作台概览数据（核心 KPI）
     * 仅 ADMIN 可访问
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('workbench-overview')
    async getWorkbenchOverview(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可访问此接口');
        }
        return this.statisticsService.getWorkbenchOverview();
    }

    /**
     * 出勤统计
     * @param campusId 可选的校区过滤
     * @param startDate 统计起始日期
     * @param endDate 统计截止日期
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('attendance')
    async getAttendanceStats(
        @Request() req: any,
        @Query('campusId') campusId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        return this.statisticsService.getAttendanceStats({ campusId, startDate, endDate });
    }

    /**
     * 课时消耗统计
     * @param startDate 起始日期
     * @param endDate 截止日期
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('consumption')
    async getConsumptionStats(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        return this.statisticsService.getConsumptionStats({ startDate, endDate });
    }

    /**
     * 退费统计（按时间段 / 校区汇总）
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('refunds')
    async getRefundStats(@Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        return this.statisticsService.getRefundStats();
    }

    /**
     * 导出全部订单为 CSV 文件
     * 响应加入 UTF-8 BOM 以保证 Excel 正确识别中文
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('export/orders')
    async exportOrders(@Request() req: any, @Res() res: Response) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权导出');
        }
        const csv = await this.statisticsService.exportOrdersCsv();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        // Add BOM for Excel UTF-8 compatibility
        res.send('\uFEFF' + csv);
    }
}
