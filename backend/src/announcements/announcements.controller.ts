
import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async create(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可新建公告');
        }
        return this.announcementsService.create({
            ...body,
            publisher_id: req.user.userId,
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可修改公告');
        }
        return this.announcementsService.update(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/publish')
    async publish(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可发布公告');
        }
        return this.announcementsService.publish(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/withdraw')
    async withdraw(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可撤回公告');
        }
        return this.announcementsService.withdraw(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/list')
    async findAll(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new ForbiddenException('仅总部管理员可查看全量列表');
        }
        return this.announcementsService.findAllForAdmin();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('active')
    async findActive(@Request() req: any) {
        // Both ADMIN and CAMPUS_ADMIN can call this, but filter by campus
        const campusId = req.user.campusId || 'HQ';
        return this.announcementsService.findActiveForCampus(campusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.announcementsService.findOne(id);
    }
}
