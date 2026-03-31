import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseStandardService } from './course-standard.service';

@Controller('course-standards')
export class CourseStandardController {
    constructor(private readonly svc: CourseStandardService) { }

    // ─── Category Endpoints ────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('categories')
    getCategories() {
        return this.svc.findAllCategories();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('categories')
    createCategory(@Request() req: any, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.createCategory(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('categories/:id')
    updateCategory(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.updateCategory(id, body);
    }

    // ─── Standard Endpoints ────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('standards')
    getStandards(@Request() req: any, @Query() query: any) {
        if (req.user.role === 'CAMPUS_ADMIN') {
            return this.svc.findAvailableForCampus(req.user.campusId || '');
        }
        return this.svc.findAllStandards(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('standards/:id')
    getStandard(@Param('id') id: string) {
        return this.svc.findOneStandard(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('standards')
    createStandard(@Request() req: any, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.createStandard({ ...body, creator_id: req.user.userId });
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('standards/:id')
    updateStandard(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role.toUpperCase() !== 'ADMIN') throw new ForbiddenException('仅总部管理员可操作');
        return this.svc.updateStandard(id, body, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/enable')
    enableStandard(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.enableStandard(id, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/disable')
    disableStandard(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.disableStandard(id);
    }

    // ─── Template Endpoints ────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Post('standards/:id/template')
    upsertTemplate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException();
        return this.svc.upsertTemplate(id, body);
    }

    // ─── Version History ───────────────────────────────────
    @UseGuards(AuthGuard('jwt'))
    @Get('standards/:id/versions')
    getVersions(@Param('id') id: string) {
        return this.svc.getVersionHistory(id);
    }
}
