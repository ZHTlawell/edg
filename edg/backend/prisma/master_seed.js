/**
 * master_seed.js — 主种子脚本（多校区基础环境）
 * 运行: node prisma/master_seed.js
 *
 * 何时运行：首次初始化多校区演示环境时；可重复运行（使用 upsert，不会重复创建账号）。
 * 清理范围：不清理历史数据，仅 upsert 账号；但 edCourse / edClass / edLessonSchedule 每次都会新增（注意累积）。
 * 插入内容：
 *   - 4 个管理员账号（admin_hq + admin_c1~c3，分属 HQ / C001 / C002 / C003 校区）
 *   - 4 个教师账号 + EduTeacher 档案
 *   - 至少 1 个课程标准（若无则创建 Python入门 / IT编程 分类）
 *   - 1 门课程实例 + 1 个班级 + 3 节预排课
 * 前置依赖：数据库已执行过 prisma migrate；无其他数据依赖。
 * 登录凭证：统一密码 123456
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 主流程：顺序执行「管理员 upsert → 教师 upsert → 课程标准保证 → 新课程/班级/排课创建」
async function main() {
    console.log('--- Database Master Seeding Started ---');

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. 初始化校区环境 (Ensure Campus Admins exist with fixed IDs)
    const campusAdmins = [
        { username: 'admin_hq', role: 'ADMIN', name: '总校管理员', campus_id: 'HQ', campusName: '总部' },
        { username: 'admin_c1', role: 'CAMPUS_ADMIN', name: '总校主管', campus_id: 'C001', campusName: '总校区' },
        { username: 'admin_c2', role: 'CAMPUS_ADMIN', name: '浦东主管', campus_id: 'C002', campusName: '浦东校区' },
        { username: 'admin_c3', role: 'CAMPUS_ADMIN', name: '静安主管', campus_id: 'C003', campusName: '静安校区' }
    ];

    for (const a of campusAdmins) {
        console.log(`Setting up Admin/CampusAdmin: ${a.username}`);
        await prisma.sysUser.upsert({
            where: { username: a.username },
            update: {
                password_hash: passwordHash,
                role: a.role,
                status: 'ACTIVE',
                campus_id: a.campus_id,
                campusName: a.campusName
            },
            create: {
                username: a.username,
                password_hash: passwordHash,
                role: a.role,
                status: 'ACTIVE',
                campus_id: a.campus_id,
                campusName: a.campusName
            }
        });
    }

    // 2. 创建教师档案 (Teacher A, B, C)
    const teachers = [
        { username: 'teacher1', name: '王晓明', dept: '教研部', campusId: 'C001', campusName: '总校区' },
        { username: 'teacher2', name: '李丽华', dept: '教务部', campusId: 'C002', campusName: '浦东校区' },
        { username: 'teacher3', name: '张建国', dept: '咨询部', campusId: 'C003', campusName: '静安校区' },
        { username: 'teacher_hq', name: '赵大勇', dept: '总部调配', campusId: 'HQ', campusName: '总部' }
    ];

    for (const t of teachers) {
        console.log(`Setting up Teacher: ${t.username}`);
        const user = await prisma.sysUser.upsert({
            where: { username: t.username },
            update: {
                password_hash: passwordHash,
                role: 'TEACHER',
                status: 'ACTIVE',
                campus_id: t.campusId,
                campusName: t.campusName
            },
            create: {
                username: t.username,
                password_hash: passwordHash,
                role: 'TEACHER',
                status: 'ACTIVE',
                campus_id: t.campusId,
                campusName: t.campusName
            }
        });

        await prisma.eduTeacher.upsert({
            where: { user_id: user.id },
            update: { name: t.name, department: t.dept },
            create: { name: t.name, department: t.dept, user_id: user.id }
        });
    }

    // 3. 准备排课数据 (Ensuring at least one course and one class exists)
    // 检查是否有现有课程标准
    let std = await prisma.stdCourseStandard.findFirst();
    if (!std) {
        console.log('No Standard found, creating one...');
        const cat = await prisma.stdCourseCategory.upsert({
            where: { name: 'IT编程' },
            create: { name: 'IT编程' },
            update: {}
        });
        std = await prisma.stdCourseStandard.create({
            data: {
                code: 'CS101',
                name: 'Python入门',
                category_id: cat.id,
                total_lessons: 12,
                creator_id: 'SYSTEM',
                status: 'ENABLED'
            }
        });
    }

    // 创建课程实例
    const course = await prisma.edCourse.create({
        data: {
            name: 'Python 基础班 (2026)',
            category: '编程',
            price: 2999,
            total_lessons: 12,
            is_standard: true,
            standard_id: std.id,
            status: 'ENABLED',
            campus_id: 'C001'
        }
    });

    const teacher = await prisma.eduTeacher.findFirst({ where: { name: '王晓明' } });
    if (teacher) {
        // 创建班级
        const cls = await prisma.edClass.create({
            data: {
                name: '总校 Python 1班',
                capacity: 25,
                enrolled: 10,
                campus_id: 'C001',
                status: 'ONGOING',
                course_id: course.id,
                teacher_id: teacher.id
            }
        });

        // 生成 3 个预排课
        for (let i = 1; i <= 3; i++) {
            const start = new Date();
            start.setDate(start.getDate() + (i * 7));
            start.setHours(14, 0, 0, 0);

            await prisma.edLessonSchedule.create({
                data: {
                    class_id: cls.id,
                    lesson_no: i,
                    start_time: start,
                    end_time: new Date(start.getTime() + 5400000), // 1.5h
                    classroom: '教研室 B',
                    status: 'PUBLISHED'
                }
            });
        }
        console.log('Class and Schedules created for Teacher 1');
    }

    console.log('--- Master Seeding Completed ---');
    console.log('Credentials:');
    console.log('- HQ Admin: admin_hq / 123456');
    console.log('- C001 Admin: admin_c1 / 123456');
    console.log('- Teacher 1: teacher1 / 123456');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
