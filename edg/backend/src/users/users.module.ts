/**
 * 用户模块 UsersModule
 * 职责：用户（管理员 / 校区管理员 / 教师 / 学生）、校区、教室等用户域主数据的管理
 * 所属模块：用户管理
 * 导出 UsersService 供 AuthModule 在注册、登录环节使用
 */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Export so AuthModule can use it
})
export class UsersModule { }
