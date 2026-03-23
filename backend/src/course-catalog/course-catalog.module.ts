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
