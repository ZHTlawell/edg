/**
 * FinanceController 单元测试
 * 测试对象：财务控制器
 * 所属模块：财务管理
 * 仅验证控制器能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';

describe('FinanceController', () => {
  let controller: FinanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
    }).compile();

    controller = module.get<FinanceController>(FinanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
