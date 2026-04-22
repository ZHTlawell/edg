/**
 * AcademicService 单元测试
 * 测试对象：教务服务
 * 所属模块：教务管理
 * 仅验证服务能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AcademicService } from './academic.service';

describe('AcademicService', () => {
  let service: AcademicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicService],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
