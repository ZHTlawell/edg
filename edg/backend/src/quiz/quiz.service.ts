/**
 * 测验服务
 * 职责：试卷 CRUD、学员答卷评分、成绩记录与查询
 * 所属模块：学习评估
 * 被 QuizController 依赖注入
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 答案集合比较：不考虑顺序，且去重后比较
 * 避免答案如 ["A","A"] 与 ["A","B"] 误判
 */
function isAnswerCorrect(correct: string[], student: string[]): boolean {
    if (!Array.isArray(correct) || !Array.isArray(student)) return false;
    const correctSet = new Set(correct);
    const studentSet = new Set(student);
    if (correctSet.size !== studentSet.size) return false;
    for (const a of correctSet) {
        if (!studentSet.has(a)) return false;
    }
    return true;
}

/**
 * 测验业务服务
 * 覆盖教师出卷 / 学员答题 / 自动判分 / 成绩查询全流程
 */
@Injectable()
export class QuizService {
    constructor(private prisma: PrismaService) { }

    /**
     * 创建试卷（含题目）
     * 支持限时 timeLimit、合格分 passScore
     * @param data 试卷与题目数据
     */
    // ─── 创建试卷 ──────────────────────────────────────────────────
    async createPaper(data: {
        title: string;
        chapterId: string;
        standardId: string;
        timeLimit?: number;
        passScore?: number;
        creatorId: string;
        questions: { type: string; text: string; options: any[]; answer: string[]; score?: number }[];
    }) {
        const chapter = await this.prisma.stdCourseChapter.findUnique({ where: { id: data.chapterId } });
        if (!chapter) throw new NotFoundException('章节不存在');

        return this.prisma.$transaction(async (prisma) => {
            const paper = await prisma.quizPaper.create({
                data: {
                    title: data.title,
                    chapter_id: data.chapterId,
                    standard_id: data.standardId,
                    time_limit: data.timeLimit || 1200,
                    pass_score: data.passScore || 60,
                    status: 'PUBLISHED',
                    creator_id: data.creatorId,
                },
            });

            const questions = data.questions.map((q, i) => ({
                paper_id: paper.id,
                type: q.type,
                text: q.text,
                options: JSON.stringify(q.options),
                answer: JSON.stringify(q.answer),
                score: q.score || 10,
                sort_order: i,
            }));

            await prisma.quizQuestion.createMany({ data: questions });

            return paper;
        });
    }

    // ─── 删除试卷及其题目 ──────────────────────────────────────────
    /**
     * 删除试卷（同时级联清理题目与答题记录）
     * @param paperId 试卷 ID
     */
    async deletePaper(paperId: string) {
        const paper = await this.prisma.quizPaper.findUnique({ where: { id: paperId } });
        if (!paper) throw new NotFoundException('试卷不存在');
        return this.prisma.$transaction(async (prisma) => {
            await prisma.quizQuestion.deleteMany({ where: { paper_id: paperId } });
            await prisma.quizSubmission.deleteMany({ where: { paper_id: paperId } });
            await prisma.quizPaper.delete({ where: { id: paperId } });
            return { success: true };
        });
    }

    // ─── 获取试卷（学员答题用，不返回答案） ──────────────────────────
    /**
     * 获取试卷内容（学员答题用：不含正确答案、不含解析）
     * @param paperId 试卷 ID
     */
    async getPaper(paperId: string) {
        const paper = await this.prisma.quizPaper.findUnique({
            where: { id: paperId },
            include: {
                questions: { orderBy: { sort_order: 'asc' } },
                chapter: true,
            },
        });
        if (!paper) throw new NotFoundException('试卷不存在');

        return {
            ...paper,
            questions: paper.questions.map(q => ({
                id: q.id,
                type: q.type,
                text: q.text,
                options: JSON.parse(q.options),
                score: q.score,
                sort_order: q.sort_order,
                // 不返回 answer
            })),
        };
    }

    // ─── 获取章节的试卷列表 ──────────────────────────────────────────
    /**
     * 查询某章节下的所有试卷（列表，不含题目详情）
     * @param chapterId 章节 ID
     */
    async getPapersByChapter(chapterId: string) {
        return this.prisma.quizPaper.findMany({
            where: { chapter_id: chapterId, status: 'PUBLISHED' },
            include: { _count: { select: { questions: true, submissions: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── 提交答卷并自动评分 ──────────────────────────────────────────
    /**
     * 学员提交答卷 — 自动判分
     * 按题目正确答案逐题比较，汇总得分并记录答题详情
     * @param data 答题数据（paperId、studentId、answers[]）
     */
    async submitQuiz(data: {
        paperId: string;
        studentId: string;
        courseId: string;
        answers: Record<string, string[]>;
        timeSpent: number;
    }) {
        const paper = await this.prisma.quizPaper.findUnique({
            where: { id: data.paperId },
            include: { questions: true },
        });
        if (!paper) throw new NotFoundException('试卷不存在');

        // 自动评分
        let score = 0;
        let totalScore = 0;

        for (const question of paper.questions) {
            const correctAnswer = JSON.parse(question.answer) as string[];
            const studentAnswer = data.answers[question.id] || [];
            totalScore += question.score;

            // 集合比较（不考虑顺序且去重）
            if (isAnswerCorrect(correctAnswer, studentAnswer)) {
                score += question.score;
            }
        }

        const passed = score >= paper.pass_score;

        const submission = await this.prisma.quizSubmission.create({
            data: {
                paper_id: data.paperId,
                student_id: data.studentId,
                course_id: data.courseId,
                answers: JSON.stringify(data.answers),
                score,
                total_score: totalScore,
                passed,
                time_spent: data.timeSpent,
            },
        });

        return {
            submissionId: submission.id,
            score,
            totalScore,
            passed,
            passScore: paper.pass_score,
        };
    }

    // ─── 查看学员的测验记录 ──────────────────────────────────────────
    /**
     * 查询某学员在某课程下的答题记录列表
     * @param studentId 学员 ID
     * @param courseId 课程 ID
     */
    async getStudentSubmissions(studentId: string, courseId: string) {
        return this.prisma.quizSubmission.findMany({
            where: { student_id: studentId, course_id: courseId },
            include: {
                paper: { select: { title: true, pass_score: true, chapter: { select: { title: true } } } },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }

    // ─── 查看单次答题详情（含正确答案对比） ─────────────────────────
    /**
     * 查询单次答题详情（题目 + 学员答案 + 正确答案 + 得分）
     * 仅允许学员看自己的记录
     * @param submissionId 答题记录 ID
     * @param studentId 当前学员 ID（权限校验）
     */
    async getSubmissionDetail(submissionId: string, studentId: string) {
        const sub = await this.prisma.quizSubmission.findUnique({
            where: { id: submissionId },
            include: {
                paper: { include: { questions: { orderBy: { sort_order: 'asc' } } } },
            },
        });
        if (!sub) throw new NotFoundException('答题记录不存在');
        if (sub.student_id !== studentId) throw new ForbiddenException('无权查看');

        const studentAnswers = JSON.parse(sub.answers);

        return {
            ...sub,
            paper: {
                ...sub.paper,
                questions: sub.paper.questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    text: q.text,
                    options: JSON.parse(q.options),
                    correctAnswer: JSON.parse(q.answer),
                    studentAnswer: studentAnswers[q.id] || [],
                    score: q.score,
                    isCorrect: isAnswerCorrect(JSON.parse(q.answer), studentAnswers[q.id] || []),
                })),
            },
        };
    }
}
