/**
 * 课程标准控制器
 * 职责：暴露 /course-standards 路由，管理课程分类、课程标准、模板和版本历史
 * 所属模块：课程体系
 * 写操作仅 ADMIN 可调用，读操作按角色过滤可见数据
 */
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseStandardService } from './course-standard.service';

/**
 * 课程标准 HTTP 控制器
 * 面向总部管理端维护标准化课程大纲，供校区端/教师端引用
 */
@Controller('course-standards')
export class CourseStandardController {
    constructor(private readonly svc: CourseStandardService) { }

    // ─── Category Endpoints ────────────────────────────────
    /** 获取所有课程分类 */
    @UseGuards(AuthGuard('jwt'))
    @Get('categories')
    getCategories() {
        return this.svc.findAllCategories();
    }

    /**
     * 创建课程分类
     * @param body 分类数据（名称、描述等）
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('categories')
    createCategory(@Request() req: any, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.createCategory(body);
    }

    /**
     * 更新课程分类
     * @param id 分类 ID
     * @param body 新分类数据
     */
    @UseGuards(AuthGuard('jwt'))
    @Put('categories/:id')
    updateCategory(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.updateCategory(id, body);
    }

    // ─── Standard Endpoints ────────────────────────────────
    /**
     * 获取课程标准列表
     * - CAMPUS_ADMIN：仅返回本校区可用的标准
     * - 其他角色：按 query 过滤返回所有
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('standards')
    getStandards(@Request() req: any, @Query() query: any) {
        if (req.user.role === 'CAMPUS_ADMIN') {
            return this.svc.findAvailableForCampus(req.user.campusId || '');
        }
        return this.svc.findAllStandards(query);
    }

    /** 获取单个课程标准详情 */
    @UseGuards(AuthGuard('jwt'))
    @Get('standards/:id')
    getStandard(@Param('id') id: string) {
        return this.svc.findOneStandard(id);
    }

    /**
     * 创建课程标准
     * @param body 标准内容（名称、分类、章节等）
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('standards')
    createStandard(@Request() req: any, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.createStandard({ ...body, creator_id: req.user.userId });
    }

    /**
     * 更新课程标准（自动产出新版本历史记录）
     */
    @UseGuards(AuthGuard('jwt'))
    @Put('standards/:id')
    updateStandard(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.updateStandard(id, body, req.user.userId);
    }

    /** 启用课程标准（允许校区使用） */
    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/enable')
    enableStandard(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.enableStandard(id, req.user.userId);
    }

    /** 禁用课程标准 */
    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/disable')
    disableStandard(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.disableStandard(id);
    }

    // ─── Template Endpoints ────────────────────────────────
    /**
     * 新增或更新课程标准的模板（upsert）
     * @param id 标准 ID
     * @param body 模板内容
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/template')
    upsertTemplate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.upsertTemplate(id, body);
    }

    // ─── Version History ───────────────────────────────────
    /**
     * 获取某课程标准的版本历史记录
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('standards/:id/versions')
    getVersions(@Param('id') id: string) {
        return this.svc.getVersionHistory(id);
    }
}
