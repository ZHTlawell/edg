/**
 * 课程目录模块 CourseCatalogModule
 * 职责：管理可售卖的课程目录（课程市场），包含上下架、定价、分类等
 * 所属模块：课程体系
 */
import { Module } from '@nestjs/common';
import { CourseCatalogService } from './course-catalog.service';
import { CourseCatalogController } from './course-catalog.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CourseCatalogController],
    providers: [CourseCatalogService],
    exports: [CourseCatalogService],
})
export class CourseCatalogModule { }
