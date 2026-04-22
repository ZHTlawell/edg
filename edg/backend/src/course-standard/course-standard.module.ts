/**
 * 课程标准模块 CourseStandardModule
 * 职责：管理标准化课程大纲（课程标准、章节、知识点）
 * 所属模块：课程体系
 */
import { Module } from '@nestjs/common';
import { CourseStandardService } from './course-standard.service';
import { CourseStandardController } from './course-standard.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CourseStandardController],
    providers: [CourseStandardService],
    exports: [CourseStandardService],
})
export class CourseStandardModule { }
