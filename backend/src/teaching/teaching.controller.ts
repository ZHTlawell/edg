import { Controller, Get, Post, Body, Query, UseGuards, Request, UnauthorizedException, Param } from '@nestjs/common';
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
        const teacherId = body.teacherId || req.user.teacherId;
        return this.teachingService.publishHomework(teacherId, body);
    }

    @Post('homeworks/submit')
    async submitHomework(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学生账户可提交解答');
        }
        const studentId = body.studentId || req.user.studentId;
        return this.teachingService.submitHomework(studentId, body);
    }

    @Post('homeworks/grade')
    async gradeHomework(@Request() req: any, @Body() body: any) {
        const teacherId = body.teacherId || req.user.teacherId;
        return this.teachingService.gradeHomework(teacherId, body);
    }

    /**
     * 教师退回作业（要求学员重新提交）
     */
    @Post('homeworks/submission/:id/return')
    async returnSubmission(@Request() req: any, @Param('id') submissionId: string, @Body() body: { feedback: string }) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师可退回作业');
        }
        const teacherId = req.user.teacherId || req.user.sub;
        return this.teachingService.returnSubmission(teacherId, { submissionId, feedback: body.feedback });
    }

    /**
     * 学员视角查询自己的作业
     */
    @Get('homeworks/my')
    async getMyHomeworks(@Request() req: any) {
        if (req.user.role !== 'STUDENT') throw new UnauthorizedException('仅学员可查询自己的作业');
        const studentId = req.user.studentId || req.user.sub;
        return this.teachingService.getMyHomeworks(studentId);
    }

    @Post('attendance')
    async submitAttendance(@Request() req: any, @Body() body: any) {
        if (!['TEACHER', 'CAMPUS_ADMIN', 'ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('仅教师/管理员可登记考勤');
        }
        return this.teachingService.submitAttendance({
            lessonId: body.lessonId,
            attendances: body.attendances,
            operatorId: req.user.sub,
        });
    }

    @Post('attendance/:lessonId/revoke')
    async revokeConsumption(@Request() req: any, @Param('lessonId') lessonId: string) {
        return this.teachingService.revokeConsumption(lessonId, req.user.sub, req.user.role);
    }

    @Post('confirm-consumption')
    async confirmConsumption(@Request() req: any, @Body() body: { lessonId: string }) {
        if (req.user.role !== 'CAMPUS_ADMIN' && req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅教务主管可执行课消确认');
        }
        return this.teachingService.confirmLessonConsumption(body.lessonId, req.user.sub);
    }

    // ─── 请假管理 ──────────────────────────────────────────────────
    @Post('leave/apply')
    async applyLeave(@Request() req: any, @Body() body: any) {
        return this.teachingService.applyLeave({
            studentId: body.studentId || req.user.studentId,
            lessonId: body.lessonId,
            reason: body.reason,
            applicantId: req.user.sub,
        });
    }

    @Post('leave/approve')
    async approveLeave(@Request() req: any, @Body() body: any) {
        if (!['CAMPUS_ADMIN', 'ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('仅管理员可审批请假');
        }
        return this.teachingService.approveLeave({
            leaveId: body.leaveId,
            approverId: req.user.sub,
            isApproved: body.isApproved,
            makeupLessonId: body.makeupLessonId,
        });
    }

    @Get('leave/records')
    async getLeaveRecords(@Query('studentId') studentId?: string, @Query('status') status?: string) {
        return this.teachingService.getLeaveRecords({ studentId, status });
    }
}
