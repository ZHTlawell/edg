/**
 * TeachingController 单元测试
 * 测试对象：教学控制器
 * 所属模块：教学执行
 * 仅验证控制器能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TeachingController } from './teaching.controller';

describe('TeachingController', () => {
  let controller: TeachingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachingController],
    }).compile();

    controller = module.get<TeachingController>(TeachingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
