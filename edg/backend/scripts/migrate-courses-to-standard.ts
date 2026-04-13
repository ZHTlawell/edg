/**
 * 一次性数据迁移：将所有未绑定标准的 EdCourse 转换为
 * 独立 LEGACY-{id} 占位标准，并强制绑定。
 *
 * 同时清理 is_standard 字段（schema 即将移除）。
 *
 * 使用：npx ts-node scripts/migrate-courses-to-standard.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_CATEGORY_NAME = '历史课程（迁移）';

async function ensureLegacyCategory(): Promise<string> {
    const existing = await prisma.stdCourseCategory.findUnique({
        where: { name: LEGACY_CATEGORY_NAME },
    });
    if (existing) return existing.id;

    const created = await prisma.stdCourseCategory.create({
        data: {
            name: LEGACY_CATEGORY_NAME,
            description: '从旧课程库迁移而来的占位分类，仅用于历史数据归档',
            sort_order: 999,
            status: 'ARCHIVED',
        },
    });
    console.log(`  ✓ 创建分类「${LEGACY_CATEGORY_NAME}」: ${created.id}`);
    return created.id;
}

async function migrateOrphanCourses(categoryId: string) {
    const orphanCourses = await prisma.edCourse.findMany({
        where: ({ standard_id: null } as any),
    });

    if (orphanCourses.length === 0) {
        console.log('  ✓ 无未绑定标准的课程，跳过');
        return;
    }

    console.log(`  发现 ${orphanCourses.length} 个未绑定标准的课程，开始迁移...`);
    let migrated = 0;

    for (const course of orphanCourses) {
        const code = `LEGACY-${course.id}`;

        // 防重：若已存在同 code 的标准，复用
        const existingStd = await prisma.stdCourseStandard.findUnique({
            where: { code },
        });

        let standardId: string;
        if (existingStd) {
            standardId = existingStd.id;
        } else {
            const std = await prisma.stdCourseStandard.create({
                data: {
                    code,
                    name: `[历史] ${course.name}`,
                    category_id: categoryId,
                    total_lessons: course.total_lessons,
                    lesson_duration: course.duration ?? 45,
                    status: 'ARCHIVED', // 不能用于新建课程
                    version: 1,
                    creator_id: 'SYSTEM_MIGRATION',
                    description: `由迁移脚本自动生成。原课程 ID: ${course.id}`,
                },
            });
            standardId = std.id;
        }

        await prisma.edCourse.update({
            where: { id: course.id },
            data: { standard_id: standardId },
        });
        migrated++;
    }
    console.log(`  ✓ 已迁移 ${migrated} 个课程到独立 LEGACY 占位标准`);
}

async function verifyAllBound() {
    const remaining = await prisma.edCourse.count({
        where: ({ standard_id: null } as any),
    });
    if (remaining > 0) {
        throw new Error(`迁移后仍有 ${remaining} 个课程未绑定标准！`);
    }
    console.log('  ✓ 所有课程均已绑定标准');
}

async function main() {
    console.log('===== 课程库 → 课程标准 迁移开始 =====\n');

    console.log('[1/3] 准备 LEGACY 分类...');
    const categoryId = await ensureLegacyCategory();

    console.log('\n[2/3] 迁移未绑定课程...');
    await migrateOrphanCourses(categoryId);

    console.log('\n[3/3] 校验...');
    await verifyAllBound();

    console.log('\n===== 迁移完成 =====');
}

main()
    .catch((e) => {
        console.error('迁移失败:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
