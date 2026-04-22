/**
 * 教务模块 AcademicModule
 * 职责：聚合教务相关的 Controller 和 Service
 * 所属模块：教务管理（班级、课次、考勤、请假、调课等）
 */
import { Module } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AcademicController } from './academic.controller';

@Module({
  providers: [AcademicService],
  controllers: [AcademicController]
})
export class AcademicModule {}
