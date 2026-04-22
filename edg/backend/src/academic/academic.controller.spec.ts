/**
 * AcademicController 单元测试
 * 测试对象：教务控制器
 * 所属模块：教务管理
 * 仅验证控制器能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AcademicController } from './academic.controller';

describe('AcademicController', () => {
  let controller: AcademicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicController],
    }).compile();

    controller = module.get<AcademicController>(AcademicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
