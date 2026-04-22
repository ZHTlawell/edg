/**
 * 课程目录控制器
 * 职责：暴露 /course-catalog 路由，提供课程预览、学员已购课程、章节目录、学习进度等接口
 * 所属模块：课程体系
 * 使用 JWT 鉴权，按角色区分可访问的数据
 */
import {
    Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseCatalogService } from './course-catalog.service';

/**
 * 课程目录控制器
 * 面向 C 端学员（查看自己的学习目录 / 进度）和全端通用（课程预览）
 */
@Controller('course-catalog')
export class CourseCatalogController {
    constructor(private readonly svc: CourseCatalogService) { }

    /**
     * 公开预览指定课程的大纲（无需购买即可查看）
     * @param courseId 课程 ID
     */
    // Public: preview course syllabus (no purchase required)
    @UseGuards(AuthGuard('jwt'))
    @Get('preview/:courseId')
    getPreview(@Param('courseId') courseId: string) {
        return this.svc.getPreview(courseId);
    }

    /**
     * 学员获取自己已报名 / 已购的课程列表（供进入学习）
     */
    // Student: get my purchased courses for study
    @UseGuards(AuthGuard('jwt'))
    @Get('my-courses')
    getMyCourses(@Request() req: any) {
        const studentId = req.user.studentId || req.user.userId;
        return this.svc.getMyStudyCourses(studentId);
    }

    /**
     * 获取课程的章节目录及当前学员的学习进度
     * @param courseId 课程 ID
     */
    // Student/Campus: get course catalog with chapters + progress
    @UseGuards(AuthGuard('jwt'))
    @Get(':courseId')
    getCatalog(@Param('courseId') courseId: string, @Request() req: any) {
        const studentId = req.user.studentId || req.user.userId;
        return this.svc.getCatalog(courseId, studentId);
    }

    /**
     * 学员更新某节课的学习进度（开始学习 / 完成学习）
     * @param body.course_id 课程 ID
     * @param body.lesson_id 课节 ID
     * @param body.action 行为：start 或 complete
     */
    // Student: update lesson progress (start or complete)
    @UseGuards(AuthGuard('jwt'))
    @Post('progress')
    updateProgress(
        @Request() req: any,
        @Body() body: { course_id: string; lesson_id: string; action: 'start' | 'complete' },
    ) {
        const studentId = req.user.studentId || req.user.userId;
        return this.svc.updateProgress(studentId, body.course_id, body.lesson_id, body.action);
    }
}
