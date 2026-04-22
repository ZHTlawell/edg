/**
 * 根模块 AppModule
 * 职责：聚合所有业务模块（认证、用户、财务、教务、教学、公告、课程、统计、测验等）
 * 所属模块：根模块
 * 这是 NestJS 应用的顶层模块，由 main.ts 中的 NestFactory 引导启动
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FinanceModule } from './finance/finance.module';
import { AcademicModule } from './academic/academic.module';
import { TeachingModule } from './teaching/teaching.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { CourseStandardModule } from './course-standard/course-standard.module';
import { CourseResourceModule } from './course-resource/course-resource.module';
import { CourseCatalogModule } from './course-catalog/course-catalog.module';
import { StatisticsModule } from './statistics/statistics.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, FinanceModule, AcademicModule, TeachingModule, AnnouncementsModule, CourseStandardModule, CourseResourceModule, CourseCatalogModule, StatisticsModule, QuizModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
