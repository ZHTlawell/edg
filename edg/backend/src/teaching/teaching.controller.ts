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
     * 教师退回作业，要求学员重新提交
     */
    @Post('homeworks/submission/:id/return')
    async returnSubmission(@Request() req: any, @Param('id') submissionId: string, @Body() body: { feedback: string }) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师可退回作业');
        }
        const teacherId = req.user.teacherId || req.user.userId;
        return this.teachingService.returnSubmission(teacherId, { submissionId, feedback: body.feedback });
    }

    @Get('my-homeworks')
    async getMyHomeworks(@Request() req: any) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学生账户可查询作业');
        }
        return this.teachingService.getStudentHomeworks(req.user.studentId);
    }

    /** 管理员/校区主管/教师按学员 ID 查询作业 */
    @Get('homeworks/by-student/:studentId')
    async getHomeworksByStudent(@Request() req: any, @Param('studentId') studentId: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN', 'TEACHER'].includes(req.user.role)) {
            throw new UnauthorizedException('无权限查看其他学员作业');
        }
        return this.teachingService.getStudentHomeworks(studentId);
    }

    @Post('homeworks/seed')
    async seedHomeworks(@Request() req: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅管理员可执行种子数据');
        }
        return this.teachingService.seedHomeworks();
    }

    @Get('homeworks/lesson/:lessonId')
    async getHomeworkByLesson(@Param('lessonId') lessonId: string) {
        return this.teachingService.getHomeworkByLesson(lessonId);
    }

    @Get('attendance')
    async getAttendanceRecords(
        @Request() req: any,
        @Query('campusId') campusId?: string,
        @Query('classId') classId?: string,
        @Query('studentId') studentId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        // 角色硬过滤：服务端覆盖客户端传参，防止越权
        const role = req.user.role;
        const scope: { campusId?: string; classId?: string; studentId?: string; teacherId?: string; from?: string; to?: string } = {
            classId, from, to,
        };
        if (role === 'ADMIN') {
            scope.campusId = campusId;
            scope.studentId = studentId;
        } else if (role === 'CAMPUS_ADMIN') {
            scope.campusId = req.user.campusId; // 强制锁定到本校区
            scope.studentId = studentId;
        } else if (role === 'TEACHER') {
            scope.teacherId = req.user.teacherId; // 仅自己授课的课次
        } else if (role === 'STUDENT') {
            scope.studentId = req.user.studentId; // 仅自己的考勤
        } else {
            throw new UnauthorizedException('无权限查看考勤');
        }
        return this.teachingService.getAttendanceRecords(scope);
    }

    @Post('attendance')
    async submitAttendance(@Request() req: any, @Body() body: any) {
        if (!['TEACHER', 'CAMPUS_ADMIN', 'ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('仅教师/管理员可登记考勤');
        }
        return this.teachingService.submitAttendance({
            lessonId: body.lessonId,
            attendances: body.attendances,
            operatorId: req.user.userId,
            operatorRole: req.user.role,
            operatorTeacherId: req.user.teacherId,
            operatorCampusId: req.user.campusId,
        });
    }

    @Post('attendance/:lessonId/revoke')
    async revokeConsumption(@Request() req: any, @Param('lessonId') lessonId: string) {
        return this.teachingService.revokeConsumption(lessonId, req.user.userId, req.user.role, req.user.campusId);
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
