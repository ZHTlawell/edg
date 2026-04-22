/**
 * AuthController 单元测试
 * 测试对象：认证控制器
 * 所属模块：认证授权
 * 仅验证控制器能正确实例化
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

// AuthController 测试套件
describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
