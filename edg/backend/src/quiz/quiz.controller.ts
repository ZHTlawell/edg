/**
 * 测验控制器
 * 职责：暴露 /quiz 路由，提供试卷创建、查询、删除、学员答题提交及成绩查询
 * 所属模块：学习评估
 * 整个 controller 统一启用 JWT 守卫
 */
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * 测验 HTTP 控制器
 * 分教师/管理员侧（出卷、删卷）与学员侧（答题、查成绩）
 */
@Controller('quiz')
@UseGuards(AuthGuard('jwt'))
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    /**
     * 教师或管理员创建试卷
     * @param body 试卷内容（题目、章节、分值等）
     * creatorId 会自动从当前登录用户注入
     */
    // 教师/管理员创建试卷
    @Post('papers')
    async createPaper(@Request() req: any, @Body() body: any) {
        if (!['TEACHER', 'ADMIN', 'CAMPUS_ADMIN'].includes(req.user.role)) {
            throw new UnauthorizedException('仅教师或管理员可创建试卷');
        }
        return this.quizService.createPaper({ ...body, creatorId: req.user.userId });
    }

    /**
     * 删除试卷
     * 仅 ADMIN / CAMPUS_ADMIN / TEACHER 可调用
     * @param paperId 试卷 ID
     */
    // 删除试卷（管理员/出题人）
    @Delete('papers/:paperId')
    async deletePaper(@Request() req: any, @Param('paperId') paperId: string) {
        if (!['ADMIN', 'CAMPUS_ADMIN', 'TEACHER'].includes(req.user.role)) {
            throw new UnauthorizedException('无权删除试卷');
        }
        return this.quizService.deletePaper(paperId);
    }

    /**
     * 获取指定章节下的试卷列表
     * @param chapterId 章节 ID
     */
    // 获取章节的试卷列表
    @Get('papers/by-chapter/:chapterId')
    async getPapersByChapter(@Param('chapterId') chapterId: string) {
        return this.quizService.getPapersByChapter(chapterId);
    }

    /**
     * 获取试卷详情（答题模式：不包含标准答案）
     * @param paperId 试卷 ID
     */
    // 获取试卷详情（答题用，不含答案）
    @Get('papers/:paperId')
    async getPaper(@Param('paperId') paperId: string) {
        return this.quizService.getPaper(paperId);
    }

    /**
     * 学员提交答卷
     * @param body 答卷内容（答案、paperId 等）
     * studentId 自动从登录态注入
     */
    // 学员提交答卷
    @Post('submit')
    async submitQuiz(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'STUDENT') {
            throw new UnauthorizedException('仅学员可提交答卷');
        }
        const studentId = req.user.studentId || req.user.userId;
        return this.quizService.submitQuiz({ ...body, studentId });
    }

    /**
     * 查看答题记录
     * - 学员：只能看自己的
     * - ADMIN / CAMPUS_ADMIN / TEACHER：可通过 studentId 查询指定学员
     * @param courseId 课程 ID，用于过滤
     * @param queryStudentId 可选，指定目标学员
     */
    // 查看学员测验记录（学员看自己；admin/campus_admin/teacher 可传 studentId 查任意学员）
    @Get('submissions')
    async getMySubmissions(
        @Request() req: any,
        @Query('courseId') courseId: string,
        @Query('studentId') queryStudentId?: string,
    ) {
        const role = req.user.role;
        let targetStudentId: string;
        if (['ADMIN', 'CAMPUS_ADMIN', 'TEACHER'].includes(role) && queryStudentId) {
            targetStudentId = queryStudentId;
        } else {
            targetStudentId = req.user.studentId || req.user.userId;
        }
        return this.quizService.getStudentSubmissions(targetStudentId, courseId);
    }

    /**
     * 查看一次答题的详细内容（题目、作答、得分、正误）
     * @param submissionId 答题记录 ID
     */
    // 查看单次答题详情
    @Get('submissions/:submissionId')
    async getSubmissionDetail(@Request() req: any, @Param('submissionId') submissionId: string) {
        const studentId = req.user.studentId || req.user.userId;
        return this.quizService.getSubmissionDetail(submissionId, studentId);
    }
}
