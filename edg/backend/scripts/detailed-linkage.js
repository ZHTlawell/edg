/**
 * detailed-linkage.js — 学员全链路 8 维深度分析（只读）
 * 运行: node scripts/detailed-linkage.js
 *
 * 作用：对 check-linkage.js 的升级版，增加 groupBy 统计与按状态分布的细粒度诊断。
 * 包含 8 个维度：学员登录 / 课程端 / 订单 / 资产 / 学习进度 / 考勤 / 作业 / 课程标准完整性
 * 产出：stdout 报告 + Connectivity Index 百分比矩阵 + Critical Issues 列表；不修改任何数据。
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 顶层 IIFE：按 8 个维度依次 count/groupBy，最后汇总连通率百分比与关键问题
(async () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║      学员端全链路数据完整性深度分析报告                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // ============ 1. 学员登录端 ============
  console.log('【1】学员登录端（SysUser + EduStudent）');
  console.log('─────────────────────────────────────────────────────────');
  const studentUsers = await prisma.sysUser.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, username: true, campus_id: true, status: true }
  });
  console.log('  Total Students: ' + studentUsers.length);
  
  const statusDist = {};
  studentUsers.forEach(u => {
    statusDist[u.status] = (statusDist[u.status] || 0) + 1;
  });
  console.log('  Status Distribution: ' + Object.entries(statusDist).map(([k,v]) => k + ':' + v).join(', '));

  // ============ 2. 课程查看链路 ============
  console.log('\n【2】课程查看链路（Student -> Class -> Course -> Teacher）');
  console.log('─────────────────────────────────────────────────────────');
  
  const classesData = await prisma.eduStudentInClass.groupBy({
    by: ['student_id'],
    _count: true
  });
  
  console.log('  Students with classes: ' + classesData.length + ' / ' + studentUsers.length);
  console.log('  Avg classes per student: ' + (classesData.reduce((a, b) => a + b._count, 0) / classesData.length).toFixed(2));
  
  // Check class->course assignments
  const classes = await prisma.edClass.findMany({
    select: { id: true, name: true }
  });
  
  let classesWithCourses = 0;
  for (const cls of classes) {
    const count = await prisma.edClassAssignment.count({
      where: { class_id: cls.id }
    });
    if (count > 0) classesWithCourses++;
  }
  console.log('  Classes with courses: ' + classesWithCourses + ' / ' + classes.length);

  // ============ 3. 订单链路 ============
  console.log('\n【3】订单链路（Student -> Order -> Payment Status）');
  console.log('─────────────────────────────────────────────────────────');
  
  const ordersByStatus = await prisma.finOrder.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('  Total Orders: ' + ordersByStatus.reduce((a, b) => a + b._count, 0));
  ordersByStatus.forEach(o => {
    console.log('    - ' + o.status + ': ' + o._count);
  });

  // Check payment records
  const ordersWithPayment = await prisma.finOrder.count({
    where: {
      payments: { some: {} }
    }
  });
  console.log('  Orders with payment records: ' + ordersWithPayment);

  // ============ 4. 资产链路 ============
  console.log('\n【4】课时资产链路（Order -> FinAssetAccount -> Consumption）');
  console.log('─────────────────────────────────────────────────────────');
  
  const totalAssetQty = await prisma.finAssetAccount.aggregate({
    _sum: { total_qty: true },
    _count: true
  });
  
  const totalRemainingQty = await prisma.finAssetAccount.aggregate({
    _sum: { remaining_qty: true }
  });

  const totalConsumed = totalAssetQty._sum.total_qty - totalRemainingQty._sum.remaining_qty;
  
  console.log('  Total Asset Accounts: ' + totalAssetQty._count);
  console.log('  Total Lessons Purchased: ' + totalAssetQty._sum.total_qty);
  console.log('  Total Lessons Remaining: ' + totalRemainingQty._sum.remaining_qty);
  console.log('  Total Lessons Consumed: ' + totalConsumed + ' (' + ((totalConsumed / totalAssetQty._sum.total_qty) * 100).toFixed(1) + '%)');

  // ============ 5. 学习进度链路 ============
  console.log('\n【5】学习进度链路（Student -> Course -> Lesson -> Progress）');
  console.log('─────────────────────────────────────────────────────────');
  
  const progressByStatus = await prisma.studentLessonProgress.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('  Total Progress Records: ' + progressByStatus.reduce((a, b) => a + b._count, 0));
  progressByStatus.forEach(p => {
    console.log('    - ' + p.status + ': ' + p._count);
  });
  
  const studentsWithProgress = await prisma.studentLessonProgress.findMany({
    distinct: ['student_id']
  });
  console.log('  Students with progress: ' + studentsWithProgress.length + ' / ' + studentUsers.length);
  console.log('  *** ISSUE: Only ' + ((studentsWithProgress.length / studentUsers.length) * 100).toFixed(1) + '% of students have learning progress records ***');

  // ============ 6. 考勤链路 ============
  console.log('\n【6】考勤链路（Student -> Attendance -> Lesson Schedule）');
  console.log('─────────────────────────────────────────────────────────');
  
  const attendanceByStatus = await prisma.teachAttendance.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('  Total Attendance Records: ' + attendanceByStatus.reduce((a, b) => a + b._count, 0));
  attendanceByStatus.forEach(a => {
    console.log('    - ' + a.status + ': ' + a._count);
  });

  const studentsWithAttendance = await prisma.teachAttendance.findMany({
    distinct: ['student_id']
  });
  console.log('  Students with attendance: ' + studentsWithAttendance.length + ' / ' + studentUsers.length);

  // Check deduct status
  const deductStatus = await prisma.teachAttendance.groupBy({
    by: ['deduct_status'],
    _count: true
  });
  console.log('  Deduction Status:');
  deductStatus.forEach(d => {
    console.log('    - ' + d.deduct_status + ': ' + d._count);
  });

  // ============ 7. 作业链路 ============
  console.log('\n【7】作业链路（Teacher -> Homework -> Student Submission）');
  console.log('─────────────────────────────────────────────────────────');
  
  const homeworkCount = await prisma.teachHomework.count();
  const submissionCount = await prisma.teachHomeworkSubmission.count();
  console.log('  Total Homeworks: ' + homeworkCount);
  console.log('  Total Submissions: ' + submissionCount);
  
  if (homeworkCount > 0) {
    const avgSubmissions = (submissionCount / homeworkCount).toFixed(2);
    console.log('  Avg Submissions per Homework: ' + avgSubmissions);
  }

  const submissionByStatus = await prisma.teachHomeworkSubmission.groupBy({
    by: ['status'],
    _count: true
  });
  if (submissionByStatus.length > 0) {
    console.log('  Submission Status:');
    submissionByStatus.forEach(s => {
      console.log('    - ' + s.status + ': ' + s._count);
    });
  }

  // ============ 8. 课程标准完整性 ============
  console.log('\n【8】课程标准完整性（Standard -> Chapter -> Lesson -> Resource）');
  console.log('─────────────────────────────────────────────────────────');
  
  const standards = await prisma.stdCourseStandard.findMany({
    select: { id: true, name: true, code: true, total_lessons: true }
  });

  console.log('  Total Standards: ' + standards.length);
  
  let totalMismatch = 0;
  for (const std of standards) {
    const chapters = await prisma.stdCourseChapter.findMany({
      where: { standard_id: std.id }
    });
    
    let actualLessons = 0;
    let totalResources = 0;
    for (const ch of chapters) {
      const lessons = await prisma.stdCourseLesson.findMany({
        where: { chapter_id: ch.id },
        select: { id: true }
      });
      actualLessons += lessons.length;
      
      for (const lesson of lessons) {
        const resources = await prisma.stdLessonResource.count({
          where: { lesson_id: lesson.id }
        });
        totalResources += resources;
      }
    }
    
    const mismatch = actualLessons !== std.total_lessons;
    if (mismatch) totalMismatch++;
    
    const status = mismatch ? 'MISMATCH' : 'OK';
    console.log('  [' + status + '] ' + std.name + ' (code: ' + std.code + ')');
    console.log('       Lessons: ' + actualLessons + ' / ' + std.total_lessons + ' | Chapters: ' + chapters.length + ' | Resources: ' + totalResources);
  }
  console.log('  *** Issue: ' + totalMismatch + ' standards have lesson count mismatches ***');

  // ============ 综合分析 ============
  console.log('\n【总结】学员全链路连通性指标');
  console.log('─────────────────────────────────────────────────────────');
  
  const totalStudents = studentUsers.length;
  const studentsCovered = {
    'with class': classesData.length,
    'with paid order': (await prisma.finOrder.count({ where: { status: 'PAID', student: { user: { role: 'STUDENT' } } } })),
    'with asset account': totalAssetQty._count,
    'with attendance': studentsWithAttendance.length,
    'with progress': studentsWithProgress.length,
    'with homework': (await prisma.teachHomeworkSubmission.findMany({ distinct: ['student_id'] })).length
  };

  console.log('\n  Connectivity Index (% of ' + totalStudents + ' students):');
  Object.entries(studentsCovered).forEach(([key, count]) => {
    const pct = (count / totalStudents * 100).toFixed(1);
    console.log('    ' + key.padEnd(20) + ': ' + pct.padStart(5) + '% (' + count + ')');
  });

  console.log('\n【Critical Issues】');
  const issues = [];
  if (studentsWithProgress.length < totalStudents * 0.5) {
    issues.push('1. Learning progress severely incomplete (' + studentsWithProgress.length + '/' + totalStudents + ')');
  }
  if (homeworkCount === 0 || submissionCount === 0) {
    issues.push('2. Homework system not operational');
  }
  if (totalMismatch > standards.length * 0.5) {
    issues.push('3. Course standards have incomplete lesson definitions');
  }

  if (issues.length === 0) {
    console.log('  All critical systems operational');
  } else {
    issues.forEach(issue => console.log('  - ' + issue));
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
