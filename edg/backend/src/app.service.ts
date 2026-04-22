/**
 * 根服务 AppService
 * 职责：为根控制器提供最基础的业务方法
 * 所属模块：根模块
 */
import { Injectable } from '@nestjs/common';

/**
 * 应用根服务
 * 目前只提供 Hello World 字符串，可用于占位或后续扩展
 */
@Injectable()
export class AppService {
  /**
   * 返回 Hello World 字符串
   * 被 AppController.getHello 调用
   */
  getHello(): string {
    return 'Hello World!';
  }
}
