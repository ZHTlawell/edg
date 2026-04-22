/**
 * 认证服务
 * 职责：用户身份验证、JWT 签发、密码 bcrypt 加密、各角色注册逻辑
 * 所属模块：认证授权
 * 被 AuthController / AdminUsersController 依赖注入
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * 认证业务服务
 * 封装登录校验、JWT 颁发、各类注册、密码重置等核心逻辑
 */
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    /**
     * 校验用户名+密码是否正确
     * - 用户不存在或密码错误返回 null
     * - 账号状态为待审核或已禁用时直接抛 401
     * @param username 登录账号
     * @param pass 明文密码
     * @returns 去掉密码哈希的用户对象，或 null
     */
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

    /**
     * 为已通过校验的用户签发 JWT
     * 特殊逻辑：存量校区管理员若缺 campus_id，会在此处补一个随机 UUID
     * 并同步初始化该校区的 20 间教室数据
     * @param user validateUser 返回的用户对象
     * @returns { access_token, user } 结构
     */
    async login(user: any) {
        // 存量校区管理员如果没有 campus_id，登录时为其补全一个独立的校区ID
        // 防止多个校区管理员因 campus_id 都是 null 而互相看到彼此数据
        let campusId = user.campus_id;
        if (user.role === 'CAMPUS_ADMIN' && !campusId) {
            const { randomUUID } = await import('crypto');
            campusId = randomUUID();
            await this.usersService.updateCampusId(user.id, campusId);
            // 顺便给新校区初始化20个教室
            await this.usersService.initClassroomsForCampus(campusId);
        }

        const payload: any = {
            username: user.username,
            sub: user.id,
            role: user.role,
            name: user.teacherProfile?.name || user.studentProfile?.name || user.username,
            campusId,
            campusName: user.campusName,
            studentId: user.studentProfile?.id,
            teacherId: user.teacherProfile?.id
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }

    /**
     * C 端学员自主注册（直接激活）
     * 密码使用 bcrypt 加盐 10 轮
     * 同时根据校区名反查 campus_id（若匹配）
     * @param data 学员注册表单
     */
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

    /**
     * 校区端自主注册（等待总管理员审核）
     * 注册后账号状态为 PENDING_APPROVAL
     * @param data 校区管理员注册表单
     */
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

    /**
     * 教师端自主注册（等待校区管理员审核）
     * @param data 教师注册表单，需带希望加入的校区
     */
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

    /**
     * 密码重置
     * 通过用户名定位用户并用新密码覆盖哈希
     * @param username 目标账号
     * @param newPassword 新明文密码
     * @returns 找不到账号返回 null，成功返回 { success: true }
     */
    async resetPassword(username: string, newPassword: string) {
        const user = await this.usersService.findOneByUsername(username);
        if (!user) {
            return null;
        }
        const hash = await bcrypt.hash(newPassword, 10);
        await this.usersService.resetPassword(username, hash);
        return { success: true };
    }

    /**
     * B 端内部账号创建（例如管理员帮老师建账号） — 创建后直接激活
     * @param data 账号信息（用户名、密码、角色、姓名、校区 ID）
     */
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
