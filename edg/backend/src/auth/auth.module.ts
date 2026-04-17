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
