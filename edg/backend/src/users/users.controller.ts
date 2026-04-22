/**
 * 用户控制器
 * 职责：暴露 /users 路由，处理学员列表查询、待审核用户审批、学员状态流转、校区列表等
 * 所属模块：用户管理
 * 大部分接口仅 ADMIN / CAMPUS_ADMIN 可调用，/users/campuses 为公开接口
 */
import { Controller, Get, Post, Param, Body, Request, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 用户 HTTP 控制器
 * 供管理端做学员管理、账号审核、校区信息查询
 */
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * 分页查询学员列表
     * 校区管理员仅能看本校区学员；未绑定校区返回空
     * @param page 页码
     * @param pageSize 每页条数
     * @param campusId 校区 ID（ADMIN 可指定）
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('students')
    async getStudents(@Request() req: any, @Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('campusId') campusId?: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        // 校区管理员未绑定 campus_id 时返回空，防止数据泄漏
        if (req.user.role === 'CAMPUS_ADMIN' && !req.user.campusId) return { data: [], total: 0 };
        // Campus admin can only see their own campus students
        const effectiveCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.usersService.findAllStudents(
            page ? parseInt(page) : undefined,
            pageSize ? parseInt(pageSize) : undefined,
            effectiveCampusId
        );
    }

    /**
     * 查询待审核的校区管理员列表
     * 仅总管理员 ADMIN 可访问
     */
    // 查询待审核的校区管理员（仅总管理员）
    @UseGuards(AuthGuard('jwt'))
    @Get('pending/campus-admins')
    async getPendingCampusAdmins(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅总管理员可操作');
        }
        return this.usersService.findPendingCampusAdmins();
    }

    /**
     * 查询待审核的教师列表
     * CAMPUS_ADMIN 仅看本校区；ADMIN 可按 campusId 过滤
     */
    // 查询待审核的教师（总管理员 or 校区管理员）
    @UseGuards(AuthGuard('jwt'))
    @Get('pending/teachers')
    async getPendingTeachers(@Request() req: any, @Query('campusId') campusId?: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        const filterCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.usersService.findPendingTeachers(filterCampusId);
    }

    /**
     * 查询待审核的学员列表
     * CAMPUS_ADMIN 仅看本校区；ADMIN 可指定 campusId
     */
    // 查询待审核的学员（校区管理员审本校区）
    @UseGuards(AuthGuard('jwt'))
    @Get('pending/students')
    async getPendingStudents(@Request() req: any, @Query('campusId') campusId?: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        const filterCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.usersService.findPendingStudents(filterCampusId);
    }

    /**
     * 管理员代建学员（免审直接激活）
     * CAMPUS_ADMIN 强制使用自己校区 ID / 校区名
     * @param body 学员信息（姓名、手机、性别、校区等）
     */
    // 管理员代建学员
    @UseGuards(AuthGuard('jwt'))
    @Post('students/create')
    async createStudentByAdmin(@Request() req: any, @Body() body: { name: string; phone: string; gender?: string; campusName?: string; campus_id?: string }) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        const campus_id = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : body.campus_id;
        const campusName = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusName : body.campusName;
        return this.usersService.createStudentByAdmin({ ...body, campus_id, campusName });
    }

    /**
     * 学员状态流转（如在读 -> 休学 -> 退学等）
     * @param id 学员 ID
     * @param body.toStatus 目标状态
     * @param body.reason 备注原因
     */
    // 学员状态流转
    @UseGuards(AuthGuard('jwt'))
    @Post('students/:id/status')
    async updateStudentStatus(@Param('id') id: string, @Request() req: any, @Body() body: { toStatus: string; reason?: string }) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.updateStudentStatus({
            studentId: id,
            toStatus: body.toStatus,
            reason: body.reason,
            operatorId: req.user.userId,
        });
    }

    /**
     * 查看学员状态变更历史
     * @param id 学员 ID
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('students/:id/status-logs')
    async getStudentStatusLogs(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.getStudentStatusLogs(id);
    }

    /**
     * 审核通过（将状态置为 ACTIVE）
     * @param id 用户 ID
     */
    // 审核通过
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/approve')
    async approveUser(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.approveUser(id);
    }

    /**
     * 审核拒绝
     * @param id 用户 ID
     */
    // 审核拒绝
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/reject')
    async rejectUser(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.rejectUser(id);
    }

    /**
     * 查询所有可用校区（公开接口，无需登录）
     * 用于注册页的校区下拉选项
     */
    // 查询所有可用校区 (Public)
    @Get('campuses')
    async getCampuses() {
        return this.usersService.getAllCampuses();
    }
}
