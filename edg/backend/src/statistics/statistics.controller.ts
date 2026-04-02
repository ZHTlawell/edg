import { Controller, Get, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('workbench-overview')
    async getWorkbenchOverview(@Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('仅管理员可访问此接口');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.statisticsService.getWorkbenchOverview(campusId);
    }
}
