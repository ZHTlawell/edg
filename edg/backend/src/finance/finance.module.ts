/**
 * 财务模块 FinanceModule
 * 职责：报名缴费、退费、订单、收支流水等财务相关业务
 * 所属模块：财务管理
 */
import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  providers: [FinanceService],
  controllers: [FinanceController]
})
export class FinanceModule {}
