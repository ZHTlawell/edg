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
