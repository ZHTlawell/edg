import { Controller, Post, Get, Body, Query, Param, UseGuards, Request, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const HW_UPLOAD_DIR = './uploads/homework';
if (!existsSync(HW_UPLOAD_DIR)) mkdirSync(HW_UPLOAD_DIR, { recursive: true });

/** multer 把中文文件名按 latin1 编码，需要还原为 utf8 */
function fixOriginalName(file: Express.Multer.File): string {
    try {
        return Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
        return file.originalname;
    }
}

import { TeachingService } from './teaching.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('teaching')
@UseGuards(AuthGuard('jwt'))
export class TeachingController {
    constructor(private readonly teachingService: TeachingService) { }

    @Post('homeworks')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: HW_UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                cb(null, `${unique}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async publishHomework(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师或教务人员可以发布作业');
        }
        const teacherId = req.user.teacherId || req.user.userId;
        if (file) {
            body.attachmentName = fixOriginalName(file);
            body.attachmentUrl = `/uploads/homework/${file.filename}`;
        }
        return this.teachingService.publishHomework(teacherId, body);
    }

    @Post('homeworks/delete')
    async deleteHomework(@Request() req: any, @Body() body: { homeworkId: string }) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师可删除作业');
        }
        const teacherId = req.user.teacherId || req.user.userId;
        return this.teachingService.deleteHomework(teacherId, body.homeworkId);
    }

    @Post('homeworks/submit')
    async submitHomework(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学生账户可提交解答');
        }
        const studentId = body.studentId || req.user.studentId;
        return this.teachingService.submitHomework(studentId, body);
    }

    @Post('homeworks/submit-file')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: HW_UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                cb(null, `${unique}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async submitHomeworkFile(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
        if (req.user.role !== 'STUDENT') throw new UnauthorizedException('仅学生账户可提交');
        if (!file) throw new Error('未收到文件');
        const studentId = req.user.studentId;
        return this.teachingService.submitHomework(studentId, {
            homeworkId: body.homeworkId,
            content: `[文件提交] ${fixOriginalName(file)}`,
            attachmentName: fixOriginalName(file),
            attachmentUrl: `/uploads/homework/${file.filename}`,
        });
    }

    @Post('homeworks/submission/:id/edit')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: HW_UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                cb(null, `${unique}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async editSubmission(@Request() req: any, @Param('id') submissionId: string, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
        if (req.user.role !== 'STUDENT') throw new UnauthorizedException('仅学生可编辑提交');
        const studentId = req.user.studentId;
        const data: any = { submissionId, content: body.content };
        if (file) {
            data.attachmentName = fixOriginalName(file);
            data.attachmentUrl = `/uploads/homework/${file.filename}`;
        }
        return this.teachingService.editSubmission(studentId, data);
    }

    @Post('homeworks/grade')
    async gradeHomework(@Request() req: any, @Body() body: any) {
        // Always use the JWT's teacherId — never trust client-supplied value
        const teacherId = req.user.teacherId || req.user.userId;
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

    @Get('teacher-homeworks')
    async getTeacherHomeworks(@Request() req: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师账户可查询自己的作业');
        }
        const teacherId = req.user.teacherId || req.user.userId;
        return this.teachingService.getTeacherHomeworks(teacherId);
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

    /** 教师编辑已发布作业（放在所有 homeworks/* 具名路由之后，避免 :id 通配吞掉 grade/submit/seed 等） */
    @Post('homeworks/:id/edit')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: HW_UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                cb(null, `${unique}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async editHomework(@Request() req: any, @Param('id') homeworkId: string, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅教师可编辑作业');
        }
        const teacherId = req.user.teacherId || req.user.userId;
        const data: any = { homeworkId };
        if (body.title !== undefined) data.title = body.title;
        if (body.content !== undefined) data.content = body.content;
        if (body.deadline !== undefined) data.deadline = body.deadline;
        if (file) {
            data.attachmentName = fixOriginalName(file);
            data.attachmentUrl = `/uploads/homework/${file.filename}`;
        }
        return this.teachingService.editHomework(teacherId, data);
    }

    @Get('class-members/:classId')
    async getClassMembers(@Param('classId') classId: string) {
        return this.teachingService.getClassMembers(classId);
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
            if (!req.user.campusId) return []; // 没有绑定校区，防止数据泄漏
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

    @Get('leave/by-lesson/:lessonId')
    async getLeavesByLesson(@Request() req: any, @Param('lessonId') lessonId: string) {
        if (!['TEACHER', 'CAMPUS_ADMIN', 'ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权限');
        }
        return this.teachingService.getApprovedLeavesByLesson(lessonId);
    }

    @Get('leave/pending')
    async getPendingLeaves(@Request() req: any) {
        if (req.user.role !== 'TEACHER' && req.user.role !== 'CAMPUS_ADMIN' && req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('无权限');
        }
        // CAMPUS_ADMIN 无 campus_id → 返回空；TEACHER 过滤为自己所授课的请假
        if (req.user.role === 'CAMPUS_ADMIN' && !req.user.campusId) return [];
        const campusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : undefined;
        const teacherId = req.user.role === 'TEACHER' ? req.user.teacherId : undefined;
        return this.teachingService.getPendingLeaves(campusId, teacherId);
    }
}
