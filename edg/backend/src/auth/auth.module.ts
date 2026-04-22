/**
 * 认证模块 AuthModule
 * 职责：处理登录、注册、JWT 签发与校验、密码重置、内部员工创建
 * 所属模块：认证授权
 * 依赖：UsersModule（查询用户），PassportModule + JwtModule（JWT 策略）
 */
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController, AdminUsersController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: 'SECRET_KEY_FOR_EDG_THESIS', // For dev only
      signOptions: { expiresIn: '7d' }, // 7 days
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController, AdminUsersController],
})
export class AuthModule { }
