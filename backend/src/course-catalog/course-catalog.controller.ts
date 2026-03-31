import {
    Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseCatalogService } from './course-catalog.service';

@Controller('course-catalog')
export class CourseCatalogController {
    constructor(private readonly svc: CourseCatalogService) { }

    // Student: get my purchased courses for study
    @UseGuards(AuthGuard('jwt'))
    @Get('my-courses')
    getMyCourses(@Request() req: any) {
        const studentId = req.user.studentId || req.user.userId;
        return this.svc.getMyStudyCourses(studentId);
    }

    // Student/Campus: get course catalog with chapters + progress
    @UseGuards(AuthGuard('jwt'))
    @Get(':courseId')
    getCatalog(@Param('courseId') courseId: string, @Request() req: any) {
        const studentId = req.user.studentId || req.user.userId;
        return this.svc.getCatalog(courseId, studentId);
    }

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
