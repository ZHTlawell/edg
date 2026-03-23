import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards, Request, ForbiddenException, UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CourseResourceService } from './course-resource.service';

const UPLOAD_DIR = './uploads/resources';
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = [
    '.mp4', '.avi', '.mov', '.webm',          // video
    '.pptx', '.ppt',                           // ppt
    '.pdf',                                    // pdf
    '.mp3', '.ogg', '.wav',                    // audio
    '.doc', '.docx', '.xls', '.xlsx',         // docs
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.jdg', '.heic', // images
];

@Controller('course-resource')
export class CourseResourceController {
    constructor(private readonly svc: CourseResourceService) { }

    // ─── File Upload ──────────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: UPLOAD_DIR,
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    cb(null, `${unique}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                const ext = extname(file.originalname).toLowerCase();
                if (ALLOWED_TYPES.includes(ext)) {
                    cb(null, true);
                } else {
                    cb(new Error(`不支持的文件类型: ${ext}`), false);
                }
            },
            limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
        }),
    )
    async uploadFile(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        if (!file) throw new Error('未收到文件');

        const ext = extname(file.originalname).toLowerCase();
        const type = ['.mp4', '.avi', '.mov', '.webm'].includes(ext)
            ? 'VIDEO'
            : ['.pptx', '.ppt'].includes(ext)
                ? 'PPT'
                : ext === '.pdf'
                    ? 'PDF'
                    : ['.mp3', '.ogg', '.wav'].includes(ext)
                        ? 'AUDIO'
                        : 'OTHER';

        return this.svc.createResource({
            title: body.title || file.originalname,
            type,
            url: `/uploads/resources/${file.filename}`,
            file_name: file.originalname,
            file_size: file.size,
            description: body.description,
            standard_id: body.standard_id || undefined,
            creator_id: req.user.userId,
        });
    }

    // Add external video URL (no upload)
    @UseGuards(AuthGuard('jwt'))
    @Post('url')
    addUrl(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.createResource({
            title: body.title,
            type: body.type || 'VIDEO',
            url: body.url,
            description: body.description,
            standard_id: body.standard_id || undefined,
            creator_id: req.user.userId,
        });
    }

    // ─── Resources ────────────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('resources')
    async getResources(@Request() req: any, @Query() query: any) {
        if (req.user.role === 'CAMPUS_ADMIN') {
            return this.svc.findAvailableForCampus(req.user.campusId || '');
        }
        return this.svc.findAllResources(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('resources/:id')
    getResource(@Param('id') id: string) {
        return this.svc.findOneResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('resources/:id')
    updateResource(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.updateResource(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('resources/:id/publish')
    publish(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.publishResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('resources/:id/withdraw')
    withdraw(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.withdrawResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('resources/:id')
    deleteResource(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.deleteResource(id);
    }

    // ─── Chapters ─────────────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('chapters')
    getChapters(@Query('standard_id') standard_id: string) {
        return this.svc.findChapters(standard_id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('chapters')
    createChapter(@Request() req: any, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.createChapter(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('chapters/:id')
    updateChapter(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.updateChapter(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('chapters/:id')
    deleteChapter(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.deleteChapter(id);
    }

    // ─── Lessons ──────────────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Post('lessons')
    createLesson(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.createLesson(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('lessons/:id')
    updateLesson(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.updateLesson(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('lessons/:id')
    deleteLesson(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.deleteLesson(id);
    }

    // ─── Lesson Resources ─────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Post('lessons/:id/resources')
    addResourceToLesson(
        @Request() req: any,
        @Param('id') lesson_id: string,
        @Body() body: { resource_id: string; sort_order?: number },
    ) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.addResourceToLesson(lesson_id, body.resource_id, body.sort_order);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('lessons/:lessonId/resources/:resourceId')
    removeResourceFromLesson(
        @Request() req: any,
        @Param('lessonId') lesson_id: string,
        @Param('resourceId') resource_id: string,
    ) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.removeResourceFromLesson(lesson_id, resource_id);
    }
}
