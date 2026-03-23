
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- 正在清理旧演示数据 ---');
    // 注意：清理顺序（从叶子到根）
    await prisma.teachAttendance.deleteMany();
    await prisma.edLessonSchedule.deleteMany();
    await prisma.teachHomeworkSubmission.deleteMany();
    await prisma.teachHomework.deleteMany();
    await prisma.finAssetLedger.deleteMany();
    await prisma.finAssetAccount.deleteMany();
    await prisma.finPaymentRecord.deleteMany();
    await prisma.finOrder.deleteMany();
    await prisma.eduStudentInClass.deleteMany();
    await prisma.edClassAssignment.deleteMany();
    await prisma.edClass.deleteMany();
    await prisma.eduStudent.deleteMany();
    await prisma.eduTeacher.deleteMany();
    await prisma.edCourse.deleteMany();
    await prisma.sysUser.deleteMany();

    const passwordHash = await bcrypt.hash('123456', 10);

    console.log('--- 创建用户与基础数据 ---');

    // 1. 总部管理员
    const admin = await prisma.sysUser.create({
        data: {
            username: 'admin',
            password_hash: passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE'
        }
    });

    // 2. 校区管理员及校区 (Campus C1: 浦东校区)
    const adminC1 = await prisma.sysUser.create({
        data: {
            username: 'admin_c1',
            password_hash: passwordHash,
            role: 'CAMPUS_ADMIN',
            campus_id: 'CAMPUS_PUDONG',
            campusName: '浦东校区',
            status: 'ACTIVE'
        }
    });

    // 3. 教师 t1, t2
    const teacher1User = await prisma.sysUser.create({
        data: {
            username: 'teacher_t1',
            password_hash: passwordHash,
            role: 'TEACHER',
            campus_id: 'CAMPUS_PUDONG',
            campusName: '浦东校区',
            status: 'ACTIVE'
        }
    });
    const t1 = await prisma.eduTeacher.create({
        data: {
            name: '张明老师',
            department: '教学部',
            user_id: teacher1User.id
        }
    });

    const teacher2User = await prisma.sysUser.create({
        data: {
            username: 'teacher_t2',
            password_hash: passwordHash,
            role: 'TEACHER',
            campus_id: 'CAMPUS_PUDONG',
            campusName: '浦东校区',
            status: 'ACTIVE'
        }
    });
    const t2 = await prisma.eduTeacher.create({
        data: {
            name: '李华老师',
            department: '教研部',
            user_id: teacher2User.id
        }
    });

    // 4. 标准课程 (总部创建)
    const c1 = await prisma.edCourse.create({
        data: {
            name: '高级UI/UX设计实战',
            category: '设计',
            price: 4800,
            total_lessons: 32,
            is_standard: true,
            status: 'ENABLED',
            instructor_id: t1.id
        }
    });

    const c2 = await prisma.edCourse.create({
        data: {
            name: '全栈开发：React与NestJS',
            category: '编程',
            price: 6400,
            total_lessons: 48,
            is_standard: true,
            status: 'ENABLED',
            instructor_id: t2.id
        }
    });

    const c3 = await prisma.edCourse.create({
        data: {
            name: '零基础Python自动化',
            category: '编程',
            price: 2400,
            total_lessons: 24,
            is_standard: true,
            status: 'ENABLED',
            instructor_id: t1.id
        }
    });

    // 5. 班级 (校区端创建)
    const class1 = await prisma.edClass.create({
        data: {
            name: 'UI设计-2026春季1班',
            capacity: 20,
            campus_id: 'CAMPUS_PUDONG'
        }
    });

    const class2 = await prisma.edClass.create({
        data: {
            name: '全栈开发-周末班',
            capacity: 15,
            campus_id: 'CAMPUS_PUDONG'
        }
    });

    // 6. 分配课程与教师 (Assignments)
    const assign1 = await prisma.edClassAssignment.create({
        data: {
            class_id: class1.id,
            course_id: c1.id,
            teacher_id: t1.id,
            status: 'ACTIVE'
        }
    });

    const assign2 = await prisma.edClassAssignment.create({
        data: {
            class_id: class2.id,
            course_id: c2.id,
            teacher_id: t2.id,
            status: 'ACTIVE'
        }
    });

    // 7. 学生 s1, s2, s3
    const students = [
        { username: 'student_s1', name: '王小伟' },
        { username: 'student_s2', name: '陈晓红' },
        { username: 'student_s3', name: '李大壮' }
    ];

    for (const s of students) {
        const user = await prisma.sysUser.create({
            data: {
                username: s.username,
                password_hash: passwordHash,
                role: 'STUDENT',
                campus_id: 'CAMPUS_PUDONG',
                campusName: '浦东校区',
                status: 'ACTIVE'
            }
        });
        const profile = await prisma.eduStudent.create({
            data: {
                name: s.name,
                user_id: user.id,
                phone: s.username.replace('student_', '138'), // Mock phone
            }
        });

        // 默认加入 Class 1 (UI设计) 和 Class 2 (部分学生)
        await prisma.eduStudentInClass.create({
            data: { student_id: profile.id, class_id: class1.id }
        });

        // 给每个学生充值点课时 (Asset Accounts) 为了演示“我有课”
        await prisma.finAssetAccount.create({
            data: {
                student_id: profile.id,
                course_id: c1.id,
                campus_id: 'CAMPUS_PUDONG',
                total_qty: 32,
                remaining_qty: 32,
                status: 'ACTIVE'
            }
        });

        if (s.username !== 'student_s3') {
            await prisma.eduStudentInClass.create({
                data: { student_id: profile.id, class_id: class2.id }
            });
            await prisma.finAssetAccount.create({
                data: {
                    student_id: profile.id,
                    course_id: c2.id,
                    campus_id: 'CAMPUS_PUDONG',
                    total_qty: 48,
                    remaining_qty: 48,
                    status: 'ACTIVE'
                }
            });
        }
    }

    // 8. 课表 (Schedules)
    console.log('--- 生成课表数据 ---');
    const now = new Date();
    // 设为本周一
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    // 为 UI 课生成 2 周的课 (每周 3 节)
    const uiTimes = [
        { day: 0, hour: 10 }, { day: 2, hour: 14 }, { day: 4, hour: 10 }
    ];

    for (const weekStart of [monday, nextMonday]) {
        for (const [idx, t] of uiTimes.entries()) {
            const start = new Date(weekStart);
            start.setDate(weekStart.getDate() + t.day);
            start.setHours(t.hour, 0, 0, 0);
            
            const end = new Date(start);
            end.setHours(t.hour + 2);

            await prisma.edLessonSchedule.create({
                data: {
                    assignment_id: assign1.id,
                    lesson_no: (weekStart === monday ? 1 : 4) + idx,
                    start_time: start,
                    end_time: end,
                    classroom: '101 艺术教室',
                    status: 'PUBLISHED'
                }
            });
        }
    }

    // 为 编程 课生成 2 周的课 (每周 2 节)
    const devTimes = [
        { day: 1, hour: 18 }, { day: 3, hour: 18 }
    ];

    for (const weekStart of [monday, nextMonday]) {
        for (const [idx, t] of devTimes.entries()) {
            const start = new Date(weekStart);
            start.setDate(weekStart.getDate() + t.day);
            start.setHours(t.hour, 0, 0, 0);
            
            const end = new Date(start);
            end.setHours(t.hour + 2);

            await prisma.edLessonSchedule.create({
                data: {
                    assignment_id: assign2.id,
                    lesson_no: (weekStart === monday ? 1 : 3) + idx,
                    start_time: start,
                    end_time: end,
                    classroom: '502 软件实验室',
                    status: 'PUBLISHED'
                }
            });
        }
    }

    // 9. 作业 (Homework)
    console.log('--- 创建作业数据 ---');
    await prisma.teachHomework.create({
        data: {
            title: 'UI基础：临摹一个复杂卡片',
            content: '请临摹一个带有阴影、圆角和复杂渐变的订单卡片。',
            deadline: new Date(nextMonday),
            assignment_id: assign1.id,
            teacher_id: t1.id
        }
    });

    console.log('--- ✅ 演示数据创建成功！ ---');
    console.log('可用账号（密码均为 123456）:');
    console.log('- HQ Admin: admin');
    console.log('- Campus Admin: admin_c1');
    console.log('- Teacher: teacher_t1, teacher_t2');
    console.log('- Student: student_s1, student_s2, student_s3');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
