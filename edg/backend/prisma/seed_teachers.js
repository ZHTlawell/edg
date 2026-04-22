/**
 * seed_teachers.js — 教师账号（多校区）+ 示例班级 种子脚本
 * 运行: node prisma/seed_teachers.js
 *
 * 用途：补齐总校 / 浦东 / 静安 三个校区的教师账号；若库中已有课程，再补建一个示范班级与一节课表。
 * 清理范围：不清理任何数据，全部使用 upsert，可安全重复运行。
 * 插入内容：
 *   - 3 个教师（teacher1 王晓明 / teacher2 李丽华 / teacher3 张建国），对应 SysUser + EduTeacher
 *   - 如有课程存在：新增 1 个"前端进阶实战班" + 1 节 lesson_no=1 的示例课表
 * 前置依赖：schema 已迁移；课程数据可有可无。
 * 登录凭证：统一密码 123456
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 主流程：upsert 三个教师用户 + 档案；若库中已有课程则追加一个示例班级与排课
async function main() {
    console.log('Starting seed...');

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. 获取现有校区（基于 CAMPUS_ADMIN 的 campus_id）
    // 如果没有校区，我们创造一些虚拟的基础校区上下文
    // 注意：系统设计中权限校区关联在 SysUser.campus_id

    const campuses = [
        { id: 'C001', name: '总校区' },
        { id: 'C002', name: '浦东校区' },
        { id: 'C003', name: '静安校区' }
    ];

    // 2. 创建教师账号
    const teacherData = [
        { username: 'teacher1', name: '王晓明', dept: '教研部', campusId: 'C001', campusName: '总校区' },
        { username: 'teacher2', name: '李丽华', dept: '教务部', campusId: 'C002', campusName: '浦东校区' },
        { username: 'teacher3', name: '张建国', dept: '咨询部', campusId: 'C003', campusName: '静安校区' }
    ];

    for (const t of teacherData) {
        console.log(`Processing teacher: ${t.username}`);

        // Upsert SysUser
        const user = await prisma.sysUser.upsert({
            where: { username: t.username },
            update: {
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

        // Upsert EduTeacher
        await prisma.eduTeacher.upsert({
            where: { user_id: user.id },
            update: {
                name: t.name,
                department: t.dept
            },
            create: {
                name: t.name,
                department: t.dept,
                user_id: user.id
            }
        });
    }

    // 3. 关联排课数据 (如果存在课程)
    const courses = await prisma.edCourse.findMany({ take: 1 });
    if (courses.length > 0) {
        const course = courses[0];
        const teacher = await prisma.eduTeacher.findFirst({ where: { name: '王晓明' } });

        if (teacher) {
            console.log('Creating sample class and schedule...');
            const cls = await prisma.edClass.create({
                data: {
                    name: '前端进阶实战班',
                    capacity: 20,
                    enrolled: 5,
                    campus_id: 'C001',
                    status: 'ONGOING',
                    course_id: course.id,
                    teacher_id: teacher.id
                }
            });

            await prisma.edLessonSchedule.create({
                data: {
                    class_id: cls.id,
                    lesson_no: 1,
                    start_time: new Date(),
                    end_time: new Date(Date.now() + 3600000),
                    classroom: 'A101',
                    status: 'SCHEDULED'
                }
            });
        }
    } else {
        console.log('No courses found, skipping class/schedule seed.');
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
