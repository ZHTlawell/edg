/**
 * 教学模块 TeachingModule
 * 职责：教师端业务（课表、点名、批改、签到、备课等教学执行环节）
 * 所属模块：教学执行
 */
import { Module } from '@nestjs/common';
import { TeachingService } from './teaching.service';
import { TeachingController } from './teaching.controller';

@Module({
  providers: [TeachingService],
  controllers: [TeachingController]
})
export class TeachingModule {}
