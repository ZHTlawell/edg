import { Controller, Get, Res, Query, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('workbench-overview')
    async getWorkbenchOverview(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅总部管理员可访问此接口');
        }
        return this.statisticsService.getWorkbenchOverview();
    }

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

    @UseGuards(AuthGuard('jwt'))
    @Get('refunds')
    async getRefundStats(@Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        return this.statisticsService.getRefundStats();
    }

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
