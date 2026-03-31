import { Controller, Post, Body, UnauthorizedException, BadRequestException, Request, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() req: any) {
        const user = await this.authService.validateUser(req.username, req.password);
        if (!user) {
            throw new UnauthorizedException('无效的用户名或密码');
        }
        return this.authService.login(user);
    }

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

    // 学员自主注册（直接激活）
    @Post('register/student')
    async registerStudent(@Body() body: any) {
        return this.authService.registerStudent(body);
    }

    // 校区端自主注册（等待总管理员审核）
    @Post('register/campus')
    async registerCampus(@Body() body: any) {
        return this.authService.registerCampusAdmin(body);
    }

    // 教师端自主注册（等待校区管理员审核）
    @Post('register/teacher')
    async registerTeacher(@Body() body: any) {
        return this.authService.registerTeacher(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }
}

// B端单独分离在 admin 控制器下，用于创建内部员工（管理员直接创建，立即激活）
@Controller('api/admin/users')
export class AdminUsersController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createInternalUser(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMPUS_ADMIN') {
            throw new UnauthorizedException('越权访问，仅限管理员操作');
        }
        return this.authService.registerInternalUser(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('teachers')
    async getTeachers(@Request() req: any, @Query('campusId') campusId: string) {
        const targetCampus = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return (this.authService as any).usersService.findAllTeachers(targetCampus);
    }
}
