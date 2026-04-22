/**
 * PrismaService 单元测试
 * 测试对象：PrismaService
 * 所属模块：基础设施层
 * 仅验证服务能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// PrismaService 测试套件
describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
