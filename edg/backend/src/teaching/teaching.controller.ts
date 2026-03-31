import { Controller, Post, Get, Body, Query, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { TeachingService } from './teaching.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('teaching')
@UseGuards(AuthGuard('jwt'))
export class TeachingController {
    constructor(private readonly teachingService: TeachingService) { }

    @Post('homeworks')
    async publishHomework(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师或教务人员可以发布作业');
        }
        return this.teachingService.publishHomework(body.teacherId, body);
    }

    @Post('homeworks/submit')
    async submitHomework(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学生账户可提交解答');
        }
        return this.teachingService.submitHomework(body.studentId, body);
    }

    @Post('homeworks/grade')
    async gradeHomework(@Request() req: any, @Body() body: any) {
        return this.teachingService.gradeHomework(body.teacherId, body);
    }

    @Get('homeworks/lesson/:lessonId')
    async getHomeworkByLesson(@Param('lessonId') lessonId: string) {
        return this.teachingService.getHomeworkByLesson(lessonId);
    }

    @Get('attendance')
    async getAttendanceRecords(@Request() req: any, @Query('campusId') campusId?: string) {
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.teachingService.getAttendanceRecords(effectiveCampusId);
    }

    @Post('attendance')
    async submitAttendance(@Body() body: any) {
        return this.teachingService.submitAttendance(body);
    }

    @Post('confirm-consumption')
    async confirmConsumption(@Request() req: any, @Body() body: { lessonId: string }) {
        if (req.user.role !== 'CAMPUS_ADMIN' && req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅教务主管可执行课消确认');
        }
        return this.teachingService.confirmLessonConsumption(body.lessonId, req.user.userId);
    }

    // ── Leave Request endpoints ──────────────────────────────────────

    @Post('leave/apply')
    async applyLeave(@Request() req: any, @Body() body: { lessonId: string; reason: string }) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学员可申请请假');
        }
        return this.teachingService.applyLeave(req.user.studentId, {
            lessonId: body.lessonId,
            reason: body.reason,
            campusId: req.user.campusId,
        });
    }

    @Post('leave/review')
    async reviewLeave(@Request() req: any, @Body() body: { leaveRequestId: string; isApproved: boolean; reviewNote?: string }) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'CAMPUS_ADMIN' && req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅教师或管理员可审批请假');
        }
        return this.teachingService.reviewLeave({
            leaveRequestId: body.leaveRequestId,
            approverId: req.user.userId,
            isApproved: body.isApproved,
            reviewNote: body.reviewNote,
        });
    }

    @Post('leave/cancel')
    async cancelLeave(@Request() req: any, @Body() body: { leaveRequestId: string }) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学员可撤回请假');
        }
        return this.teachingService.cancelLeave(body.leaveRequestId, req.user.studentId);
    }

    @Get('my-leaves')
    async getMyLeaves(@Request() req: any) {
        return this.teachingService.getMyLeaves(req.user.studentId);
    }

    @Get('leave/pending')
    async getPendingLeaves(@Request() req: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'CAMPUS_ADMIN' && req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('无权限');
        }
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        return this.teachingService.getPendingLeaves(campusId);
    }
}
