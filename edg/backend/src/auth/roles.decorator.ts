/**
 * 角色装饰器
 * 职责：以 @Roles('ADMIN', 'TEACHER') 方式给路由打上角色元数据，供 RolesGuard 消费
 * 所属模块：认证授权
 */
import { SetMetadata } from '@nestjs/common';

/**
 * @Roles 装饰器
 * 将所需角色列表写入路由 metadata（key='roles'）
 * @param roles 允许访问该路由的角色字符串列表
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
