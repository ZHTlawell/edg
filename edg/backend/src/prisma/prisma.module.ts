/**
 * Prisma 模块
 * 职责：将 PrismaService 注册为全局可用的 Provider
 * 所属模块：基础设施层
 * 使用 @Global 装饰后，任何其他模块都无需 imports 即可注入 PrismaService
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule { }
