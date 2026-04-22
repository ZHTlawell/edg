/**
 * 全链路演示数据清洗 + 补全
 * 6 个阶段：清脏 → 补章节 → 补进度 → 今日排课 → 测验/请假/作业 → 验证
 *
 * 使用：npx ts-node scripts/clean-and-seed-demo.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DIRTY_CAMPUSES = ['C001'];
const TEST_PREFIX = '__TEST__';
const CLASSROOMS_PD = ['A301教室', 'A302教室', 'B101教室'];
const CLASSROOMS_XH = ['C201教室', 'C202教室'];

// ─── Phase 1: 清除脏数据 ──────────────────────────────────────────
// 删除 campus_id 属于 DIRTY_CAMPUSES 或以 __TEST__ 开头的班级，及其级联（考勤/课次/分配/入班关系）；
// 同时清理 name 以 __TEST__ 开头的课程及其资产/订单关联。
async function phase1_cleanDirtyData() {
    console.log('\n══════ Phase 1: 清除脏数据 ══════');

    // 找脏班级
    const dirtyClasses = await prisma.edClass.findMany({
        where: { OR: [
            { campus_id: { in: DIRTY_CAMPUSES } },
            { campus_id: { startsWith: TEST_PREFIX } },
        ] },
        select: { id: true, name: true, campus_id: true }
    });
    const dirtyClassIds = dirtyClasses.map(c => c.id);
    console.log(`  脏班级: ${dirtyClasses.length} 个 (${dirtyClasses.map(c => c.name).join(', ')})`);

    if (dirtyClassIds.length > 0) {
        // 找关联的 assignment
        const dirtyAssignments = await prisma.edClassAssignment.findMany({
            where: { class_id: { in: dirtyClassIds } },
            select: { id: true }
        });
        const dirtyAssignmentIds = dirtyAssignments.map(a => a.id);

        // 级联删除
        if (dirtyAssignmentIds.length > 0) {
            const delAtt = await prisma.teachAttendance.deleteMany({ where: { lesson_id: { in: (await prisma.edLessonSchedule.findMany({ where: { assignment_id: { in: dirtyAssignmentIds } }, select: { id: true } })).map(s => s.id) } } });
            console.log(`  删除考勤: ${delAtt.count}`);
            const delSched = await prisma.edLessonSchedule.deleteMany({ where: { assignment_id: { in: dirtyAssignmentIds } } });
            console.log(`  删除课次: ${delSched.count}`);
            const delAssign = await prisma.edClassAssignment.deleteMany({ where: { id: { in: dirtyAssignmentIds } } });
            console.log(`  删除排课: ${delAssign.count}`);
        }
        const delEnroll = await prisma.eduStudentInClass.deleteMany({ where: { class_id: { in: dirtyClassIds } } });
        console.log(`  删除学员班级关系: ${delEnroll.count}`);
        const delClass = await prisma.edClass.deleteMany({ where: { id: { in: dirtyClassIds } } });
        console.log(`  删除班级: ${delClass.count}`);
    }

    // 清测试课程
    const testCourses = await prisma.edCourse.findMany({ where: { name: { startsWith: TEST_PREFIX } }, select: { id: true, name: true } });
    for (const tc of testCourses) {
        await prisma.finAssetLedger.deleteMany({ where: { account: { course_id: tc.id } } });
        await prisma.finAssetAccount.deleteMany({ where: { course_id: tc.id } });
        await prisma.finOrder.deleteMany({ where: { course_id: tc.id } });
        await prisma.edCourse.delete({ where: { id: tc.id } }).catch(() => {});
        console.log(`  删除测试课程: ${tc.name}`);
    }

    // 验证
    const remaining = await prisma.edClass.findMany({ select: { campus_id: true }, distinct: ['campus_id'] });
    console.log(`  ✓ 剩余校区: ${remaining.map(r => r.campus_id).join(', ')}`);
}

// ─── Phase 2: 补全章节+课时 ──────────────────────────────────────
// 对所有已发布/启用的 StdCourseStandard：
//   - 若无任何章节，自动创建"基础入门 / 核心技能 / 综合实践"三章并均分课时
//   - 若已有章节但课时数不足 total_lessons，则在最后一个章节下补齐
async function phase2_completeChaptersLessons() {
    console.log('\n══════ Phase 2: 补全章节+课时 ══════');

    const standards = await prisma.stdCourseStandard.findMany({
        where: { status: { in: ['PUBLISHED', 'ENABLED'] } },
        include: { chapters: { include: { lessons: true }, orderBy: { sort_order: 'asc' } } }
    });

    const defaultChapterNames = ['基础入门', '核心技能', '综合实践'];

    for (const std of standards) {
        const currentLessonCount = std.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
        const needed = std.total_lessons - currentLessonCount;

        if (needed <= 0) {
            console.log(`  ${std.name}: ${currentLessonCount}/${std.total_lessons} 课时 ✓`);
            continue;
        }

        // 如果没有章节，创建 3 个
        if (std.chapters.length === 0) {
            const perChapter = Math.ceil(std.total_lessons / 3);
            let lessonNo = 0;
            for (let i = 0; i < 3; i++) {
                const ch = await prisma.stdCourseChapter.create({
                    data: { standard_id: std.id, title: `${defaultChapterNames[i]}`, sort_order: i }
                });
                const count = Math.min(perChapter, std.total_lessons - lessonNo);
                for (let j = 0; j < count; j++) {
                    lessonNo++;
                    await prisma.stdCourseLesson.create({
                        data: { chapter_id: ch.id, title: `第${lessonNo}课 · ${std.name}`, sort_order: j, duration: std.lesson_duration }
                    });
                }
            }
            console.log(`  ${std.name}: 创建 3 章节 + ${std.total_lessons} 课时`);
        } else {
            // 在最后一个章节下补齐
            const lastChapter = std.chapters[std.chapters.length - 1];
            const startSort = lastChapter.lessons.length;
            for (let j = 0; j < needed; j++) {
                await prisma.stdCourseLesson.create({
                    data: {
                        chapter_id: lastChapter.id,
                        title: `第${currentLessonCount + j + 1}课 · ${std.name}实践`,
                        sort_order: startSort + j,
                        duration: std.lesson_duration
                    }
                });
            }
            console.log(`  ${std.name}: 补齐 ${needed} 课时 (${currentLessonCount}→${std.total_lessons})`);
        }
    }
}

// ─── Phase 3: 补全学习进度 ──────────────────────────────────────
// 把 PRESENT/LATE 的考勤记录映射为 StudentLessonProgress（COMPLETED 状态），
// 按"同一学员同一课程"的出勤顺序依次匹配到标准课时表第 1、2、3... 节。
async function phase3_fillLearningProgress() {
    console.log('\n══════ Phase 3: 补全学习进度 ══════');

    // 获取所有出勤考勤，按学员+课程分组
    const attendances = await prisma.teachAttendance.findMany({
        where: { status: { in: ['PRESENT', 'LATE'] } },
        include: { lesson: { include: { assignment: true } } },
        orderBy: { id: 'asc' }
    });

    // 按 student_id + course_id 分组计数
    const studentCourseCount: Record<string, number> = {};
    const progressToCreate: { student_id: string; course_id: string; lessonIndex: number; createdAt: Date }[] = [];

    for (const att of attendances) {
        const courseId = att.lesson?.course_id || att.lesson?.assignment?.course_id;
        if (!courseId) continue;
        const key = `${att.student_id}:${courseId}`;
        studentCourseCount[key] = (studentCourseCount[key] || 0) + 1;
        progressToCreate.push({ student_id: att.student_id, course_id: courseId, lessonIndex: studentCourseCount[key], createdAt: new Date() });
    }

    // 获取每个课程对应标准的课时列表
    const courses = await prisma.edCourse.findMany({
        include: { standard: { include: { chapters: { include: { lessons: { orderBy: { sort_order: 'asc' } } }, orderBy: { sort_order: 'asc' } } } } }
    });
    const courseLessonsMap: Record<string, string[]> = {};
    for (const c of courses) {
        const lessons = c.standard?.chapters?.flatMap(ch => ch.lessons.map(l => l.id)) || [];
        courseLessonsMap[c.id] = lessons;
    }

    let created = 0;
    for (const p of progressToCreate) {
        const lessons = courseLessonsMap[p.course_id];
        if (!lessons || p.lessonIndex > lessons.length) continue;
        const lessonId = lessons[p.lessonIndex - 1];
        if (!lessonId) continue;

        try {
            await (prisma.studentLessonProgress as any).upsert({
                where: { student_id_lesson_id_course_id: { student_id: p.student_id, course_id: p.course_id, lesson_id: lessonId } },
                create: { student_id: p.student_id, course_id: p.course_id, lesson_id: lessonId, status: 'COMPLETED', completed_at: p.createdAt },
                update: {}
            });
            created++;
        } catch { /* duplicate or constraint */ }
    }
    console.log(`  ✓ 创建/更新学习进度: ${created} 条`);
}

// ─── Phase 4: 今日排课 + 教室 ──────────────────────────────────
// 保证今日至少有 4 节课用于演示：若不足则为每个 ACTIVE 的 assignment 追加今日课次（10:00 / 14:00 轮换）；
// 所有 classroom 为空的课次会被分配到对应校区的教室池（CLASSROOMS_PD / CLASSROOMS_XH）。
async function phase4_todaySchedulesAndClassrooms() {
    console.log('\n══════ Phase 4: 今日排课 + 教室 ══════');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayCount = await prisma.edLessonSchedule.count({
        where: { start_time: { gte: today, lt: tomorrow } }
    });

    if (todayCount < 4) {
        // 为每个 assignment 创建今日课次
        const assignments = await prisma.edClassAssignment.findMany({
            include: { class: true },
            where: { status: 'ACTIVE' }
        });

        const times = [
            { h: 10, m: 0, dur: 90 },
            { h: 14, m: 0, dur: 90 },
        ];
        let added = 0;

        for (const a of assignments) {
            // 检查该 assignment 今天是否已有课
            const existing = await prisma.edLessonSchedule.count({
                where: { assignment_id: a.id, start_time: { gte: today, lt: tomorrow } }
            });
            if (existing > 0) continue;

            const t = times[added % times.length];
            const start = new Date(today);
            start.setHours(t.h, t.m, 0, 0);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + t.dur);

            const isPD = a.class.campus_id === 'CAMPUS_PUDONG';
            const rooms = isPD ? CLASSROOMS_PD : CLASSROOMS_XH;

            // 获取该 assignment 的最大 lesson_no
            const maxLesson = await prisma.edLessonSchedule.findFirst({
                where: { assignment_id: a.id },
                orderBy: { lesson_no: 'desc' },
                select: { lesson_no: true }
            });
            const nextLessonNo = (maxLesson?.lesson_no || 0) + 1;

            await prisma.edLessonSchedule.create({
                data: {
                    assignment_id: a.id,
                    course_id: a.course_id,
                    start_time: start,
                    end_time: end,
                    classroom: rooms[added % rooms.length],
                    status: 'SCHEDULED',
                    is_consumed: false,
                    lesson_no: nextLessonNo,
                }
            });
            added++;
        }
        console.log(`  创建今日课次: ${added} 节`);
    } else {
        console.log(`  今日已有 ${todayCount} 节课次`);
    }

    // 批量更新无教室的课次
    const noRoom = await prisma.edLessonSchedule.findMany({
        where: { OR: [{ classroom: null }, { classroom: '' }] },
        include: { assignment: { include: { class: true } } }
    });
    let roomUpdated = 0;
    for (let i = 0; i < noRoom.length; i++) {
        const s = noRoom[i];
        const isPD = s.assignment?.class?.campus_id === 'CAMPUS_PUDONG';
        const rooms = isPD ? CLASSROOMS_PD : CLASSROOMS_XH;
        await prisma.edLessonSchedule.update({
            where: { id: s.id },
            data: { classroom: rooms[i % rooms.length] }
        });
        roomUpdated++;
    }
    console.log(`  分配教室: ${roomUpdated} 节`);
}

// ─── Phase 5: 测验 + 请假 + 作业 ──────────────────────────────
// 5a 为每个尚无测验的章节创建一张 QuizPaper + 3 道题（单选/单选/多选模板）
// 5b 为前 5 个学员各生成一条 QuizSubmission（模拟分数 60~94）
// 5c 为最近 3 节未来课次创建 LeaveRequest（前 2 条 PENDING，第 3 条 APPROVED）
// 5d 为所有 TeachHomework 补齐最多 5 条 SUBMITTED 的 TeachHomeworkSubmission
async function phase5_quizLeaveHomework() {
    console.log('\n══════ Phase 5: 测验 + 请假 + 作业提交 ══════');

    // 5a. 为无测验的章节创建试卷
    const chapters = await prisma.stdCourseChapter.findMany({
        where: { standard: { status: { in: ['PUBLISHED', 'ENABLED'] } } },
        include: { quizPapers: true, standard: true }
    });

    const questionTemplates = [
        { type: 'single', text: '以下哪项是本章节的核心概念？', opts: ['概念A', '概念B', '概念C', '概念D'], answer: ['A'] },
        { type: 'single', text: '关于本章节知识点，以下说法正确的是？', opts: ['说法一', '说法二', '说法三', '说法四'], answer: ['B'] },
        { type: 'multiple', text: '以下哪些属于本章节的重要知识点？（多选）', opts: ['知识点1', '知识点2', '知识点3', '知识点4'], answer: ['A', 'B', 'C'] },
    ];

    let papersCreated = 0;
    for (const ch of chapters) {
        if (ch.quizPapers.length > 0) continue;

        const paper = await prisma.quizPaper.create({
            data: {
                title: `${ch.title} · 章节测验`,
                chapter_id: ch.id,
                standard_id: ch.standard_id,
                time_limit: 900,
                pass_score: 60,
                status: 'PUBLISHED',
                creator_id: 'SYSTEM_SEED',
            }
        });

        for (let i = 0; i < questionTemplates.length; i++) {
            const tmpl = questionTemplates[i];
            await prisma.quizQuestion.create({
                data: {
                    paper_id: paper.id,
                    type: tmpl.type,
                    text: tmpl.text.replace('本章节', ch.title),
                    options: JSON.stringify(tmpl.opts.map((t, j) => ({ id: String.fromCharCode(65 + j), label: String.fromCharCode(65 + j), text: `${ch.title} - ${t}` }))),
                    answer: JSON.stringify(tmpl.answer),
                    score: tmpl.type === 'multiple' ? 15 : 10,
                    sort_order: i,
                }
            });
        }
        papersCreated++;
    }
    console.log(`  创建试卷: ${papersCreated} 套`);

    // 5b. 模拟测验提交
    const students = await prisma.eduStudent.findMany({ take: 5 });
    const papers = await (prisma.quizPaper as any).findMany({
        where: { status: 'PUBLISHED' },
        include: { questions: true, chapter: { include: { standard: { include: { courses: { take: 1 } } } } } },
        take: 5
    });

    let submissionsCreated = 0;
    for (let i = 0; i < Math.min(students.length, papers.length); i++) {
        const paper = papers[i] as any;
        const courseId = paper.chapter?.standard?.courses?.[0]?.id;
        if (!courseId) continue;

        const score = 60 + Math.floor(Math.random() * 35);
        const totalScore = paper.questions.reduce((s: number, q: any) => s + q.score, 0);

        await prisma.quizSubmission.create({
            data: {
                paper_id: paper.id,
                student_id: students[i].id,
                course_id: courseId,
                answers: JSON.stringify({}),
                score,
                total_score: totalScore,
                passed: score >= paper.pass_score,
                time_spent: 300 + Math.floor(Math.random() * 300),
            }
        });
        submissionsCreated++;
    }
    console.log(`  创建测验提交: ${submissionsCreated} 条`);

    // 5c. 创建请假申请
    const futureLessons = await prisma.edLessonSchedule.findMany({
        where: { start_time: { gt: new Date() }, is_consumed: false },
        include: { assignment: { include: { class: { include: { students: true } } } } },
        take: 10,
        orderBy: { start_time: 'asc' }
    });

    let leavesCreated = 0;
    const reasons = ['家中有事需要请假', '身体不适无法上课', '临时有其他安排'];
    for (let i = 0; i < Math.min(3, futureLessons.length); i++) {
        const lesson = futureLessons[i];
        const studentInClass = lesson.assignment?.class?.students?.[0];
        if (!studentInClass) continue;

        try {
            await prisma.leaveRequest.create({
                data: {
                    lesson_id: lesson.id,
                    student_id: studentInClass.student_id,
                    campus_id: lesson.assignment.class.campus_id,
                    reason: reasons[i],
                    status: i < 2 ? 'PENDING' : 'APPROVED',
                    ...(i >= 2 ? { approver_id: 'SYSTEM_SEED', reviewedAt: new Date() } : {}),
                }
            });
            leavesCreated++;
        } catch { /* duplicate */ }
    }
    console.log(`  创建请假申请: ${leavesCreated} 条 (${Math.min(2, leavesCreated)} PENDING)`);

    // 5d. 补充作业提交
    const homeworks = await prisma.teachHomework.findMany({
        include: { assignment: { include: { class: { include: { students: true } } } }, submissions: true }
    });
    let hwSubmitted = 0;
    for (const hw of homeworks) {
        const classStudents = hw.assignment?.class?.students || [];
        const existingStudentIds = new Set(hw.submissions.map(s => s.student_id));

        for (const enrollment of classStudents.slice(0, 5)) {
            if (existingStudentIds.has(enrollment.student_id)) continue;
            try {
                await prisma.teachHomeworkSubmission.create({
                    data: {
                        homework_id: hw.id,
                        student_id: enrollment.student_id,
                        content: `这是学员提交的${hw.title}作业内容。`,
                        status: 'SUBMITTED',
                    }
                });
                hwSubmitted++;
            } catch { /* duplicate */ }
        }
    }
    console.log(`  补充作业提交: ${hwSubmitted} 条`);
}

// ─── Phase 6: 验证 ──────────────────────────────────────────────
// 跑 9 条健康度断言（脏数据 / 学员覆盖率 / 进度 / 今日课次 / 测验 / 请假 / 教室 / 作业 / 测验提交）
// 输出 ✓ / ⚠ 标记，不修改数据
async function phase6_verify() {
    console.log('\n══════ Phase 6: 数据完整性验证 ══════');

    // 1. 脏数据
    const dirtyCount = await prisma.edClass.count({ where: { OR: [{ campus_id: { in: DIRTY_CAMPUSES } }, { campus_id: { startsWith: TEST_PREFIX } }] } });
    console.log(`  [1] 脏班级: ${dirtyCount === 0 ? '✓ 无' : `✗ ${dirtyCount} 个`}`);

    // 2. 学员-班级覆盖
    const totalStudents = await prisma.eduStudent.count();
    const enrolledStudents = await prisma.eduStudentInClass.findMany({ select: { student_id: true }, distinct: ['student_id'] });
    const coverage = (enrolledStudents.length / totalStudents * 100).toFixed(1);
    console.log(`  [2] 学员-班级覆盖率: ${coverage}% (${enrolledStudents.length}/${totalStudents}) ${Number(coverage) >= 95 ? '✓' : '⚠'}`);

    // 3. 学习进度
    const progressCount = await prisma.studentLessonProgress.count();
    console.log(`  [3] 学习进度: ${progressCount} 条 ${progressCount >= 100 ? '✓' : '⚠'}`);

    // 4. 今日排课
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const todayLessons = await prisma.edLessonSchedule.count({ where: { start_time: { gte: today, lt: tomorrow } } });
    console.log(`  [4] 今日排课: ${todayLessons} 节 ${todayLessons >= 4 ? '✓' : '⚠'}`);

    // 5. 测验
    const quizCount = await prisma.quizPaper.count({ where: { status: 'PUBLISHED' } });
    console.log(`  [5] 已发布测验: ${quizCount} 套 ${quizCount >= 5 ? '✓' : '⚠'}`);

    // 6. 请假
    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    console.log(`  [6] 待审批请假: ${pendingLeaves} 条 ${pendingLeaves >= 2 ? '✓' : '⚠'}`);

    // 7. 教室
    const noClassroom = await prisma.edLessonSchedule.count({ where: { OR: [{ classroom: null }, { classroom: '' }] } });
    console.log(`  [7] 无教室课次: ${noClassroom} ${noClassroom === 0 ? '✓' : '⚠'}`);

    // 8. 作业提交
    const hwSubs = await prisma.teachHomeworkSubmission.count();
    console.log(`  [8] 作业提交: ${hwSubs} 条 ${hwSubs >= 20 ? '✓' : '⚠'}`);

    // 9. 测验提交
    const quizSubs = await prisma.quizSubmission.count();
    console.log(`  [9] 测验提交: ${quizSubs} 条 ${quizSubs >= 3 ? '✓' : '⚠'}`);
}

// ─── Main ──────────────────────────────────────────────────────
// 顺序执行 6 个 phase；任一阶段抛错则整体退出码=1
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  全链路演示数据清洗 + 补全');
    console.log('═══════════════════════════════════════════════════');

    await phase1_cleanDirtyData();
    await phase2_completeChaptersLessons();
    await phase3_fillLearningProgress();
    await phase4_todaySchedulesAndClassrooms();
    await phase5_quizLeaveHomework();
    await phase6_verify();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ 全部完成！数据已写入 SQLite DB');
    console.log('═══════════════════════════════════════════════════\n');
}

main()
    .catch(e => { console.error('执行失败:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
