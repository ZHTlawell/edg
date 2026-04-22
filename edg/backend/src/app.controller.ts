/**
 * 根控制器 AppController
 * 职责：提供根路径 GET / 的健康检查响应
 * 所属模块：根模块
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * 应用根控制器
 * 处理最顶层（/api/）的请求
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 根路径 GET 请求处理
   * 返回一个简单的 Hello World 字符串，用作健康检查
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
