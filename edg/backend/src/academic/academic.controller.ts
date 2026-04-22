/**
 * 教务控制器
 * 职责：暴露 /academic 路由，管理课程、教师、班级、课次、教室、招生、开班等教务主数据
 * 所属模块：教务管理
 * 权限：按角色区分 — ADMIN / CAMPUS_ADMIN / TEACHER / STUDENT 看到的数据和可做的操作不同
 */
import { Controller, Get, Post, Patch, Body, UseGuards, Request, Query, UnauthorizedException, Param, BadRequestException } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 教务 HTTP 控制器
 * 汇聚教务域所有对外接口：课程、教师、班级、排课、招生管理等
 */
@Controller('academic')
export class AcademicController {
    constructor(private readonly academicService: AcademicService) { }

    // -------------------------
    // 课程 API (对所有角色开放查看)
    // -------------------------
    /**
     * 分页查询课程列表
     * 校区管理员只能看本校区；学生/教师未绑定校区返回空
     * @param campusId 校区过滤
     * @param page 页码
     * @param pageSize 每页条数
     */
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

    /**
     * 查询教师列表
     * CAMPUS_ADMIN 强制只能看本校区教师，即使前端传了其他 campusId 也会被覆盖
     * @param campusId 校区过滤
     */
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

    /**
     * 基于课程标准创建课程实例
     * 仅 CAMPUS_ADMIN 可操作；总部 Admin 通过「课程体系管理」维护标准，不直接创建课程实例
     * @param body 课程信息（来自某个 standardId 的实例化）
     */
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

    /**
     * 更新课程信息
     * 仅 CAMPUS_ADMIN 可操作
     * @param id 课程 ID
     * @param body 要更新的字段
     */
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
    /**
     * 创建班级（含排课 assignment 嵌套数据）
     * CAMPUS_ADMIN 强制使用自己的 campusId，防止越权创建到其他校区
     * 关键字段：name、capacity、campus_id、assignment（课程+老师关联）
     * @param body 班级信息
     */
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

    /**
     * 获取班级详情（含学员、课次、老师等扩展信息）
     * @param id 班级 ID
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('classes/:id')
    async getClassDetail(@Param('id') id: string) {
        return this.academicService.getClassDetail(id);
    }

    /**
     * 班级列表查询（按角色分发到不同的查询逻辑）
     * - TEACHER：返回自己带的班级
     * - STUDENT：返回自己所在的班级
     * - ADMIN / CAMPUS_ADMIN：按校区分页查询
     * @param campusId 校区过滤（仅总部 ADMIN 有效）
     */
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

    /**
     * 为班级指派课程与老师
     * @param body.class_id 班级 ID
     * @param body.course_id 课程 ID
     * @param body.teacher_id 主讲老师 ID
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/assign-course')
    async assignCourseToClass(@Body() body: { class_id: string; course_id: string; teacher_id: string }) {
        return this.academicService.assignCourseToClass(body);
    }

    /**
     * 手动将学员加入班级
     * 仅 ADMIN / CAMPUS_ADMIN 可操作
     * @param classId 班级 ID
     * @param body.studentId 学员 ID
     */
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
    /**
     * 智能生成草稿排课
     * 依据开课日期、每周上课日、上课时段，自动铺满指定节数的课次
     * @param body.assignmentId 课程-班级绑定 ID
     * @param body.startDate 开课起始日期
     * @param body.lessonsCount 需要生成的总课次数
     * @param body.durationMinutes 每节课时长（分钟），默认 45
     * @param body.weekdays 每周上课星期（0-6）
     * @param body.timeOfDay 时段（如 "19:00"）
     */
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

    /**
     * 历史数据修复：重算所有班级的 enrolled 学员数
     * 仅总部 ADMIN 可执行，一般作为一次性数据订正脚本入口
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/repair-enrolled')
    async repairEnrolled(@Request() req: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') {
            throw new UnauthorizedException('仅总部管理员可执行');
        }
        return this.academicService.repairAllClassEnrolled();
    }

    /**
     * 将草稿课次批量发布为正式排课
     * 仅 CAMPUS_ADMIN / ADMIN 可操作
     * @param body.lessonIds 要发布的课次 ID 列表
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('classes/schedule-publish')
    async publishSchedules(@Request() req: any, @Body() body: { lessonIds: string[] }) {
        if (req.user.role.toUpperCase() !== 'CAMPUS_ADMIN' && req.user.role.toUpperCase() !== 'ADMIN') {
            throw new UnauthorizedException('仅教务主管可发布课表');
        }
        return this.academicService.publishSchedules(body.lessonIds, req.user.userId);
    }

    /**
     * 删除标准课程库中的一门课程
     * 仅总部 ADMIN 可操作
     * 使用 POST 代替 DELETE，规避代理层对 DELETE 的限制
     * @param id 课程 ID
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('courses/:id/delete') // Using POST for delete to avoid some proxy/method issues, or standard DELETE
    async deleteCourse(@Param('id') id: string, @Request() req: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') {
             throw new UnauthorizedException('仅总部管理员可删除标准课程库');
        }
        return this.academicService.deleteCourse(id);
    }

    /**
     * 查询校区教室列表（用于排课选教室）
     * CAMPUS_ADMIN 强制自己校区；ADMIN 未传 campusId 时返回全量
     * @param campusId 校区 ID 过滤
     */
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

    /**
     * 查看招生中（PENDING）的班级，了解距离开班还差多少人
     * CAMPUS_ADMIN 强制看本校区
     * @param campusId 校区过滤
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('classes/pending')
    async getPendingClasses(@Request() req: any, @Query('campusId') campusId?: string) {
        const userRole = req.user.role.toUpperCase();
        const filterCampusId = userRole === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.academicService.getPendingClasses(filterCampusId);
    }

    /**
     * 手动开班：将 PENDING 升级为 ONGOING，并发布草稿排课
     * 仅 CAMPUS_ADMIN / ADMIN 可操作
     * @param classId 班级 ID
     * @param body.force 是否强制开班（忽略人数不足等警告）
     */
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
