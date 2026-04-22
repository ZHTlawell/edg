/**
 * 统计模块 StatisticsModule
 * 职责：提供管理端 Dashboard、出勤、营收等多维度统计数据接口
 * 所属模块：数据分析
 */
import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService]
})
export class StatisticsModule {}
