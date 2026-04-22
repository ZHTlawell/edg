/**
 * 角色守卫
 * 职责：读取路由上的 @Roles 元数据，校验当前登录用户角色是否在允许列表内
 * 所属模块：认证授权
 * 通常与 JwtAuthGuard 叠加使用
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RolesGuard
 * 基于路由元数据做 RBAC 访问控制
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    /**
     * 判断请求是否被允许
     * - 如果路由未声明 @Roles，直接放行
     * - 否则要求当前用户的 role 在所需角色列表中
     * @param context 执行上下文
     */
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.includes(user.role);
    }
}
