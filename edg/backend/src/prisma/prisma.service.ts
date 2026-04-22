/**
 * Prisma 服务
 * 职责：封装 PrismaClient，作为整个应用的数据库访问入口
 * 所属模块：基础设施层
 * 所有业务模块的 Service 都通过注入本服务来操作数据库
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * 继承 PrismaClient，实现 NestJS 生命周期钩子
 * 在模块初始化时自动连接数据库
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    /**
     * NestJS 生命周期钩子：模块初始化时调用
     * 建立与数据库的连接
     */
    async onModuleInit() {
        await this.$connect();
    }
}
