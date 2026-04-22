/**
 * AuthService 单元测试
 * 测试对象：认证服务
 * 所属模块：认证授权
 * 仅验证服务能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

// AuthService 测试套件
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
