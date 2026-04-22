/**
 * JWT 策略
 * 职责：配置 passport-jwt 的 token 解析方式、密钥、过期策略；并提供 payload -> req.user 的映射
 * 所属模块：认证授权
 */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/**
 * JwtStrategy
 * 从 Authorization header 提取 Bearer token，使用固定 secret 校验
 * 校验通过后 validate 返回的对象会挂到 request.user 上
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'SECRET_KEY_FOR_EDG_THESIS', // In production, use environment variables
        });
    }

    /**
     * 将 JWT payload 转成挂到 request.user 上的对象
     * @param payload JWT 解码后的 payload
     * @returns 包含 userId、角色、校区、教师/学生 ID 等的用户信息
     */
    async validate(payload: any) {
        return {
            userId: payload.sub,
            username: payload.username,
            role: payload.role,
            campusId: payload.campusId,
            campusName: payload.campusName,
            teacherId: payload.teacherId,
            studentId: payload.studentId,
            name: payload.name
        };
    }
}
