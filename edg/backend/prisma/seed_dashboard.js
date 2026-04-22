/**
 * seed_dashboard.js — 仪表盘演示数据种子
 * 运行: node prisma/seed_dashboard.js
 *
 * 用途：为总部/校区管理端 Dashboard 提供"有血有肉"的统计数据（过去 12 个月分布）。
 * 清理范围（执行即删除）：
 *   考勤 / 课次 / 作业提交 / 作业 / 学员入班 / 班级分配 / 班级 /
 *   支付记录 / 订单 / 资产流水 / 资产账户 / 退费记录
 *   ※ 不清理 SysUser / EduStudent / EduTeacher / EdCourse，这些用 upsert/findFirst 保留
 * 插入内容：
 *   - 1 个总部管理员 + 3 个校区管理员（海淀 / 朝阳 / 东城）
 *   - 3 个教师
 *   - 4 门课程
 *   - 50 个学员，每人 1-2 笔历史订单（跨过去 12 个月），附支付记录 & 资产账户
 *   - 4 个班级（每校区一个）+ 对应教学分配
 *   - 3 个 PENDING_APPROVAL 的用户审批申请
 * 前置依赖：数据库 schema 已迁移即可；无其他强依赖。
 * 登录凭证：统一密码 123456
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 主流程：清理相关聚合表 → 建用户/教师/课程 → 批量造学员与历史订单 → 建班级 → 写待审批申请
async function main() {
    console.log('--- Starting Dashboard Seeding ---');

    // Clean up to avoid duplicates (Optional but good for consistent dashboard)
    // Clean up to avoid duplicates in correct order
    await prisma.teachAttendance.deleteMany();
    await prisma.edLessonSchedule.deleteMany();
    await prisma.teachHomeworkSubmission.deleteMany();
    await prisma.teachHomework.deleteMany();
    await prisma.eduStudentInClass.deleteMany();
    await prisma.edClassAssignment.deleteMany();
    await prisma.edClass.deleteMany();
    await prisma.finPaymentRecord.deleteMany();
    await prisma.finOrder.deleteMany();
    await prisma.finAssetLedger.deleteMany();
    await prisma.finAssetAccount.deleteMany();
    await prisma.finRefundRecord.deleteMany();

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Initial Users (HQ and Campus Admins)
    const users = [
        { username: 'admin_hq', role: 'ADMIN', name: '总部管理员', campus_id: 'HQ', campusName: '总部' },
        { username: 'admin_c1', role: 'CAMPUS_ADMIN', name: '海淀校区主管', campus_id: 'C001', campusName: '海淀校区' },
        { username: 'admin_c2', role: 'CAMPUS_ADMIN', name: '朝阳校区主管', campus_id: 'C002', campusName: '朝阳校区' },
        { username: 'admin_c3', role: 'CAMPUS_ADMIN', name: '东城校区主管', campus_id: 'C003', campusName: '东城校区' },
    ];

    for (const u of users) {
        await prisma.sysUser.upsert({
            where: { username: u.username },
            update: { password_hash: passwordHash, role: u.role, campus_id: u.campus_id, campusName: u.campusName },
            create: { username: u.username, password_hash: passwordHash, role: u.role, campus_id: u.campus_id, campusName: u.campusName }
        });
    }

    // 2. Teachers
    const teachersData = [
        { name: '王老师', username: 'teacher_wang', campus: 'C001' },
        { name: '李老师', username: 'teacher_li', campus: 'C002' },
        { name: '张老师', username: 'teacher_zhang', campus: 'C003' },
    ];

    const teacherIds = [];
    for (const t of teachersData) {
        const user = await prisma.sysUser.upsert({
            where: { username: t.username },
            update: { role: 'TEACHER', campus_id: t.campus },
            create: { username: t.username, password_hash: passwordHash, role: 'TEACHER', campus_id: t.campus }
        });
        const teacher = await prisma.eduTeacher.upsert({
            where: { user_id: user.id },
            update: { name: t.name },
            create: { name: t.name, user_id: user.id }
        });
        teacherIds.push(teacher.id);
    }

    // 3. Courses
    const coursesData = [
        { name: '少儿编程进阶班', price: 8800, total: 32, category: '编程' },
        { name: '雅思精品提分课', price: 15600, total: 48, category: '语言' },
        { name: '数学思维训练', price: 4500, total: 24, category: '学科' },
        { name: '艺术启蒙课程', price: 3800, total: 20, category: '艺术' },
    ];

    const courseIds = [];
    for (const c of coursesData) {
        let course = await prisma.edCourse.findFirst({ where: { name: c.name } });
        if (!course) {
            course = await prisma.edCourse.create({
                data: {
                    name: c.name,
                    price: c.price,
                    total_lessons: c.total,
                    category: c.category,
                    status: 'ENABLED'
                }
            });
        }
        courseIds.push(course.id);
    }

    // 4. Students & Orders (Historical)
    const studentNames = ['陈梓豪', '周美琳', '赵阳', '林思雨', '王子豪', '刘欢', '马特', '宋江', '林冲', '卢俊义'];
    const campuses = ['C001', 'C002', 'C003'];
    
    console.log('Generating students and historical orders...');
    for (let i = 0; i < 50; i++) {
        const name = studentNames[i % studentNames.length] + (i + 1);
        const username = `student_${i + 1}`;
        const campusId = campuses[i % campuses.length];

        const user = await prisma.sysUser.upsert({
            where: { username },
            update: { campus_id: campusId, campusName: users.find(u => u.campus_id === campusId)?.campusName },
            create: {
                username,
                password_hash: passwordHash,
                role: 'STUDENT',
                campus_id: campusId,
                campusName: users.find(u => u.campus_id === campusId)?.campusName
            }
        });

        let student = await prisma.eduStudent.findUnique({ where: { user_id: user.id } });
        if (!student) {
            student = await prisma.eduStudent.create({
                data: {
                    name,
                    phone: `138${10000000 + i}`,
                    user_id: user.id
                }
            });
        }

        // Add 1-2 orders spread over the last year
        const numOrders = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numOrders; j++) {
            const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
            const course = coursesData[courseIds.indexOf(courseId)];
            
            // Random date in the last 12 months
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
            date.setDate(Math.floor(Math.random() * 28) + 1);

            const order = await prisma.finOrder.create({
                data: {
                    student_id: student.id,
                    course_id: courseId,
                    amount: course.price,
                    total_qty: course.total,
                    status: 'PAID',
                    createdAt: date
                }
            });

            await prisma.finPaymentRecord.create({
                data: {
                    order_id: order.id,
                    amount: course.price,
                    channel: 'WECHAT',
                    status: 'SUCCESS',
                    createdAt: date
                }
            });

            // Create Asset Account
            await prisma.finAssetAccount.create({
                data: {
                    student_id: student.id,
                    course_id: courseId,
                    campus_id: campusId,
                    total_qty: course.total,
                    remaining_qty: course.total - Math.floor(Math.random() * 10), // Some lessons consumed
                }
            });
        }
    }

    // 5. Classes and Assignments
    console.log('Creating classes...');
    for (let i = 0; i < courseIds.length; i++) {
        const campusId = campuses[i % campuses.length];
        const cls = await prisma.edClass.create({
            data: {
                name: `${coursesData[i].name} - ${campusId}班`,
                capacity: 20,
                enrolled: 15,
                campus_id: campusId,
                status: 'ONGOING'
            }
        });

        await prisma.edClassAssignment.create({
            data: {
                class_id: cls.id,
                course_id: courseIds[i],
                teacher_id: teacherIds[i % teacherIds.length],
                status: 'ACTIVE'
            }
        });
    }

    // 6. Pending Approvals
    console.log('Generating pending approvals...');
    const pendingUsers = [
        { username: 'pending_c1', role: 'CAMPUS_ADMIN', name: '新校区申请者A', campusName: '海淀北校区' },
        { username: 'pending_c2', role: 'CAMPUS_ADMIN', name: '新校区申请者B', campusName: '朝阳南校区' },
        { username: 'pending_t1', role: 'TEACHER', name: '面试老师甲', campus_id: 'C001' },
    ];

    for (const p of pendingUsers) {
        await prisma.sysUser.upsert({
            where: { username: p.username },
            update: { status: 'PENDING_APPROVAL', role: p.role, campus_id: p.campus_id || null, campusName: p.campusName || null },
            create: {
                username: p.username,
                password_hash: passwordHash,
                role: p.role,
                status: 'PENDING_APPROVAL',
                campus_id: p.campus_id || null,
                campusName: p.campusName || null
            }
        });
    }

    console.log('--- Dashboard Seeding Completed ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
