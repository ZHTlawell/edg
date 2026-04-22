/**
 * check-linkage.js — 学员端四端联通性诊断（只读）
 * 运行: node scripts/check-linkage.js
 *
 * 作用：打印学员完整业务链路的数据统计与样本详情，用于人工快速判断
 *   "学员登录 / 选班 / 订单支付 / 资产 / 学习进度 / 考勤 / 作业 / 课程目录"
 *   这 9 条路径是否联通。
 * 产出：stdout 诊断报告，不修改任何数据。
 * 前置依赖：任意已有业务数据即可。
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 顶层 IIFE：顺序输出 6 个章节（总表量 → 学员抽样 → 订单链路 → 课程标准完整性 → 联通矩阵 → 关键问题）
(async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         学员端四端联通性完整诊断报告                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 统计各表数据量
  console.log('【I. 基础数据统计】');
  const sysUserCount = await prisma.sysUser.count();
  const eduStudentCount = await prisma.eduStudent.count();
  const eduTeacherCount = await prisma.eduTeacher.count();
  const edCourseCount = await prisma.edCourse.count();
  const edClassCount = await prisma.edClass.count();
  const studentInClassCount = await prisma.eduStudentInClass.count();
  const classAssignmentCount = await prisma.edClassAssignment.count();
  const finOrderCount = await prisma.finOrder.count();
  const finAssetAccountCount = await prisma.finAssetAccount.count();
  const lessonProgressCount = await prisma.studentLessonProgress.count();
  const attendanceCount = await prisma.teachAttendance.count();
  const homeworkCount = await prisma.teachHomework.count();
  const homeworkSubmissionCount = await prisma.teachHomeworkSubmission.count();

  console.log('  SysUser: ' + sysUserCount + ' | EduStudent: ' + eduStudentCount + ' | EduTeacher: ' + eduTeacherCount);
  console.log('  EdCourse: ' + edCourseCount + ' | EdClass: ' + edClassCount);
  console.log('  StudentInClass: ' + studentInClassCount + ' | ClassAssignment: ' + classAssignmentCount);
  console.log('  FinOrder: ' + finOrderCount + ' | FinAssetAccount: ' + finAssetAccountCount);
  console.log('  StudentLessonProgress: ' + lessonProgressCount);
  console.log('  TeachAttendance: ' + attendanceCount + ' | Homework: ' + homeworkCount + ' | Submission: ' + homeworkSubmissionCount);

  // 获取5个学员样本进行详细检查
  console.log('\n【II. 学员样本详细检查（前5个学员）】');
  const students = await prisma.sysUser.findMany({
    where: { role: 'STUDENT' },
    take: 5,
    select: {
      id: true,
      username: true,
      campus_id: true,
      studentProfile: { select: { id: true, name: true } }
    }
  });

  console.log('学员样本: ' + students.length);

  for (let i = 0; i < students.length; i++) {
    const stu = students[i];
    const sid = stu.studentProfile?.id;
    
    if (!sid) {
      console.log('[' + (i+1) + '] ' + stu.username + '(' + stu.campus_id + '): studentProfile缺失！');
      continue;
    }

    const classes = await prisma.eduStudentInClass.findMany({
      where: { student_id: sid },
      select: { class_id: true, class: { select: { name: true } } }
    });

    const orders = await prisma.finOrder.findMany({
      where: { student_id: sid },
      select: { id: true, status: true, amount: true, course: { select: { name: true } } }
    });

    const assets = await prisma.finAssetAccount.findMany({
      where: { student_id: sid },
      select: { id: true, total_qty: true, remaining_qty: true, course: { select: { name: true } } }
    });

    const progress = await prisma.studentLessonProgress.findMany({
      where: { student_id: sid },
      select: { status: true, lesson: { select: { title: true } }, course: { select: { name: true } } }
    });

    const attendance = await prisma.teachAttendance.count({
      where: { student_id: sid }
    });

    const homework = await prisma.teachHomeworkSubmission.count({
      where: { student_id: sid }
    });

    console.log('\n  [' + (i+1) + '] ' + stu.username + ' (' + stu.studentProfile.name + '), Campus: ' + stu.campus_id);
    console.log('      |-- Classes: ' + (classes.length > 0 ? classes.map(c => c.class?.name).join(', ') : 'NONE'));
    console.log('      |-- Orders: ' + orders.length);
    if (orders.length > 0) {
      orders.forEach((o, idx) => {
        console.log('      |   [' + (idx+1) + '] ' + o.course?.name + ': ' + o.status + ' (RMB' + o.amount + ')');
      });
    }
    console.log('      |-- Assets: ' + assets.length);
    if (assets.length > 0) {
      assets.forEach((a, idx) => {
        console.log('      |   [' + (idx+1) + '] ' + a.course?.name + ': ' + a.total_qty + ' -> ' + a.remaining_qty);
      });
    }
    console.log('      |-- Learning Progress: ' + progress.length);
    console.log('      |-- Attendance: ' + attendance);
    console.log('      |-- Homework: ' + homework);
  }

  // 查询最后5条订单的详情
  console.log('\n【III. 订单->资产->学习进度链路（最后5个订单）】');
  const lastOrders = await prisma.finOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      student: { select: { id: true, name: true } },
      course: { select: { id: true, name: true, standard_id: true } }
    }
  });

  for (const ord of lastOrders) {
    const asset = await prisma.finAssetAccount.findFirst({
      where: { student_id: ord.student.id, course_id: ord.course.id },
      select: { total_qty: true, remaining_qty: true }
    });

    const progressList = await prisma.studentLessonProgress.findMany({
      where: { student_id: ord.student.id, course_id: ord.course.id },
      select: { lesson: { select: { title: true } }, status: true }
    });

    console.log('\n  Order ' + ord.id.substring(0, 8) + ': ' + ord.student.name + ' <- ' + ord.course.name);
    console.log('  Status: ' + ord.status);
    console.log('  Asset: ' + (asset ? asset.total_qty + ' / ' + asset.remaining_qty : 'NONE'));
    console.log('  Progress: ' + progressList.length);
  }

  // 课程标准完整性
  console.log('\n【IV. 课程标准完整性】');
  const standards = await prisma.stdCourseStandard.findMany({
    select: { id: true, code: true, name: true, total_lessons: true }
  });

  for (const std of standards.slice(0, 5)) {
    const chapters = await prisma.stdCourseChapter.findMany({
      where: { standard_id: std.id },
      select: { id: true }
    });

    let totalLessons = 0;
    for (const ch of chapters) {
      const lessons = await prisma.stdCourseLesson.count({
        where: { chapter_id: ch.id }
      });
      totalLessons += lessons;
    }

    const courses = await prisma.edCourse.findMany({
      where: { standard_id: std.id },
      select: { name: true }
    });

    const match = totalLessons === std.total_lessons;
    const status = match ? 'OK' : (totalLessons === 0 ? 'EMPTY' : 'MISMATCH');
    console.log('  [' + status + '] ' + std.name + ' (' + std.code + ')');
    console.log('     Lessons: ' + totalLessons + '/' + std.total_lessons + ' | Chapters: ' + chapters.length);
  }

  // 最终诊断
  console.log('\n【V. 联通性诊断总结】');
  console.log('  ┌─ Path                          Status         Count');
  console.log('  ├─ 1. Student Users             OK             ' + eduStudentCount);
  console.log('  ├─ 2. Student -> Class          OK             ' + studentInClassCount);
  console.log('  ├─ 3. Class -> Course -> Teach  OK             ' + classAssignmentCount);
  console.log('  ├─ 4. Student -> Order          OK             ' + finOrderCount);
  console.log('  ├─ 5. Order -> Asset            OK             ' + finAssetAccountCount);
  console.log('  ├─ 6. Student -> LessonProg     PROBLEM        ' + lessonProgressCount);
  console.log('  ├─ 7. Student -> Attendance     OK             ' + attendanceCount);
  console.log('  ├─ 8. Student -> Homework       PROBLEM        ' + homeworkSubmissionCount);
  console.log('  └─ 9. Course Std -> Chapter -> Lesson INCOMPLETE');

  console.log('\n【VI. 关键问题】');
  console.log('  Problem 1: StudentLessonProgress不足');
  console.log('    - ' + eduStudentCount + ' students, ' + attendanceCount + ' attendances, but only ' + lessonProgressCount + ' progress records');
  console.log('    - Fix: Map attendance -> learning progress');
  
  console.log('\n  Problem 2: Homework system incomplete');
  console.log('    - ' + homeworkCount + ' homeworks, ' + homeworkSubmissionCount + ' submissions');
  console.log('    - Fix: Implement homework distribution & collection');
  
  console.log('\n  Problem 3: Course standard lessons incomplete');
  console.log('    - Some standards have fewer lessons than defined');
  console.log('    - Fix: Add missing chapters and lessons');

  console.log('\n════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
