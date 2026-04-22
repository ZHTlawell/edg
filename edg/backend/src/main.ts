/**
 * 应用入口文件
 * 职责：启动 NestJS 应用、配置全局中间件（CORS、API 前缀、静态资源）
 * 所属模块：根启动
 * 端口：优先读取环境变量 PORT，默认 3001
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * 启动函数：创建 Nest 应用实例并监听端口
 * - 开启 CORS，允许跨域请求（含认证头）
 * - 设置全局路由前缀 /api
 * - 将 uploads 目录作为静态资源对外暴露（访问路径：/uploads/xxx）
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  app.setGlobalPrefix('api');
  // Serve uploaded files as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
