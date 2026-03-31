import { Controller, Get, Post, Body, UseGuards, Request, Query, UnauthorizedException, Param, BadRequestException } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('academic')
export class AcademicController {
    constructor(private readonly academicService: AcademicService) { }

    // -------------------------
    // 课程 API (对所有角色开放查看)
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Get('courses')
    async getCourses(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getAllCourses(filterCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('teachers')
    async getTeachers(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        console.log(`[Academic] Fetching teachers for user: ${req.user.username}, role: ${userRole}, targetCampus: ${campusId}`);

        // 核心：校区管理员强制只能看本校区老师，即使前端传了别的 campusId
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getAllTeachers(filterCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('courses')
    async createCourse(@Request() req: any, @Body() body: any) {
        const userRole = req.user.role.toUpperCase();
        if (userRole !== 'ADMIN' && userRole !== 'CAMPUS_ADMIN') {
            throw new Error('仅管理员或校区主管可开设新课程');
        }
        const campus_id = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : body.campus_id;
        console.log(`[Academic] Creating course: ${body.name}, userRole: ${userRole}, assignCampusId: ${campus_id}`);
        return this.academicService.createCourse({
            ...body,
            campus_id
        });
    }

    // -------------------------
    // 班级 API
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Post('classes')
    async createClass(@Request() req: any, @Body() body: any) {
        try {
            console.log('[Academic] createClass start', { 
                user: req.user, 
                body 
            });

            const role = (req.user?.role || '').toUpperCase();
            const campus_id = role === 'CAMPUS_ADMIN' ? req.user.campusId : (body.campus_id || req.user.campusId);
            
            if (!campus_id) {
                console.error('[Academic] Create Class: Missing campus_id');
                throw new BadRequestException('校区标识缺失');
            }

            // Explicitly pick fields to avoid Prisma errors with unexpected body content
            const createData = {
                name: body.name,
                capacity: parseInt(body.capacity) || 20,
                campus_id: campus_id,
                assignment: body.assignment // Pass through nested data
            };

            console.log('[Academic] Calling service.createClass with nested data');
            return await this.academicService.createClass(createData);
        } catch (e) {
            console.error('[Academic] Create Class Error:', e);
            const fs = require('fs');
            const path = require('path');
            const logFile = '/Users/macmini/Desktop/Edg1/edg/backend/error_report.log';
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR: ${e.message}\nSTACK: ${e.stack}\n`);
            throw e;
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('classes/:id')
    async getClassDetail(@Param('id') id: string) {
        return this.academicService.getClassDetail(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('classes')
    async getClasses(@Request() req: any, @Query('campusId') campusId: string) {
        try {
            if (req.user.role === 'TEACHER') {
                return await this.academicService.getClassesByTeacher(req.user.teacherId);
            }

            if (req.user.role === 'STUDENT') {
                return await this.academicService.getClassesByStudent(req.user.studentId);
            }

            const targetCampus = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
            console.log(`[Academic] getClasses fetching for campus: ${targetCampus}, user role: ${req.user.role}`);
            return await this.academicService.getClassesByCampus(targetCampus);
        } catch (e) {
            console.error('[Academic] getClasses Error:', e);
            throw e;
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('classes/assign-course')
    async assignCourseToClass(@Body() body: { class_id: string; course_id: string; teacher_id: string }) {
        return this.academicService.assignCourseToClass(body);
    }

    // -------------------------
    // 智能排课与发布 API
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/schedule-draft')
    async generateDraft(
        @Request() req: any,
        @Body() body: { assignmentId: string; startDate: string; lessonsCount: number; durationMinutes: number }
    ) {
        return this.academicService.generateDraftSchedules(body.assignmentId, new Date(body.startDate), body.lessonsCount, body.durationMinutes || 45);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('classes/schedule-publish')
    async publishSchedules(@Request() req: any, @Body() body: { lessonIds: string[] }) {
        if (req.user.role.toUpperCase() !== 'CAMPUS_ADMIN' && req.user.role.toUpperCase() !== 'ADMIN') {
            throw new UnauthorizedException('仅教务主管可发布课表');
        }
        return this.academicService.publishSchedules(body.lessonIds, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('courses/:id/delete') // Using POST for delete to avoid some proxy/method issues, or standard DELETE
    async deleteCourse(@Param('id') id: string, @Request() req: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') {
             throw new UnauthorizedException('仅总部管理员可删除标准课程库');
        }
        return this.academicService.deleteCourse(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('classrooms')
    async getCampusClassrooms(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        if (!filterCampusId) throw new BadRequestException('未指定校区');
        return this.academicService.getClassrooms(filterCampusId);
    }
}
