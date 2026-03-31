import { Controller, Get, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';

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
}
