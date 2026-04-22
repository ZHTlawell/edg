/**
 * 课程资源模块 CourseResourceModule
 * 职责：管理课程资源（课件、视频、文档等）的上传、下载、分发
 * 所属模块：课程体系
 * 使用 Multer 实现文件上传
 */
import { Module } from '@nestjs/common';
import { CourseResourceService } from './course-resource.service';
import { CourseResourceController } from './course-resource.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [PrismaModule, MulterModule.register({})],
    controllers: [CourseResourceController],
    providers: [CourseResourceService],
    exports: [CourseResourceService],
})
export class CourseResourceModule { }
