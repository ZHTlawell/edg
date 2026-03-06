import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('academic')
export class AcademicController {
    constructor(private readonly academicService: AcademicService) { }

    // -------------------------
    // 课程 API (对所有角色开放查看)
    // -------------------------
    @Get('courses')
    async getAllCourses() {
        return this.academicService.getAllCourses();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('courses')
    async createCourse(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new Error('仅管理员或校区主管可开设新课程');
        }
        return this.academicService.createCourse({
            ...body,
            campus_id: req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : body.campus_id
        });
    }

    // -------------------------
    // 班级 API
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Post('classes')
    async createClass(@Request() req: any, @Body() body: any) {
        // 校区管理员或总部均可建班
        return this.academicService.createClass({
            ...body,
            campus_id: req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : body.campus_id
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('classes')
    async getClasses(@Request() req: any, @Query('campusId') campusId: string) {
        if (req.user.role === 'TEACHER') {
            return this.academicService.getClassesByTeacher(req.user.userId);
        }

        const targetCampus = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getClassesByCampus(targetCampus);
    }

    // -------------------------
    // 智能排课 API
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/schedule')
    async autoSchedule(
        @Request() req: any,
        @Body() body: { classId: string; startDate: string; lessonsCount: number }
    ) {
        return this.academicService.autoSchedule(body.classId, new Date(body.startDate), body.lessonsCount, 1);
    }
}
