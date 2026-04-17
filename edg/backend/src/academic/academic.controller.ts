import { Controller, Get, Post, Patch, Body, UseGuards, Request, Query, UnauthorizedException, Param, BadRequestException } from '@nestjs/common';
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
    async getCourses(@Request() req: any, @Query('campusId') campusId?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
        const userRole = req.user.role.toUpperCase();
        // 校区管理员没有 campus_id 时不返回任何数据（防止数据泄漏）
        if (userRole === 'CAMPUS_ADMIN' && !req.user.campusId) return { data: [], total: 0 };
        // 学员和教师只能看自己所在校区的课程（课程市场也受限）
        let filterCampusId: string | undefined;
        if (userRole === 'CAMPUS_ADMIN') {
            filterCampusId = req.user.campusId;
        } else if (userRole === 'STUDENT' || userRole === 'TEACHER') {
            if (!req.user.campusId) return { data: [], total: 0 };
            filterCampusId = req.user.campusId;
        } else {
            filterCampusId = campusId;
        }
        return this.academicService.getAllCourses(
            filterCampusId,
            page ? parseInt(page) : undefined,
            pageSize ? parseInt(pageSize) : undefined
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('teachers')
    async getTeachers(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        console.log(`[Academic] Fetching teachers for user: ${req.user.username}, role: ${userRole}, targetCampus: ${campusId}`);

        if (userRole === 'CAMPUS_ADMIN' && !req.user.campusId) return [];
        // 核心：校区管理员强制只能看本校区老师，即使前端传了别的 campusId
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getAllTeachers(filterCampusId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('courses')
    async createCourse(@Request() req: any, @Body() body: any) {
        const userRole = req.user.role.toUpperCase();
        // 总部 Admin 不再直接建课程，仅校区管理员可基于标准实例化
        if (userRole !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅校区管理员可基于标准创建课程；总部请通过「课程体系管理」维护标准');
        }
        const campus_id = req.user.campusId;
        return this.academicService.createCourse({
            ...body,
            campus_id
        });
    }

    @Patch('courses/:id')
    @UseGuards(AuthGuard('jwt'))
    async updateCourse(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        const userRole = req.user.role.toUpperCase();
        if (userRole !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('仅校区管理员可修改课程信息');
        }
        return this.academicService.updateCourse(id, body);
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
    async getClasses(@Request() req: any, @Query('campusId') campusId: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
        if (req.user.role === 'TEACHER') {
            return await this.academicService.getClassesByTeacher(req.user.teacherId);
        }

        if (req.user.role === 'STUDENT') {
            return await this.academicService.getClassesByStudent(req.user.studentId);
        }

        if (req.user.role === 'CAMPUS_ADMIN' && !req.user.campusId) return { data: [], total: 0 };
        const targetCampus = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return await this.academicService.getClassesByCampus(
            targetCampus,
            page ? parseInt(page) : undefined,
            pageSize ? parseInt(pageSize) : undefined
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('classes/assign-course')
    async assignCourseToClass(@Body() body: { class_id: string; course_id: string; teacher_id: string }) {
        return this.academicService.assignCourseToClass(body);
    }

    /** 手动将学员加入班级 */
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/:classId/enroll')
    async enrollStudent(@Request() req: any, @Param('classId') classId: string, @Body() body: { studentId: string }) {
        const userRole = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(userRole)) {
            throw new UnauthorizedException('仅管理员可手动分班');
        }
        return this.academicService.enrollStudentInClass(classId, body.studentId);
    }

    // -------------------------
    // 智能排课与发布 API
    // -------------------------
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/schedule-draft')
    async generateDraft(
        @Request() req: any,
        @Body() body: { assignmentId: string; startDate: string; lessonsCount: number; durationMinutes: number; weekdays?: number[]; timeOfDay?: string }
    ) {
        return this.academicService.generateDraftSchedules(
            body.assignmentId,
            new Date(body.startDate),
            body.lessonsCount,
            body.durationMinutes || 45,
            { weekdays: body.weekdays, timeOfDay: body.timeOfDay }
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('classes/repair-enrolled')
    async repairEnrolled(@Request() req: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') {
            throw new UnauthorizedException('仅总部管理员可执行');
        }
        return this.academicService.repairAllClassEnrolled();
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
        // ADMIN 未传校区时返回全量；CAMPUS_ADMIN 强制用自己校区；其他角色无校区返回空数组
        if (!filterCampusId) {
            if (userRole === 'ADMIN') return this.academicService.getClassrooms(undefined);
            return [];
        }
        return this.academicService.getClassrooms(filterCampusId);
    }

    // ─────────────────────────────────────────────
    // 招生管理：PENDING 班查询 & 手动开班
    // ─────────────────────────────────────────────

    /** 查看招生中（PENDING）的班级，了解距开班还差多少人 */
    @UseGuards(AuthGuard('jwt'))
    @Get('classes/pending')
    async getPendingClasses(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getPendingClasses(filterCampusId);
    }

    /** 手动开班：将 PENDING 升级为 ONGOING，发布草稿排课 */
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/:classId/open')
    async openClass(
        @Param('classId') classId: string,
        @Body() body: { force?: boolean },
        @Request() req: any
    ) {
        const userRole = req.user.role.toUpperCase();
        if (userRole !== 'CAMPUS_ADMIN' && userRole !== 'ADMIN') {
            throw new UnauthorizedException('仅教务主管可执行开班操作');
        }
        return this.academicService.openClass(classId, body.force ?? false);
    }
}
