/**
 * 一次性数据修复脚本：
 *   1. 回填 EdLessonSchedule.course_id（从 assignment 取）
 *   2. 同步 EdClass.enrolled（基于 EduStudentInClass count）
 *
 * 使用：npx ts-node scripts/repair-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 为 course_id 为 null 的 EdLessonSchedule 从其 assignment 取 course_id 回填
async function backfillScheduleCourseId() {
    console.log('[1/2] 回填 EdLessonSchedule.course_id ...');
    const schedules = await prisma.edLessonSchedule.findMany({
        where: { course_id: null },
        include: { assignment: true },
    });
    let updated = 0;
    for (const s of schedules) {
        if (s.assignment?.course_id) {
            await prisma.edLessonSchedule.update({
                where: { id: s.id },
                data: { course_id: s.assignment.course_id },
            });
            updated++;
        }
    }
    console.log(`    ✓ 共处理 ${schedules.length} 条，成功回填 ${updated} 条`);
}

// 根据实际 EduStudentInClass 条数同步每个 EdClass.enrolled 字段，修复计数漂移
async function syncAllClassEnrolled() {
    console.log('[2/2] 同步 EdClass.enrolled ...');
    const classes = await prisma.edClass.findMany({ select: { id: true, enrolled: true } });
    let fixed = 0;
    for (const cls of classes) {
        const count = await prisma.eduStudentInClass.count({ where: { class_id: cls.id } });
        if (count !== cls.enrolled) {
            await prisma.edClass.update({ where: { id: cls.id }, data: { enrolled: count } });
            fixed++;
        }
    }
    console.log(`    ✓ 共检查 ${classes.length} 个班级，修复 ${fixed} 个不一致`);
}

// 主流程：顺序执行两步修复任务
async function main() {
    console.log('=== 数据修复开始 ===');
    await backfillScheduleCourseId();
    await syncAllClassEnrolled();
    console.log('=== 数据修复完成 ===');
}

main()
    .catch((e) => {
        console.error('修复失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
