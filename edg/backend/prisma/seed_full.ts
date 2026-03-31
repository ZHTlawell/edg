/**
 * seed_full.ts — EduAdmin 全量演示数据
 * 运行: npx ts-node prisma/seed_full.ts
 *
 * 覆盖模块:
 *  - 用户 (总部管理员 / 两个校区管理员 / 4位教师 / 15位学生)
 *  - 课程 (6门课, 跨学科)
 *  - 班级 (6个班级, 含学生入班)
 *  - 教学任务 & 课表 (过去4周 + 未来2周, 含COMPLETED状态)
 *  - 订单 & 支付记录 (25笔)
 *  - 资产账户 & 台账
 *  - 考勤记录 (已完成课次的考勤, 含present/absent/leave)
 *  - 退费申请 (不同审批状态)
 *  - 作业 & 提交
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── 工具函数 ────────────────────────────────────────────────
function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

function setHour(base: Date, h: number, m = 0): Date {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
}

// 获取本周一 00:00
function getThisMonday(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
}

async function main() {
    console.log('🗑  清理旧数据...');
    await prisma.teachAttendance.deleteMany();
    await prisma.studentLessonProgress.deleteMany();
    await prisma.stdLessonResource.deleteMany();
    await prisma.stdResource.deleteMany();
    await prisma.stdCourseLesson.deleteMany();
    await prisma.stdCourseChapter.deleteMany();
    await prisma.stdCourseVersion.deleteMany();
    await prisma.stdCourseTemplate.deleteMany();
    await prisma.stdCourseStandardCampus.deleteMany();
    await prisma.stdCourseStandard.deleteMany();
    await prisma.stdCourseCategory.deleteMany();
    await prisma.edLessonSchedule.deleteMany();
    await prisma.teachHomeworkSubmission.deleteMany();
    await prisma.teachHomework.deleteMany();
    await prisma.finAssetLedger.deleteMany();
    await prisma.finAssetAccount.deleteMany();
    await prisma.finRefundRecord.deleteMany();
    await prisma.finPaymentRecord.deleteMany();
    await prisma.finOrder.deleteMany();
    await prisma.eduStudentInClass.deleteMany();
    await prisma.edClassAssignment.deleteMany();
    await prisma.edClass.deleteMany();
    await prisma.eduStudent.deleteMany();
    await prisma.eduTeacher.deleteMany();
    await prisma.edCourse.deleteMany();
    await prisma.sysAnnouncement.deleteMany();
    await prisma.sysAuditLog.deleteMany();
    await prisma.sysUser.deleteMany();
    console.log('✅ 清理完成\n');

    const pw = await bcrypt.hash('123456', 10);
    const CAMPUS_PD = 'CAMPUS_PUDONG';   // 浦东校区
    const CAMPUS_XH = 'CAMPUS_XUHUI';   // 徐汇校区

    // ══════════════════════════════════════════
    // 1. 用户账号
    // ══════════════════════════════════════════
    console.log('👤 创建用户...');

    const adminUser = await prisma.sysUser.create({ data: { username: 'admin', password_hash: pw, role: 'ADMIN', status: 'ACTIVE' } });

    const adminPD = await prisma.sysUser.create({ data: { username: 'admin_pd', password_hash: pw, role: 'CAMPUS_ADMIN', campus_id: CAMPUS_PD, campusName: '浦东校区', status: 'ACTIVE' } });
    const adminXH = await prisma.sysUser.create({ data: { username: 'admin_xh', password_hash: pw, role: 'CAMPUS_ADMIN', campus_id: CAMPUS_XH, campusName: '徐汇校区', status: 'ACTIVE' } });

    // 教师
    const tUsers = await Promise.all([
        prisma.sysUser.create({ data: { username: 'teacher_zhang', password_hash: pw, role: 'TEACHER', campus_id: CAMPUS_PD, campusName: '浦东校区', status: 'ACTIVE' } }),
        prisma.sysUser.create({ data: { username: 'teacher_li', password_hash: pw, role: 'TEACHER', campus_id: CAMPUS_PD, campusName: '浦东校区', status: 'ACTIVE' } }),
        prisma.sysUser.create({ data: { username: 'teacher_wang', password_hash: pw, role: 'TEACHER', campus_id: CAMPUS_XH, campusName: '徐汇校区', status: 'ACTIVE' } }),
        prisma.sysUser.create({ data: { username: 'teacher_chen', password_hash: pw, role: 'TEACHER', campus_id: CAMPUS_XH, campusName: '徐汇校区', status: 'ACTIVE' } }),
    ]);

    const teachers = await Promise.all([
        prisma.eduTeacher.create({ data: { name: '张明', department: '设计部', user_id: tUsers[0].id } }),
        prisma.eduTeacher.create({ data: { name: '李华', department: '技术部', user_id: tUsers[1].id } }),
        prisma.eduTeacher.create({ data: { name: '王芳', department: '教研部', user_id: tUsers[2].id } }),
        prisma.eduTeacher.create({ data: { name: '陈刚', department: '技术部', user_id: tUsers[3].id } }),
    ]);
    const [t_zhang, t_li, t_wang, t_chen] = teachers;

    // 学生数据
    const studentRaw = [
        // 浦东校区
        { username: 'stu_wuxiao',   name: '吴晓雨', phone: '13800000001', campus: CAMPUS_PD },
        { username: 'stu_zhaolei',  name: '赵磊',   phone: '13800000002', campus: CAMPUS_PD },
        { username: 'stu_liuyang',  name: '刘洋',   phone: '13800000003', campus: CAMPUS_PD },
        { username: 'stu_sunna',    name: '孙娜',   phone: '13800000004', campus: CAMPUS_PD },
        { username: 'stu_zhouwen',  name: '周雯',   phone: '13800000005', campus: CAMPUS_PD },
        { username: 'stu_chenjun',  name: '陈俊',   phone: '13800000006', campus: CAMPUS_PD },
        { username: 'stu_huangmin', name: '黄敏',   phone: '13800000007', campus: CAMPUS_PD },
        { username: 'stu_linbo',    name: '林波',   phone: '13800000008', campus: CAMPUS_PD },
        // 徐汇校区
        { username: 'stu_fangyu',   name: '方宇',   phone: '13800000009', campus: CAMPUS_XH },
        { username: 'stu_guohui',   name: '郭慧',   phone: '13800000010', campus: CAMPUS_XH },
        { username: 'stu_tanwei',   name: '谭伟',   phone: '13800000011', campus: CAMPUS_XH },
        { username: 'stu_malin',    name: '马琳',   phone: '13800000012', campus: CAMPUS_XH },
        { username: 'stu_xiaxin',   name: '夏新',   phone: '13800000013', campus: CAMPUS_XH },
        { username: 'stu_songping', name: '宋平',   phone: '13800000014', campus: CAMPUS_XH },
        { username: 'stu_duwenbin', name: '杜文斌', phone: '13800000015', campus: CAMPUS_XH },
    ];

    const studentProfiles: Record<string, any> = {};
    for (const s of studentRaw) {
        const u = await prisma.sysUser.create({ data: { username: s.username, password_hash: pw, role: 'STUDENT', campus_id: s.campus, campusName: s.campus === CAMPUS_PD ? '浦东校区' : '徐汇校区', status: 'ACTIVE' } });
        const profile = await prisma.eduStudent.create({ data: { name: s.name, phone: s.phone, user_id: u.id } });
        studentProfiles[s.username] = profile;
    }

    // ══════════════════════════════════════════
    // 2. 课程
    // ══════════════════════════════════════════
    console.log('📚 创建课程...');
    const courses = await Promise.all([
        prisma.edCourse.create({ data: { name: '高级UI/UX设计实战',   category: '设计',   price: 4800, total_lessons: 32, status: 'ENABLED', is_standard: true, campus_id: CAMPUS_PD, instructor_id: t_zhang.id } }),
        prisma.edCourse.create({ data: { name: '全栈开发：React+Node', category: '编程',   price: 6400, total_lessons: 48, status: 'ENABLED', is_standard: true, campus_id: CAMPUS_PD, instructor_id: t_li.id   } }),
        prisma.edCourse.create({ data: { name: '零基础Python自动化',   category: '编程',   price: 2800, total_lessons: 24, status: 'ENABLED', is_standard: true, campus_id: CAMPUS_PD, instructor_id: t_zhang.id } }),
        prisma.edCourse.create({ data: { name: '数据分析与可视化',     category: '数据',   price: 3600, total_lessons: 30, status: 'ENABLED', is_standard: true, campus_id: CAMPUS_XH, instructor_id: t_wang.id  } }),
        prisma.edCourse.create({ data: { name: '人工智能基础与应用',   category: 'AI',     price: 5200, total_lessons: 36, status: 'ENABLED', is_standard: true, campus_id: CAMPUS_XH, instructor_id: t_chen.id  } }),
        prisma.edCourse.create({ data: { name: '产品经理实战训练营',   category: '产品',   price: 3200, total_lessons: 20, status: 'ENABLED', is_standard: false, campus_id: CAMPUS_XH, instructor_id: t_wang.id } }),
    ]);
    const [cUI, cReact, cPython, cData, cAI, cPM] = courses;

    // ══════════════════════════════════════════
    // 3. 班级
    // ══════════════════════════════════════════
    console.log('🏫 创建班级...');
    const classes = await Promise.all([
        prisma.edClass.create({ data: { name: 'UI设计-2026春季1班',      capacity: 20, enrolled: 8, campus_id: CAMPUS_PD, status: 'ONGOING'  } }),
        prisma.edClass.create({ data: { name: '全栈开发-周末精品班',     capacity: 15, enrolled: 8, campus_id: CAMPUS_PD, status: 'ONGOING'  } }),
        prisma.edClass.create({ data: { name: 'Python零基础-晚班',       capacity: 20, enrolled: 8, campus_id: CAMPUS_PD, status: 'ONGOING'  } }),
        prisma.edClass.create({ data: { name: '数据分析-进阶班',         capacity: 18, enrolled: 7, campus_id: CAMPUS_XH, status: 'ONGOING'  } }),
        prisma.edClass.create({ data: { name: 'AI应用-精品1班',          capacity: 15, enrolled: 7, campus_id: CAMPUS_XH, status: 'ONGOING'  } }),
        prisma.edClass.create({ data: { name: '产品经理集训-2026Q1班',   capacity: 12, enrolled: 8, campus_id: CAMPUS_XH, status: 'ONGOING'  } }),
    ]);
    const [cls1, cls2, cls3, cls4, cls5, cls6] = classes;

    // ══════════════════════════════════════════
    // 4. 教学任务 (Assignments)
    // ══════════════════════════════════════════
    const assignments = await Promise.all([
        prisma.edClassAssignment.create({ data: { class_id: cls1.id, course_id: cUI.id,     teacher_id: t_zhang.id, status: 'ACTIVE' } }),
        prisma.edClassAssignment.create({ data: { class_id: cls2.id, course_id: cReact.id,  teacher_id: t_li.id,    status: 'ACTIVE' } }),
        prisma.edClassAssignment.create({ data: { class_id: cls3.id, course_id: cPython.id, teacher_id: t_zhang.id, status: 'ACTIVE' } }),
        prisma.edClassAssignment.create({ data: { class_id: cls4.id, course_id: cData.id,   teacher_id: t_wang.id,  status: 'ACTIVE' } }),
        prisma.edClassAssignment.create({ data: { class_id: cls5.id, course_id: cAI.id,     teacher_id: t_chen.id,  status: 'ACTIVE' } }),
        prisma.edClassAssignment.create({ data: { class_id: cls6.id, course_id: cPM.id,     teacher_id: t_wang.id,  status: 'ACTIVE' } }),
    ]);
    const [aUI, aReact, aPython, aData, aAI, aPM] = assignments;

    // ══════════════════════════════════════════
    // 5. 学生入班 + 资产账户 + 订单
    // ══════════════════════════════════════════
    console.log('🎓 学生入班 + 购课...');

    // 浦东校区学生分配
    const pdStudents = ['stu_wuxiao','stu_zhaolei','stu_liuyang','stu_sunna','stu_zhouwen','stu_chenjun','stu_huangmin','stu_linbo'];
    const xhStudents = ['stu_fangyu','stu_guohui','stu_tanwei','stu_malin','stu_xiaxin','stu_songping','stu_duwenbin'];

    // 浦东: 前8人分配到 cls1(UI) + 部分到 cls2(React) + cls3(Python)
    for (const [i, uname] of pdStudents.entries()) {
        const s = studentProfiles[uname];
        // 所有浦东学生入 UI班
        await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls1.id } });
        await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cUI.id, campus_id: CAMPUS_PD, total_qty: 32, remaining_qty: 32 - (i * 2 % 10), status: 'ACTIVE' } });

        // 前5人额外入 React班
        if (i < 5) {
            await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls2.id } });
            await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cReact.id, campus_id: CAMPUS_PD, total_qty: 48, remaining_qty: 48 - (i * 3 % 12), status: 'ACTIVE' } });
        }

        // 后4人入 Python班
        if (i >= 4) {
            await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls3.id } });
            await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cPython.id, campus_id: CAMPUS_PD, total_qty: 24, remaining_qty: 24 - (i % 8), status: 'ACTIVE' } });
        }
    }

    // 徐汇: 前7人分配到不同班级
    for (const [i, uname] of xhStudents.entries()) {
        const s = studentProfiles[uname];
        if (i < 4) {
            await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls4.id } });
            await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cData.id, campus_id: CAMPUS_XH, total_qty: 30, remaining_qty: 30 - (i * 3 % 15), status: 'ACTIVE' } });
        }
        if (i >= 2 && i < 6) {
            await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls5.id } });
            await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cAI.id, campus_id: CAMPUS_XH, total_qty: 36, remaining_qty: 36 - (i * 2 % 10), status: 'ACTIVE' } });
        }
        if (i >= 4) {
            await prisma.eduStudentInClass.create({ data: { student_id: s.id, class_id: cls6.id } });
            await prisma.finAssetAccount.create({ data: { student_id: s.id, course_id: cPM.id, campus_id: CAMPUS_XH, total_qty: 20, remaining_qty: 20 - (i % 6), status: 'ACTIVE' } });
        }
    }

    // ══════════════════════════════════════════
    // 6. 订单 + 支付记录
    // ══════════════════════════════════════════
    console.log('💰 创建订单...');

    const orderDefs = [
        // 浦东 UI课 - 8笔
        ...pdStudents.slice(0, 8).map((u, i) => ({ uname: u, course: cUI,     amount: 4800, channel: ['微信支付','支付宝','刷卡'][i % 3], status: 'PAID' })),
        // 浦东 React课 - 5笔
        ...pdStudents.slice(0, 5).map((u, i) => ({ uname: u, course: cReact,  amount: 6400, channel: ['微信支付','银行转账'][i % 2], status: 'PAID' })),
        // 浦东 Python课 - 4笔
        ...pdStudents.slice(4, 8).map((u, i) => ({ uname: u, course: cPython, amount: 2800, channel: '微信支付', status: ['PAID','PAID','PAID','PENDING_PAYMENT'][i] })),
        // 徐汇 Data课 - 4笔
        ...xhStudents.slice(0, 4).map((u, i) => ({ uname: u, course: cData,   amount: 3600, channel: ['支付宝','微信支付'][i % 2], status: 'PAID' })),
        // 徐汇 AI课 - 4笔
        ...xhStudents.slice(2, 6).map((u, i) => ({ uname: u, course: cAI,     amount: 5200, channel: '微信支付', status: 'PAID' })),
        // 徐汇 PM课 - 3笔
        ...xhStudents.slice(4, 7).map((u, i) => ({ uname: u, course: cPM,     amount: 3200, channel: ['支付宝','现金'][i % 2], status: ['PAID','PAID','PENDING_PAYMENT'][i] })),
    ];

    const orderRecords: Record<string, any> = {};
    for (const od of orderDefs) {
        const s = studentProfiles[od.uname];
        const order = await prisma.finOrder.create({
            data: { student_id: s.id, course_id: od.course.id, amount: od.amount, total_qty: od.course.total_lessons, status: od.status, order_source: 'student' }
        });
        if (od.status === 'PAID') {
            await prisma.finPaymentRecord.create({
                data: { order_id: order.id, amount: od.amount, channel: od.channel, status: 'SUCCESS' }
            });
        }
        orderRecords[`${od.uname}_${od.course.id}`] = order;
    }

    // ══════════════════════════════════════════
    // 7. 课表 (过去4周 + 未来2周)
    // ══════════════════════════════════════════
    console.log('📅 生成课表...');
    const monday = getThisMonday();

    type LessonDef = { assignId: string; dayOffset: number; hour: number; room: string };

    const scheduleDefs: LessonDef[] = [
        // UI班: 周一10点, 周三14点, 周五10点
        { assignId: aUI.id,     dayOffset: 0, hour: 10, room: '101 艺术教室' },
        { assignId: aUI.id,     dayOffset: 2, hour: 14, room: '101 艺术教室' },
        { assignId: aUI.id,     dayOffset: 4, hour: 10, room: '101 艺术教室' },
        // React班: 周二18点, 周四18点
        { assignId: aReact.id,  dayOffset: 1, hour: 18, room: '502 软件实验室' },
        { assignId: aReact.id,  dayOffset: 3, hour: 18, room: '502 软件实验室' },
        // Python班: 周一19点, 周三19点
        { assignId: aPython.id, dayOffset: 0, hour: 19, room: '302 多功能室' },
        { assignId: aPython.id, dayOffset: 2, hour: 19, room: '302 多功能室' },
        // 数据分析班(徐汇): 周二10点, 周四14点
        { assignId: aData.id,   dayOffset: 1, hour: 10, room: 'B201 数据实验室' },
        { assignId: aData.id,   dayOffset: 3, hour: 14, room: 'B201 数据实验室' },
        // AI班(徐汇): 周三10点, 周六10点
        { assignId: aAI.id,     dayOffset: 2, hour: 10, room: 'A101 智能实验室' },
        { assignId: aAI.id,     dayOffset: 5, hour: 10, room: 'A101 智能实验室' },
        // PM班(徐汇): 周六14点
        { assignId: aPM.id,     dayOffset: 5, hour: 14, room: 'C301 沙盘室' },
    ];

    // 计数器: 每个 assignment 的 lesson_no
    const lessonCounter: Record<string, number> = {};
    const createdLessons: { lessonId: string; assignId: string; classId: string; weekOffset: number; isPast: boolean }[] = [];

    for (let weekOffset = -4; weekOffset <= 2; weekOffset++) {
        const weekStart = addDays(monday, weekOffset * 7);

        for (const def of scheduleDefs) {
            lessonCounter[def.assignId] = (lessonCounter[def.assignId] || 0) + 1;
            const lessonNo = lessonCounter[def.assignId];
            const start = setHour(addDays(weekStart, def.dayOffset), def.hour);
            const end   = setHour(addDays(weekStart, def.dayOffset), def.hour + 2);
            const isPast = start < new Date();
            const status = isPast ? 'COMPLETED' : (weekOffset === 0 ? 'PUBLISHED' : 'DRAFT');

            const lesson = await prisma.edLessonSchedule.create({
                data: { assignment_id: def.assignId, lesson_no: lessonNo, start_time: start, end_time: end, classroom: def.room, status, is_consumed: isPast }
            });

            // 找对应班级ID
            const assign = assignments.find(a => a.id === def.assignId)!;
            createdLessons.push({ lessonId: lesson.id, assignId: def.assignId, classId: assign.class_id, weekOffset, isPast });
        }
    }

    // ══════════════════════════════════════════
    // 8. 考勤记录 (只对已过去的课次)
    // ══════════════════════════════════════════
    console.log('✅ 生成考勤记录...');

    // 班级 → 学生列表映射
    const classStudentMap: Record<string, string[]> = {
        [cls1.id]: pdStudents.map(u => studentProfiles[u].id),
        [cls2.id]: pdStudents.slice(0, 5).map(u => studentProfiles[u].id),
        [cls3.id]: pdStudents.slice(4).map(u => studentProfiles[u].id),
        [cls4.id]: xhStudents.slice(0, 4).map(u => studentProfiles[u].id),
        [cls5.id]: xhStudents.slice(2, 6).map(u => studentProfiles[u].id),
        [cls6.id]: xhStudents.slice(4).map(u => studentProfiles[u].id),
    };

    // 每节课次对应的课时扣减量
    const courseDeductMap: Record<string, number> = {
        [aUI.id]: 1, [aReact.id]: 1, [aPython.id]: 1,
        [aData.id]: 1, [aAI.id]: 1, [aPM.id]: 1,
    };

    const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LEAVE', 'ABSENT'];

    for (const lesson of createdLessons.filter(l => l.isPast)) {
        const studentIds = classStudentMap[lesson.classId] || [];
        for (const [i, sid] of studentIds.entries()) {
            const status = attendanceStatuses[(i + lesson.lessonId.charCodeAt(0)) % attendanceStatuses.length];
            await prisma.teachAttendance.create({
                data: {
                    lesson_id: lesson.lessonId,
                    student_id: sid,
                    status,
                    deduct_status: 'CONFIRMED',
                    deduct_amount: courseDeductMap[lesson.assignId] || 1
                }
            });
        }
    }

    // ══════════════════════════════════════════
    // 9. 资产台账 (补充扣减记录)
    // ══════════════════════════════════════════
    console.log('📒 创建资产台账...');

    const allAccounts = await prisma.finAssetAccount.findMany();
    for (const acc of allAccounts) {
        const consumed = acc.total_qty - acc.remaining_qty;
        if (consumed > 0) {
            await prisma.finAssetLedger.create({
                data: { account_id: acc.id, type: 'DEDUCT', change_qty: -consumed, balance_snapshot: acc.remaining_qty }
            });
        }
        // 初始充值记录
        await prisma.finAssetLedger.create({
            data: { account_id: acc.id, type: 'RECHARGE', change_qty: acc.total_qty, balance_snapshot: acc.total_qty,
                    occurTime: new Date(Date.now() - 30 * 24 * 3600 * 1000) }
        });
    }

    // ══════════════════════════════════════════
    // 10. 退费申请
    // ══════════════════════════════════════════
    console.log('💸 创建退费记录...');

    const refundStudents = [
        { uname: 'stu_linbo',    course: cUI,    amount: 2400, reason: '个人时间冲突无法继续上课，申请退剩余课时费', status: 'PENDING_APPROVAL' },
        { uname: 'stu_zhouwen',  course: cReact, amount: 3200, reason: '课程内容与预期不符，申请部分退款',           status: 'PENDING_APPROVAL' },
        { uname: 'stu_chenjun',  course: cUI,    amount: 1200, reason: '学员生病长期请假，家长申请退费',             status: 'PENDING_HQ_APPROVAL' },
        { uname: 'stu_songping', course: cAI,    amount: 800,  reason: '出行计划变更，无法完成课程学习',            status: 'APPROVED' },
        { uname: 'stu_tanwei',   course: cData,  amount: 500,  reason: '试听后觉得难度过高，申请退款',              status: 'REJECTED' },
    ];

    for (const rd of refundStudents) {
        const s = studentProfiles[rd.uname];
        const key = `${rd.uname}_${rd.course.id}`;
        const order = orderRecords[key];
        if (!order) continue;
        await prisma.finRefundRecord.create({
            data: {
                order_id: order.id, student_id: s.id,
                amount: rd.amount, reason: rd.reason,
                status: rd.status, applicant_id: adminPD.id,
                approver_id: rd.status === 'APPROVED' || rd.status === 'REJECTED' ? adminUser.id : null
            }
        });
    }

    // ══════════════════════════════════════════
    // 11. 作业
    // ══════════════════════════════════════════
    console.log('📝 创建作业与提交...');
    const nextMonday = addDays(monday, 7);

    const hw1 = await prisma.teachHomework.create({
        data: { title: 'UI基础：临摹复杂卡片组件', content: '请选用 Figma 临摹一个含阴影、圆角与渐变的订单确认卡片，需输出高保真稿与组件说明文档。', deadline: setHour(nextMonday, 23, 59), assignment_id: aUI.id, teacher_id: t_zhang.id }
    });

    const hw2 = await prisma.teachHomework.create({
        data: { title: 'React实战：实现分页表格', content: '使用 React + TypeScript 实现一个支持排序与分页的数据表格，需包含 loading 状态与空状态。', deadline: setHour(nextMonday, 23, 59), assignment_id: aReact.id, teacher_id: t_li.id }
    });

    // 3名学生已提交第一份作业
    for (const uname of pdStudents.slice(0, 3)) {
        const s = studentProfiles[uname];
        await prisma.teachHomeworkSubmission.create({
            data: { homework_id: hw1.id, student_id: s.id, content: `${s.name}的作业提交：已完成 Figma 临摹稿，共12个组件，注释完整。`, status: 'SUBMITTED' }
        });
    }

    // 2名学生已提交第二份作业，且已批阅
    for (const [i, uname] of pdStudents.slice(0, 2).entries()) {
        const s = studentProfiles[uname];
        await prisma.teachHomeworkSubmission.create({
            data: { homework_id: hw2.id, student_id: s.id, content: `实现了分页表格，支持前端排序，使用了 useCallback 优化性能。`, score: [92, 85][i], feedback: ['代码整洁，组件拆分合理，建议补充单元测试', '逻辑清晰，但缺少错误边界处理'][i], status: 'GRADED' }
        });
    }

    // ══════════════════════════════════════════
    // 12. 公告
    // ══════════════════════════════════════════
    console.log('📢 创建系统公告...');
    await prisma.sysAnnouncement.create({
        data: { title: '2026年春季班正式开课通知', content: '各位同学，春季班已于本周正式开课，请准时参加各自班级课程，有问题请联系对应校区管理员。', status: 'PUBLISHED', scope: 'ALL', publisher_id: adminUser.id, publishTime: addDays(monday, -7) }
    });
    await prisma.sysAnnouncement.create({
        data: { title: '五一假期课程调整安排', content: '五一劳动节期间（5月1日-5日）停课，课程顺延至下周，具体时间以校区通知为准。', status: 'PUBLISHED', scope: 'ALL', publisher_id: adminUser.id, publishTime: addDays(monday, -3) }
    });

    // ══════════════════════════════════════════
    // 13. 审计日志
    // ══════════════════════════════════════════
    console.log('🔍 创建审计日志...');
    const auditLogs = [
        { action: '用户登录', entity_type: 'SysUser', entity_id: adminUser.id,  operator_id: adminUser.id,  details: 'IP: 192.168.1.101, 浏览器: Chrome 120' },
        { action: '审批退费', entity_type: 'FinRefundRecord', entity_id: 'mock', operator_id: adminPD.id, details: '批准 stu_songping 退费 ¥800' },
        { action: '发布课表', entity_type: 'EdLessonSchedule', entity_id: aUI.id,  operator_id: adminPD.id, details: '发布 UI设计春季1班 第1-6节课次' },
        { action: '新增学生', entity_type: 'EduStudent', entity_id: 'mock',        operator_id: adminXH.id, details: '新增学员：杜文斌，徐汇校区' },
        { action: '拒绝退费', entity_type: 'FinRefundRecord', entity_id: 'mock', operator_id: adminUser.id, details: '拒绝 stu_tanwei 退费申请，理由：超过退费期限' },
    ];
    for (const log of auditLogs) {
        await prisma.sysAuditLog.create({ data: log });
    }

    // ══════════════════════════════════════════
    // 完成
    // ══════════════════════════════════════════
    console.log('\n🎉 全量演示数据落库完成！');
    console.log('═══════════════════════════════════');
    console.log('登录账号 (密码统一: 123456)');
    console.log('─────────────────────────────────');
    console.log('总部管理员:    admin');
    console.log('浦东校区管理员: admin_pd');
    console.log('徐汇校区管理员: admin_xh');
    console.log('教师:          teacher_zhang / teacher_li / teacher_wang / teacher_chen');
    console.log('学生(浦东):    stu_wuxiao ~ stu_linbo (8人)');
    console.log('学生(徐汇):    stu_fangyu ~ stu_duwenbin (7人)');
    console.log('═══════════════════════════════════\n');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
