/**
 * JWT 守卫
 * 职责：基于 Passport 'jwt' 策略的路由守卫，用于保护需要登录的接口
 * 所属模块：认证授权
 * 用法：在 Controller/handler 上 @UseGuards(JwtAuthGuard)
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 * 直接继承 @nestjs/passport 的 AuthGuard('jwt')
 * 校验请求头 Authorization: Bearer <token>
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
