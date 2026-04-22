/**
 * 浦东校区 47 名学员端到端业务数据种子脚本
 * Task 1: 创建 47 名学员 (SysUser + EduStudent)
 * Task 2: 订单→支付→资产→分班→排课 完整链路
 * Task 3: 考勤数据（已过课的出勤记录 + 课消扣减）
 *
 * 运行方式: cd backend && npx ts-node prisma/seed-pudong-orders.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CAMPUS_ID = 'CAMPUS_PUDONG';
const CAMPUS_NAME = '浦东校区';
const CHANNELS = ['WECHAT', 'ALIPAY', 'BANK_TRANSFER'];

// ═══════════════════════════════════════
// 47 名学员数据（中文姓名 + 性别）
// ═══════════════════════════════════════
const NEW_STUDENTS: { name: string; gender: string }[] = [
  // 1-10
  { name: '方晓婷', gender: 'female' },
  { name: '徐嘉铭', gender: 'male' },
  { name: '孙雨涵', gender: 'female' },
  { name: '马天成', gender: 'male' },
  { name: '朱紫萱', gender: 'female' },
  { name: '胡明远', gender: 'male' },
  { name: '郭思琪', gender: 'female' },
  { name: '何宇轩', gender: 'male' },
  { name: '罗诗涵', gender: 'female' },
  { name: '梁俊豪', gender: 'male' },
  // 11-20
  { name: '宋雅琪', gender: 'female' },
  { name: '郑浩宇', gender: 'male' },
  { name: '谢欣怡', gender: 'female' },
  { name: '韩子涵', gender: 'male' },
  { name: '唐静雯', gender: 'female' },
  { name: '冯博文', gender: 'male' },
  { name: '董雨萱', gender: 'female' },
  { name: '袁志远', gender: 'male' },
  { name: '邓思颖', gender: 'female' },
  { name: '曹晨阳', gender: 'male' },
  // 21-30
  { name: '许婉婷', gender: 'female' },
  { name: '薛浩然', gender: 'male' },
  { name: '田心怡', gender: 'female' },
  { name: '彭子豪', gender: 'male' },
  { name: '叶佳琪', gender: 'female' },
  { name: '余俊杰', gender: 'male' },
  { name: '潘雅婷', gender: 'female' },
  { name: '蒋天翔', gender: 'male' },
  { name: '蔡思涵', gender: 'female' },
  { name: '魏子轩', gender: 'male' },
  // 31-40
  { name: '贾美琳', gender: 'female' },
  { name: '丁浩天', gender: 'male' },
  { name: '任雨晴', gender: 'female' },
  { name: '姜博远', gender: 'male' },
  { name: '钟诗瑶', gender: 'female' },
  { name: '沈子航', gender: 'male' },
  { name: '范晓晨', gender: 'female' },
  { name: '廖明哲', gender: 'male' },
  { name: '石雅萱', gender: 'female' },
  { name: '段志豪', gender: 'male' },
  // 41-47
  { name: '崔若曦', gender: 'female' },
  { name: '雷天佑', gender: 'male' },
  { name: '龚心悦', gender: 'female' },
  { name: '邱俊凯', gender: 'male' },
  { name: '侯雨彤', gender: 'female' },
  { name: '孟浩宇', gender: 'male' },
  { name: '秦思敏', gender: 'female' },
];

// ═══════════════════════════════════════
// 选课方案 (courseIndex: 0=UI/UX, 1=全栈, 2=Python)
// 20人选[0,2], 15人选[1,2], 7人选[0,1,2], 5人选[1]
// ═══════════════════════════════════════
function getEnrollmentPlan(index: number): number[] {
  if (index < 20) return [0, 2];       // 1-20: UI/UX + Python
  if (index < 35) return [1, 2];       // 21-35: 全栈 + Python
  if (index < 42) return [0, 1, 2];    // 36-42: 全选
  return [1];                           // 43-47: 仅全栈
}

// 生成过去 6 个月内的随机日期（时间随机落在 8:00~17:59 之间），用于模拟订单下单时刻
function randomDateInPast6Months(): Date {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const range = now.getTime() - sixMonthsAgo.getTime();
  const d = new Date(sixMonthsAgo.getTime() + Math.random() * range);
  d.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// ═══════════════════════════════════════
// TASK 1 + 2: 创建学员 + 订单全链路
// ═══════════════════════════════════════
// 幂等地为 47 名学员创建 SysUser+EduStudent，并按 enrollment plan 为每人购课：
// 订单 → 支付记录 → 订单置 PAID → 课时资产账户 → 资产流水(BUY) → 分班（复用或新建）→ 班级自动排课 → 入班
// 前置依赖：CAMPUS_PUDONG 校区下已存在对应课程（通过 edCourse.campus_id 过滤）
async function seedStudentsAndOrders() {
  console.log('═══════════════════════════════════════');
  console.log('  Task 1 + 2: 学员创建 + 订单全链路');
  console.log('═══════════════════════════════════════\n');

  // 1. 查找浦东校区的课程
  const courses = await prisma.edCourse.findMany({
    where: { campus_id: CAMPUS_ID },
    include: { instructor: true },
  });

  if (courses.length === 0) {
    console.error('❌ 未找到 CAMPUS_PUDONG 的课程');
    process.exit(1);
  }

  console.log(`📚 ${courses.length} 门浦东校区课程:`);
  courses.forEach(c => console.log(`   ${c.name} | ¥${c.price} | ${c.total_lessons}课时 | 教师: ${c.instructor?.name || '无'}`));

  // 2. 预生成密码 hash
  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. 加载现有班级信息（复用有余位的班级）
  type ClassInfo = { id: string; enrolled: number; capacity: number; assignmentId: string };
  const classMap = new Map<string, ClassInfo[]>(); // courseId -> classes

  for (const course of courses) {
    const existingClasses = await prisma.edClass.findMany({
      where: {
        campus_id: CAMPUS_ID,
        status: 'ONGOING',
        assignments: { some: { course_id: course.id } },
      },
      include: { assignments: { where: { course_id: course.id } } },
    });

    const classInfos: ClassInfo[] = existingClasses.map(c => ({
      id: c.id,
      enrolled: c.enrolled,
      capacity: c.capacity,
      assignmentId: c.assignments[0]?.id || '',
    }));
    classMap.set(course.id, classInfos);
    console.log(`   📋 ${course.name}: ${classInfos.length} 个现有班级 (总余位: ${classInfos.reduce((s, c) => s + (c.capacity - c.enrolled), 0)})`);
  }

  console.log();

  let totalCreated = 0;
  let totalOrders = 0;

  for (let i = 0; i < NEW_STUDENTS.length; i++) {
    const stu = NEW_STUDENTS[i];
    const idx = i + 1;
    const username = `pd_stu_${String(idx).padStart(3, '0')}`;
    const phone = `1381002${String(idx).padStart(4, '0')}`;
    const enrollPlan = getEnrollmentPlan(i);

    // 幂等：检查是否已存在
    let sysUser = await prisma.sysUser.findUnique({ where: { username } });
    let eduStudent: any;

    if (sysUser) {
      eduStudent = await prisma.eduStudent.findUnique({ where: { user_id: sysUser.id } });
      if (!eduStudent) {
        console.error(`❌ ${username} 的 SysUser 存在但无 EduStudent`);
        continue;
      }
    } else {
      sysUser = await prisma.sysUser.create({
        data: {
          username,
          password_hash: passwordHash,
          role: 'STUDENT',
          campus_id: CAMPUS_ID,
          campusName: CAMPUS_NAME,
          status: 'ACTIVE',
        },
      });

      eduStudent = await prisma.eduStudent.create({
        data: {
          name: stu.name,
          gender: stu.gender,
          phone,
          user_id: sysUser.id,
          status: 'ACTIVE',
        },
      });
      totalCreated++;
    }

    // 为每门课创建订单全链路
    for (const courseIdx of enrollPlan) {
      const course = courses[courseIdx % courses.length];

      // 幂等：检查订单
      const existing = await prisma.finOrder.findFirst({
        where: { student_id: eduStudent.id, course_id: course.id, status: { in: ['PENDING_PAYMENT', 'PAID'] } },
      });
      if (existing) continue;

      const orderDate = randomDateInPast6Months();
      const paymentDate = new Date(orderDate.getTime() + Math.floor(Math.random() * 1800000));
      const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];

      // A. 创建订单
      const order = await prisma.finOrder.create({
        data: {
          student_id: eduStudent.id,
          course_id: course.id,
          amount: course.price,
          total_qty: course.total_lessons,
          order_source: 'campus_admin',
          status: 'PENDING_PAYMENT',
          createdAt: orderDate,
        },
      });

      // B. 支付记录
      const payment = await prisma.finPaymentRecord.create({
        data: {
          order_id: order.id,
          amount: course.price,
          channel,
          status: 'SUCCESS',
          createdAt: paymentDate,
        },
      });

      // C. 更新订单状态
      await prisma.finOrder.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // D. 课时资产账户
      const account = await prisma.finAssetAccount.create({
        data: {
          student_id: eduStudent.id,
          course_id: course.id,
          campus_id: CAMPUS_ID,
          total_qty: course.total_lessons,
          remaining_qty: course.total_lessons,
          status: 'ACTIVE',
        },
      });

      // E. 资产流水
      await prisma.finAssetLedger.create({
        data: {
          account_id: account.id,
          type: 'BUY',
          change_qty: course.total_lessons,
          balance_snapshot: course.total_lessons,
          ref_id: payment.id,
          occurTime: paymentDate,
        },
      });

      // F. 分班：优先复用有余位的现有班级
      let courseClasses = classMap.get(course.id) || [];
      let targetClass = courseClasses.find(c => c.enrolled < c.capacity);

      if (!targetClass) {
        // 创建新班级
        const batchNum = courseClasses.length + 1;
        const monthStr = orderDate.toISOString().slice(0, 7);
        const newClass = await prisma.edClass.create({
          data: {
            name: `${course.name}-${monthStr}-${batchNum}班`,
            capacity: 30,
            enrolled: 0,
            campus_id: CAMPUS_ID,
            status: 'ONGOING',
          },
        });

        let assignmentId = '';
        if (course.instructor_id) {
          // G. 教师-课程-班级分配
          const assignment = await prisma.edClassAssignment.create({
            data: {
              class_id: newClass.id,
              course_id: course.id,
              teacher_id: course.instructor_id,
            },
          });
          assignmentId = assignment.id;

          // H. 自动排课：从创建日下周一开始，每周一节
          const startDate = new Date(orderDate);
          const dow = startDate.getDay();
          startDate.setDate(startDate.getDate() + (dow === 0 ? 1 : 8 - dow));
          startDate.setHours(10, 0, 0, 0);
          const dur = course.duration || 45;

          const schedules = [];
          for (let li = 0; li < Math.min(course.total_lessons, 48); li++) {
            const ls = new Date(startDate);
            ls.setDate(ls.getDate() + li * 7);
            const le = new Date(ls);
            le.setMinutes(le.getMinutes() + dur);
            schedules.push({
              assignment_id: assignment.id,
              lesson_no: li + 1,
              start_time: ls,
              end_time: le,
              status: 'PUBLISHED',
            });
          }
          if (schedules.length > 0) {
            await prisma.edLessonSchedule.createMany({ data: schedules });
          }
          console.log(`   🏫 新建班级: ${newClass.name} (${schedules.length} 节课表)`);
        }

        targetClass = { id: newClass.id, enrolled: 0, capacity: 30, assignmentId };
        courseClasses.push(targetClass);
        classMap.set(course.id, courseClasses);
      }

      // I. 学员入班
      const alreadyIn = await prisma.eduStudentInClass.findUnique({
        where: { student_id_class_id: { student_id: eduStudent.id, class_id: targetClass.id } },
      });
      if (!alreadyIn) {
        await prisma.eduStudentInClass.create({
          data: { student_id: eduStudent.id, class_id: targetClass.id, enrolledAt: paymentDate },
        });
        targetClass.enrolled++;
        await prisma.edClass.update({
          where: { id: targetClass.id },
          data: { enrolled: targetClass.enrolled },
        });
      }

      totalOrders++;
    }

    if (totalCreated > 0 && totalCreated % 10 === 0) {
      console.log(`   ... 已处理 ${totalCreated} / ${NEW_STUDENTS.length} 名学员`);
    }
  }

  console.log(`\n✅ Task 1+2 完成: 创建 ${totalCreated} 名学员, ${totalOrders} 笔订单`);
  return courses;
}

// ═══════════════════════════════════════
// TASK 3: 考勤数据 + 课消扣减
// ═══════════════════════════════════════
// 对所有浦东校区已过期的课次生成考勤（85% PRESENT / 8% LATE / 5% ABSENT / 2% LEAVE），
// 并批量更新学员的 FinAssetAccount 剩余课时，创建 CONSUME 类型的资产流水。
// 已有考勤的课次会被跳过（幂等）。
async function seedAttendance() {
  console.log('\n═══════════════════════════════════════');
  console.log('  Task 3: 考勤数据 + 课消扣减');
  console.log('═══════════════════════════════════════\n');

  const now = new Date();

  // 找到所有浦东校区班级的已过期课程
  const classes = await prisma.edClass.findMany({
    where: { campus_id: CAMPUS_ID, status: 'ONGOING' },
    include: {
      assignments: {
        include: {
          schedules: {
            where: { start_time: { lt: now } },
            orderBy: { lesson_no: 'asc' },
          },
        },
      },
      students: { include: { student: true } },
    },
  });

  let totalAttendance = 0;
  let totalConsumed = 0;

  for (const cls of classes) {
    const studentIds = cls.students.map(s => s.student_id);
    if (studentIds.length === 0) continue;

    for (const assignment of cls.assignments) {
      const pastLessons = assignment.schedules;
      if (pastLessons.length === 0) continue;

      for (const lesson of pastLessons) {
        // 检查是否已有考勤记录
        const existingCount = await prisma.teachAttendance.count({
          where: { lesson_id: lesson.id },
        });
        if (existingCount > 0) continue;

        // 为每个学员生成考勤
        const attendanceRecords = [];
        for (const studentId of studentIds) {
          const rand = Math.random();
          let status: string;
          let deductStatus: string;
          let deductAmount: number;

          if (rand < 0.85) {
            status = 'PRESENT'; deductStatus = 'DEDUCTED'; deductAmount = 1;
          } else if (rand < 0.93) {
            status = 'LATE'; deductStatus = 'DEDUCTED'; deductAmount = 1;
          } else if (rand < 0.98) {
            status = 'ABSENT'; deductStatus = 'DEDUCTED'; deductAmount = 1;
          } else {
            status = 'LEAVE'; deductStatus = 'NO_DEDUCTION'; deductAmount = 0;
          }

          attendanceRecords.push({
            lesson_id: lesson.id,
            student_id: studentId,
            status,
            deduct_status: deductStatus,
            deduct_amount: deductAmount,
          });
        }

        await prisma.teachAttendance.createMany({ data: attendanceRecords });
        totalAttendance += attendanceRecords.length;

        // 标记课程已消耗
        if (!lesson.is_consumed) {
          await prisma.edLessonSchedule.update({
            where: { id: lesson.id },
            data: { is_consumed: true, status: 'COMPLETED' },
          });
          totalConsumed++;
        }
      }

      // 课消扣减：批量更新每个学员的 FinAssetAccount
      const courseId = assignment.course_id;
      for (const studentId of studentIds) {
        const deductedCount = await prisma.teachAttendance.count({
          where: {
            student_id: studentId,
            lesson_id: { in: pastLessons.map(l => l.id) },
            deduct_status: 'DEDUCTED',
          },
        });

        if (deductedCount > 0) {
          const account = await prisma.finAssetAccount.findFirst({
            where: { student_id: studentId, course_id: courseId, status: 'ACTIVE' },
          });
          if (account && account.remaining_qty > 0) {
            const actualDeduct = Math.min(deductedCount, account.remaining_qty);
            const newRemaining = account.remaining_qty - actualDeduct;
            await prisma.finAssetAccount.update({
              where: { id: account.id },
              data: { remaining_qty: newRemaining },
            });

            // 创建课消流水
            await prisma.finAssetLedger.create({
              data: {
                account_id: account.id,
                type: 'CONSUME',
                change_qty: -actualDeduct,
                balance_snapshot: newRemaining,
                ref_id: `attendance-batch-${cls.id}`,
              },
            });
          }
        }
      }
    }
  }

  console.log(`✅ Task 3 完成: ${totalAttendance} 条考勤记录, ${totalConsumed} 节课标记为已完成`);
}

// ═══════════════════════════════════════
// 主流程 + 汇总
// ═══════════════════════════════════════
// 顺序执行 Task 1+2 → Task 3，末尾输出浦东校区学员/订单/班级/课表/考勤/营收统计
async function main() {
  console.log('🚀 浦东校区 47 名学员端到端数据种子\n');

  await seedStudentsAndOrders();
  await seedAttendance();

  // 最终统计
  console.log('\n═══════════════════════════════════════');
  console.log('  📊 浦东校区数据汇总');
  console.log('═══════════════════════════════════════');

  const students = await prisma.sysUser.count({ where: { campus_id: CAMPUS_ID, role: 'STUDENT' } });
  const orders = await prisma.finOrder.count({ where: { course: { campus_id: CAMPUS_ID }, status: 'PAID' } });
  const classes = await prisma.edClass.count({ where: { campus_id: CAMPUS_ID } });
  const lessons = await prisma.edLessonSchedule.count({
    where: { assignment: { class: { campus_id: CAMPUS_ID } } },
  });
  const attendance = await prisma.teachAttendance.count({
    where: { lesson: { assignment: { class: { campus_id: CAMPUS_ID } } } },
  });
  const revenue = await prisma.finOrder.aggregate({
    where: { course: { campus_id: CAMPUS_ID }, status: 'PAID' },
    _sum: { amount: true },
  });

  console.log(`   👨‍🎓 学员总数:    ${students}`);
  console.log(`   📝 已付订单:    ${orders}`);
  console.log(`   🏫 班级数:      ${classes}`);
  console.log(`   📅 课表总数:    ${lessons}`);
  console.log(`   ✅ 考勤记录:    ${attendance}`);
  console.log(`   💰 总营收:      ¥${(revenue._sum.amount || 0).toLocaleString()}`);
  console.log();
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
