import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
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

    @Post('attendance')
    async submitAttendance(@Request() req: any, @Body() body: any) {
        return this.teachingService.submitAttendance(req.user.userId, body);
    }
}
