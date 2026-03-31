
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
