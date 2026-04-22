/**
 * seed_v2.js — v2 教学模型最小集种子（用于验证 Class / Assignment / Schedule 新结构）
 * 运行: node prisma/seed_v2.js
 *
 * 用途：演示"班级(edClass) + 教学任务(edClassAssignment) + 排课(edLessonSchedule)"这套新模型的最小闭环。
 * 清理范围：不清空历史；用户用 upsert（可重复跑），但 edCourse / edClass / assignment / schedule / student 每次都会新增（注意累积）。
 * 插入内容：
 *   - 校区管理员 admin_c1（C001 总校区）
 *   - 教师 teacher1 + EduTeacher "王老师"
 *   - 1 门"高级UI设计"课程
 *   - 1 个"2024 UI设计提升班"班级 + 教学任务分配
 *   - 5 节已发布课表（未来 5 周每周一节）
 *   - 1 个学生 student1"小明"并入班
 * 前置依赖：仅需 schema 已迁移。
 * 登录凭证：统一密码 123456
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 主流程：upsert 管理员/教师/学生 → 创建课程/班级/分配 → 循环生成 5 节课表 → 学生入班
async function main() {
    console.log('--- Seeding Updated Academic Model ---');
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Create Campus Admin
    const campusAdmin = await prisma.sysUser.upsert({
        where: { username: 'admin_c1' },
        update: {
            password_hash: passwordHash,
            role: 'CAMPUS_ADMIN',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        },
        create: {
            username: 'admin_c1',
            password_hash: passwordHash,
            role: 'CAMPUS_ADMIN',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        }
    });

    // 2. Create Teacher
    const teacherUser = await prisma.sysUser.upsert({
        where: { username: 'teacher1' },
        update: {
            password_hash: passwordHash,
            role: 'TEACHER',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        },
        create: {
            username: 'teacher1',
            password_hash: passwordHash,
            role: 'TEACHER',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        }
    });
    const teacher = await prisma.eduTeacher.upsert({
        where: { user_id: teacherUser.id },
        update: { name: '王老师' },
        create: {
            name: '王老师',
            user_id: teacherUser.id
        }
    });

    // 3. Create Course
    const course = await prisma.edCourse.create({
        data: {
            name: '高级UI设计',
            category: '艺术设计',
            price: 5000,
            total_lessons: 20,
            campus_id: 'C001'
        }
    });

    // 4. Create Class (Subject)
    const cls = await prisma.edClass.create({
        data: {
            name: '2024 UI设计提升班',
            capacity: 30,
            campus_id: 'C001'
        }
    });

    // 5. Assign Course & Teacher to Class
    const assignment = await prisma.edClassAssignment.create({
        data: {
            class_id: cls.id,
            course_id: course.id,
            teacher_id: teacher.id
        }
    });

    // 6. Generate Published Schedules
    for (let i = 1; i <= 5; i++) {
        const start = new Date();
        start.setDate(start.getDate() + (i * 7));
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + 7200000); // 2h

        await prisma.edLessonSchedule.create({
            data: {
                assignment_id: assignment.id,
                lesson_no: i,
                start_time: start,
                end_time: end,
                classroom: '设计室 101',
                status: 'PUBLISHED'
            }
        });
    }

    // 7. Create Student & Enroll
    const studentUser = await prisma.sysUser.upsert({
        where: { username: 'student1' },
        update: {
            password_hash: passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        },
        create: {
            username: 'student1',
            password_hash: passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            campus_id: 'C001',
            campusName: '总校区'
        }
    });
    const student = await prisma.eduStudent.create({
        data: {
            name: '小明',
            user_id: studentUser.id
        }
    });
    await prisma.eduStudentInClass.create({
        data: {
            student_id: student.id,
            class_id: cls.id
        }
    });

    console.log('--- Seed Completed ---');
    console.log('Login credentials:');
    console.log('Admin: admin_c1 / 123456');
    console.log('Teacher: teacher1 / 123456');
    console.log('Student: student1 / 123456');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
