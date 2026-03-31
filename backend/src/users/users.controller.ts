import { Controller, Get, Post, Param, Request, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('students')
    async getStudents(@Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        return this.usersService.findAllStudents();
    }

    // 查询待审核的校区管理员（仅总管理员）
    @UseGuards(AuthGuard('jwt'))
    @Get('pending/campus-admins')
    async getPendingCampusAdmins(@Request() req: any) {
        if (req.user.role !== 'ADMIN') {
            throw new UnauthorizedException('仅总管理员可操作');
        }
        return this.usersService.findPendingCampusAdmins();
    }

    // 查询待审核的教师（总管理员 or 校区管理员）
    @UseGuards(AuthGuard('jwt'))
    @Get('pending/teachers')
    async getPendingTeachers(@Request() req: any, @Query('campusId') campusId?: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权访问');
        }
        // 校区管理员只能看本校区
        const filterCampusId = req.user.role === 'CAMPUS_ADMIN' ? req.user.campusId : campusId;
        return this.usersService.findPendingTeachers(filterCampusId);
    }

    // 审核通过
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/approve')
    async approveUser(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.approveUser(id);
    }

    // 审核拒绝
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/reject')
    async rejectUser(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('无权操作');
        }
        return this.usersService.rejectUser(id);
    }

    // 查询所有可用校区 (Public)
    @Get('campuses')
    async getCampuses() {
        return this.usersService.getAllCampuses();
    }
}
