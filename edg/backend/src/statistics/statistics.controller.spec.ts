/**
 * StatisticsController 单元测试
 * 测试对象：统计控制器
 * 所属模块：数据分析
 * 仅验证控制器能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';

describe('StatisticsController', () => {
  let controller: StatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
