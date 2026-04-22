/**
 * 认证控制器
 * 职责：暴露 /auth/* 登录注册相关 HTTP 接口；以及 /api/admin/users 下的内部员工管理
 * 所属模块：认证授权
 * 核心路由：登录、重置密码、学员/校区/教师自助注册、获取当前用户资料
 */
import { Controller, Post, Body, UnauthorizedException, BadRequestException, Request, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 用户认证控制器
 * 处理登录、注册、密码重置、profile 查询等公共认证接口
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * 用户登录
     * @param req 请求体，包含 username、password
     * @returns 登录成功返回 access_token 和用户信息；失败抛出 401
     */
    @Post('login')
    async login(@Body() req: any) {
        const user = await this.authService.validateUser(req.username, req.password);
        if (!user) {
            throw new UnauthorizedException('无效的用户名或密码');
        }
        return this.authService.login(user);
    }

    /**
     * 总部管理员重置指定账号密码
     * 需登录且角色为 ADMIN
     * @param body.username 目标账号
     * @param body.newPassword 新密码（至少 6 位）
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('reset-password')
    async resetPassword(@Request() req: any, @Body() body: { username: string; newPassword: string }) {
        if (req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅总部管理员可重置密码');
        }
        if (!body.username || !body.newPassword) {
            throw new BadRequestException('请提供账号和新密码');
        }
        if (body.newPassword.length < 6) {
            throw new BadRequestException('新密码长度不能少于6位');
        }
        const result = await this.authService.resetPassword(body.username, body.newPassword);
        if (!result) {
            throw new BadRequestException('该账号不存在，请检查输入');
        }
        return { success: true, message: '密码重置成功' };
    }

    /**
     * 学员自主注册（直接激活，可立即登录使用）
     * @param body 学员注册表单（用户名、密码、姓名、手机、性别、校区等）
     */
    @Post('register/student')
    async registerStudent(@Body() body: any) {
        return this.authService.registerStudent(body);
    }

    /**
     * 校区管理员自主注册（提交后处于待审核状态，需总管理员审核通过才能登录）
     * @param body 校区管理员注册表单（用户名、密码、姓名、手机、校区名、地址等）
     */
    @Post('register/campus')
    async registerCampus(@Body() body: any) {
        return this.authService.registerCampusAdmin(body);
    }

    /**
     * 教师自主注册（提交后处于待审核状态，需校区管理员审核通过才能登录）
     * @param body 教师注册表单（用户名、密码、姓名、手机、希望加入的校区等）
     */
    @Post('register/teacher')
    async registerTeacher(@Body() body: any) {
        return this.authService.registerTeacher(body);
    }

    /**
     * 获取当前登录用户的 profile
     * 需要有效 JWT，直接从 request.user 读取
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }
}

/**
 * 内部员工管理控制器
 * 路径：/api/admin/users
 * 职责：总部/校区管理员创建内部员工账号（直接激活），以及获取教师列表
 * 注：与 AuthController 拆分是为了语义分层 —— 这里是 B 端管理操作
 */
@Controller('api/admin/users')
export class AdminUsersController {
    constructor(private readonly authService: AuthService) { }

    /**
     * 管理员创建内部用户（例如管理员帮老师建账号）
     * 仅 ADMIN 或 CAMPUS_ADMIN 可调用
     * @param body 账号信息（用户名、密码、角色、姓名、校区 ID 等）
     */
    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createInternalUser(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('越权访问，仅限管理员操作');
        }
        return this.authService.registerInternalUser(body);
    }

    /**
     * 获取教师列表（支持按校区筛选）
     * - CAMPUS_ADMIN 只能看自己校区；若无校区 ID 则返回空数组
     * - ADMIN 可按 query 指定 campusId 过滤
     * @param campusId 可选的校区过滤参数
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('teachers')
    async getTeachers(@Request() req: any, @Query('campusId') campusId: string) {
        if (req.user.role === 'CAMPUS_ADMIN' && !req.user.campusId) return [];
        const targetCampus = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return (this.authService as any).usersService.findAllTeachers(targetCampus);
    }
}
