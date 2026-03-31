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
