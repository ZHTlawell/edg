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

/** multer 默认按 latin1 编码 originalname，中文文件名需还原为 utf8 */
function fixOriginalName(file: Express.Multer.File): string {
    try {
        return Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
        return file.originalname;
    }
}

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
        const role = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN', 'TEACHER'].includes(role)) throw new ForbiddenException('无权限上传资源');
        if (!file) throw new Error('未收到文件');

        const originalName = fixOriginalName(file);
        const ext = extname(originalName).toLowerCase();
        const type = ['.mp4', '.avi', '.mov', '.webm'].includes(ext)
            ? 'VIDEO'
            : ['.pptx', '.ppt'].includes(ext)
                ? 'PPT'
                : ext === '.pdf'
                    ? 'PDF'
                    : ['.doc', '.docx', '.xls', '.xlsx'].includes(ext)
                        ? 'DOCUMENT'
                        : ['.mp3', '.ogg', '.wav'].includes(ext)
                            ? 'AUDIO'
                            : ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'].includes(ext)
                                ? 'IMAGE'
                                : 'OTHER';

        // scope=CLASS → 班级资料，教师直传，免审批自动发布
        // scope=STANDARD → 课程标准资源，教师提交需审批，管理员创建为草稿
        const isClassMaterial = body.scope === 'CLASS' && body.class_id && role === 'TEACHER';
        const status = isClassMaterial ? 'PUBLISHED' : (role === 'TEACHER' ? 'PENDING_REVIEW' : 'DRAFT');

        return this.svc.createResource({
            title: body.title || originalName,
            type,
            url: `/uploads/resources/${file.filename}`,
            file_name: originalName,
            file_size: file.size,
            description: body.description,
            standard_id: body.standard_id || undefined,
            class_id: isClassMaterial ? body.class_id : undefined,
            scope: isClassMaterial ? 'CLASS' : 'STANDARD',
            creator_id: req.user.userId,
            status,
        });
    }

    // Add external video URL (no upload)
    @UseGuards(AuthGuard('jwt'))
    @Post('url')
    addUrl(@Request() req: any, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException('仅管理员可操作');
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

    // ─── Class Materials (班级资料) ─────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('my-class-materials')
    async getMyClassMaterials(@Request() req: any) {
        return this.svc.findMaterialsForStudent(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('class-materials/:classId')
    async getClassMaterials(@Param('classId') classId: string) {
        return this.svc.findClassMaterials(classId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('class-materials/:id')
    async deleteClassMaterial(@Request() req: any, @Param('id') id: string) {
        return this.svc.deleteClassMaterial(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('resources/:id')
    getResource(@Param('id') id: string) {
        return this.svc.findOneResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('resources/:id')
    async updateResource(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        const role = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(role)) throw new ForbiddenException();
        if (role === 'CAMPUS_ADMIN') await this.svc.assertResourceOwner(id, req.user.userId);
        return this.svc.updateResource(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('resources/:id/publish')
    async publish(@Request() req: any, @Param('id') id: string) {
        const role = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(role)) throw new ForbiddenException();
        if (role === 'CAMPUS_ADMIN') await this.svc.assertResourceOwner(id, req.user.userId);
        return this.svc.publishResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('resources/:id/withdraw')
    async withdraw(@Request() req: any, @Param('id') id: string) {
        const role = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(role)) throw new ForbiddenException();
        if (role === 'CAMPUS_ADMIN') await this.svc.assertResourceOwner(id, req.user.userId);
        return this.svc.withdrawResource(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('resources/:id')
    async deleteResource(@Request() req: any, @Param('id') id: string) {
        const role = req.user.role.toUpperCase();
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(role)) throw new ForbiddenException();
        if (role === 'CAMPUS_ADMIN') await this.svc.assertResourceOwner(id, req.user.userId);
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
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException('仅管理员可操作');
        return this.svc.createChapter(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('chapters/:id')
    updateChapter(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException('仅管理员可操作');
        return this.svc.updateChapter(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('chapters/:id')
    deleteChapter(@Request() req: any, @Param('id') id: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
        return this.svc.deleteChapter(id);
    }

    // ─── Lessons ──────────────────────────────────────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Post('lessons')
    createLesson(@Request() req: any, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
        return this.svc.createLesson(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('lessons/:id')
    updateLesson(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
        return this.svc.updateLesson(id, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('lessons/:id')
    deleteLesson(@Request() req: any, @Param('id') id: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
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
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
        return this.svc.addResourceToLesson(lesson_id, body.resource_id, body.sort_order);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('lessons/:lessonId/resources/:resourceId')
    removeResourceFromLesson(
        @Request() req: any,
        @Param('lessonId') lesson_id: string,
        @Param('resourceId') resource_id: string,
    ) {
        if (!['ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role.toUpperCase())) throw new ForbiddenException();
        return this.svc.removeResourceFromLesson(lesson_id, resource_id);
    }
}
