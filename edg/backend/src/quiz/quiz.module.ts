/**
 * 测验模块 QuizModule
 * 职责：学生端测验 / 作业的创建、答题、提交、评分
 * 所属模块：学习评估
 */
import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService],
})
export class QuizModule { }
