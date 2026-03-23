import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByUsername(username);
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(pass, user.password_hash);
        if (!passwordMatch) return null;

        // 审核中账号拒绝登录
        if (user.status === 'PENDING_APPROVAL') {
            throw new UnauthorizedException('账号审核中，请等待管理员审核通过后再登录');
        }
        if (user.status === 'DISABLED') {
            throw new UnauthorizedException('账号已被禁用，请联系管理员');
        }

        const { password_hash, ...result } = user;
        return result;
    }

    async login(user: any) {
        const payload: any = {
            username: user.username,
            sub: user.id,
            role: user.role,
            name: user.teacherProfile?.name || user.studentProfile?.name || user.username,
            campusId: user.campus_id,
            campusName: user.campusName,
            studentId: user.studentProfile?.id,
            teacherId: user.teacherProfile?.id
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }

    // C端专用学员自助注册
    async registerStudent(data: any) {
        const hash = await bcrypt.hash(data.password, 10);

        // 可选：根据名称查一下 campus_id
        const campuses = await this.usersService.getAllCampuses();
        const campusObj = campuses.find(c => c.name === data.campus);

        return this.usersService.createStudentUser({
            username: data.username,
            password_hash: hash,
            name: data.name,
            phone: data.phone,
            gender: data.gender,
            campusName: data.campus,
            campus_id: campusObj?.id || undefined
        });
    }

    // 校区端自主注册（需总管理员审核）
    async registerCampusAdmin(data: any) {
        const hash = await bcrypt.hash(data.password, 10);
        return this.usersService.createPendingUser({
            username: data.username,
            password_hash: hash,
            role: 'CAMPUS_ADMIN',
            name: data.name,
            phone: data.phone,
            campusName: data.campusName,
            address: data.address,
        });
    }

    // 教师端自主注册（需校区管理员审核）
    async registerTeacher(data: any) {
        const hash = await bcrypt.hash(data.password, 10);
        return this.usersService.createPendingUser({
            username: data.username,
            password_hash: hash,
            role: 'TEACHER',
            name: data.name,
            phone: data.phone,
            campusName: data.campusName,   // 教师填写希望加入的校区
            campus_id: data.campus_id,
        });
    }

    // B端内部账号创建 (例如管理员建老师账号) — 直接激活
    async registerInternalUser(data: any) {
        const hash = await bcrypt.hash(data.password, 10);
        return this.usersService.createInternalUser({
            username: data.username,
            password_hash: hash,
            role: data.role,
            name: data.name,
            campus_id: data.campus_id
        });
    }
}
