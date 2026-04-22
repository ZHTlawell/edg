/**
 * 公告控制器
 * 职责：暴露 /announcements 路由，提供公告 CRUD、发布/撤回、已读回执、未读提醒等接口
 * 所属模块：消息通知
 * 权限：写操作仅 ADMIN/CAMPUS_ADMIN，校区管理员只能维护自己创建的公告
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 公告 HTTP 控制器
 * 按角色隔离数据：CAMPUS_ADMIN 发布时强制 scope=SPECIFIC 并限定自己校区
 */
@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    /**
     * 新建公告
     * - ADMIN 可自由选择范围 scope（ALL / SPECIFIC）
     * - CAMPUS_ADMIN 自动锁定为本校区 SPECIFIC 范围
     * @param body 公告内容（标题、正文、scope、campusIds 等）
     */
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

    /**
     * 修改公告
     * CAMPUS_ADMIN 只能修改自己创建的公告
     * @param id 公告 ID
     * @param body 要更新的字段
     */
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

    /**
     * 发布公告（将草稿转为对目标受众可见）
     * CAMPUS_ADMIN 只能发布自己创建的公告
     */
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

    /**
     * 撤回公告（回到草稿/下线状态）
     * CAMPUS_ADMIN 只能撤回自己发布的
     */
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

    /**
     * 删除公告
     * CAMPUS_ADMIN 只能删除自己创建的
     */
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

    /**
     * 管理端获取公告列表（所有状态，包括草稿）
     * CAMPUS_ADMIN 仅能看自己发布过的
     */
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

    /**
     * 查询当前校区的生效公告列表（已发布、未过期）
     * 供各端 Dashboard 展示
     */
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

    /**
     * 查询单条公告详情
     * @param id 公告 ID
     */
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.announcementsService.findOne(id);
    }
}
