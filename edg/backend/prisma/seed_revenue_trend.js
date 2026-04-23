/**
 * seed_revenue_trend.js - 注入营收趋势演示数据（近 12 个月）
 *
 * 作用：为总部端"营收趋势（按月）"图表生成分布合理、呈上升趋势的 PAID 订单数据。
 * 解决问题：原有种子数据里 PAID 订单主要集中在最近 1-2 个月，
 *          导致 12 个月柱图绝大多数月份为 0，图表看起来全零。
 *
 * 策略：
 *  - 近 12 个月（含当月），每月投放 6~14 笔 PAID 订单
 *  - 金额围绕课程 price 浮动，配合一条温和的增长曲线（月度系数 0.6 → 1.4）
 *  - 学员 / 课程从现有真实数据中随机挑选，不新建实体
 *  - 跳过当前所有 FinOrder 中 createdAt ≥ 12 个月前的已存在订单（幂等：不会重复插入同月过量）
 *
 * 使用：node prisma/seed_revenue_trend.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** 返回指定 (offsetBack) 个月前的某一天随机 Date */
function randomDateInMonth(monthOffsetBack) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffsetBack, 1);
    d.setDate(Math.floor(Math.random() * 27) + 1);
    d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
    return d;
}

/** 月份 YYYY-MM key */
function ymKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function main() {
    console.log('💰 开始注入营收趋势演示数据...\n');

    const students = await prisma.eduStudent.findMany({ select: { id: true } });
    const courses = await prisma.edCourse.findMany({ select: { id: true, price: true, total_lessons: true } });

    if (students.length === 0 || courses.length === 0) {
        console.log('❌ 缺少学员 / 课程，无法生成订单。请先执行 master_seed');
        return;
    }

    // 统计现有每月订单数，用作"该月已有订单则少补"的参考
    const existing = await prisma.finOrder.findMany({
        where: { status: 'PAID' },
        select: { createdAt: true }
    });
    const existingPerMonth = new Map();
    existing.forEach(o => {
        const k = ymKey(new Date(o.createdAt));
        existingPerMonth.set(k, (existingPerMonth.get(k) || 0) + 1);
    });

    let totalInserted = 0;

    // 12 个月，数组下标 0=11 个月前，11=当月
    // 轻微增长曲线：0.6 → 1.4（倍率）
    const growthFactors = Array.from({ length: 12 }, (_, i) => 0.6 + (0.8 * i) / 11);
    // 目标每月订单数（在增长基础上再 6~14 随机）
    const targets = growthFactors.map(f => Math.round((6 + Math.random() * 8) * f));

    for (let i = 0; i < 12; i++) {
        const monthsBack = 11 - i; // i=0 -> 11个月前；i=11 -> 当月
        const sample = randomDateInMonth(monthsBack);
        const key = ymKey(sample);

        const already = existingPerMonth.get(key) || 0;
        const need = Math.max(0, targets[i] - already);
        if (need === 0) {
            console.log(`  • ${key} 已有 ${already} 笔，跳过`);
            continue;
        }

        for (let j = 0; j < need; j++) {
            const student = students[Math.floor(Math.random() * students.length)];
            const course = courses[Math.floor(Math.random() * courses.length)];

            // 金额：课程 price ± 20% 抖动
            const basePrice = course.price || 3980;
            const amount = Math.round(basePrice * (0.8 + Math.random() * 0.4));

            const createdAt = randomDateInMonth(monthsBack);

            try {
                const order = await prisma.finOrder.create({
                    data: {
                        student_id: student.id,
                        course_id: course.id,
                        amount,
                        total_qty: course.total_lessons || 20,
                        status: 'PAID',
                        createdAt,
                    }
                });
                await prisma.finPaymentRecord.create({
                    data: {
                        order_id: order.id,
                        amount,
                        channel: ['WECHAT', 'ALIPAY', 'OFFLINE'][Math.floor(Math.random() * 3)],
                        status: 'SUCCESS',
                        createdAt,
                    }
                });
                totalInserted++;
            } catch (err) {
                // 外键/唯一约束失败时跳过单条，继续
                console.warn(`   ⚠️ 插入单条失败：${err.code || err.message}`);
            }
        }

        console.log(`  ✅ ${key}: 新增 ${need} 笔（目标 ${targets[i]}，已有 ${already}）`);
    }

    console.log(`\n🎉 完成！共新增 ${totalInserted} 笔 PAID 订单（分布近 12 个月）`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
