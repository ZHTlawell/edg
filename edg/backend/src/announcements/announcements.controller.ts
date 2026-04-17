
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async create(@Request() req: any, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可新建公告');
        }
        // Campus admin: force scope to SPECIFIC with their own campus
        const scope = req.user.role === 'CAMPUS_ADMIN' ? 'SPECIFIC' : (body.scope || 'ALL');
        const campusIds = req.user.role === 'CAMPUS_ADMIN'
            ? [req.user.campusId]
            : body.campusIds;
        return this.announcementsService.create({
            ...body,
            scope,
            campusIds,
            publisher_id: req.user.userId,
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可修改公告');
        }
        // Campus admin can only edit their own announcements
        if (req.user.role === 'CAMPUS_ADMIN') {
            const existing = await this.announcementsService.findOne(id);
            if (existing?.publisher_id !== req.user.userId) {
                throw new ForbiddenException('只能修改自己创建的公告');
            }
        }
        return this.announcementsService.update(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/publish')
    async publish(@Request() req: any, @Param('id') id: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可发布公告');
        }
        if (req.user.role === 'CAMPUS_ADMIN') {
            const existing = await this.announcementsService.findOne(id);
            if (existing?.publisher_id !== req.user.userId) {
                throw new ForbiddenException('只能发布自己创建的公告');
            }
        }
        return this.announcementsService.publish(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/withdraw')
    async withdraw(@Request() req: any, @Param('id') id: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可撤回公告');
        }
        if (req.user.role === 'CAMPUS_ADMIN') {
            const existing = await this.announcementsService.findOne(id);
            if (existing?.publisher_id !== req.user.userId) {
                throw new ForbiddenException('只能撤回自己创建的公告');
            }
        }
        return this.announcementsService.withdraw(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可删除公告');
        }
        if (req.user.role === 'CAMPUS_ADMIN') {
            const existing = await this.announcementsService.findOne(id);
            if (existing?.publisher_id !== req.user.userId) {
                throw new ForbiddenException('只能删除自己创建的公告');
            }
        }
        return this.announcementsService.remove(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/list')
    async findAll(@Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new ForbiddenException('仅管理员可查看列表');
        }
        // Campus admin only sees their own announcements
        const publisherId = req.user.role === 'CAMPUS_ADMIN' ? req.user.userId : undefined;
        return this.announcementsService.findAllForAdmin(publisherId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('active')
    async findActive(@Request() req: any) {
        const campusId = req.user.campusId || 'HQ';
        return this.announcementsService.findActiveForCampus(campusId);
    }

    /** 获取当前用户的未读公告（用于弹窗） */
    @UseGuards(AuthGuard('jwt'))
    @Get('unread')
    async findUnread(@Request() req: any) {
        const campusId = req.user.campusId || 'HQ';
        const userId = req.user.userId;
        return this.announcementsService.findUnreadForUser(campusId, userId);
    }

    /** 标记公告为已读 */
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/read')
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        return this.announcementsService.markAsRead(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.announcementsService.findOne(id);
    }
}
