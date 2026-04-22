/**
 * 公告模块 AnnouncementsModule
 * 职责：管理系统公告的发布、查询、更新、删除
 * 所属模块：消息通知
 */
import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AnnouncementsController],
    providers: [AnnouncementsService],
})
export class AnnouncementsModule { }
