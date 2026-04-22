/**
 * TeachingService 单元测试
 * 测试对象：教学服务
 * 所属模块：教学执行
 * 仅验证服务能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TeachingService } from './teaching.service';

describe('TeachingService', () => {
  let service: TeachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeachingService],
    }).compile();

    service = module.get<TeachingService>(TeachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
