import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
    const PHONE = '14718035679';

    // 1. 找学员档案
    const student = await p.eduStudent.findUnique({
        where: { phone: PHONE },
        include: {
            user: { select: { username: true, status: true, campusName: true, campus_id: true, createdAt: true } },
            classes: {
                include: {
                    class: { include: { assignments: { include: { course: true, teacher: true } } } }
                }
            },
            accounts: { include: { course: true, ledgers: { orderBy: { occurTime: 'desc' } } } },
            orders: {
                orderBy: { createdAt: 'desc' },
                include: { course: true, payments: true }
            },
            attendances: {
                include: {
                    lesson: {
                        include: {
                            assignment: { include: { course: true, class: true } }
                        }
                    }
                }
            }
        }
    });

    if (!student) {
        console.log(`❌ 未找到手机号 ${PHONE} 对应的学员`);
        await p.$disconnect();
        return;
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('一、学员档案');
    console.log('═══════════════════════════════════════════════════');
    console.log(`学员 ID:    ${student.id}`);
    console.log(`姓名:       ${student.name}`);
    console.log(`手机号:     ${student.phone}`);
    console.log(`性别:       ${student.gender || '-'}`);
    console.log(`学员状态:   ${student.status}`);
    console.log(`钱包余额:   ${student.balance}`);
    console.log(`注册时间:   ${student.createdAt.toISOString()}`);
    console.log(`账号:       ${student.user.username}`);
    console.log(`账号状态:   ${student.user.status}`);
    console.log(`所在校区:   ${student.user.campusName} (${student.user.campus_id})`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`二、订单 (${student.orders.length} 条)`);
    console.log('═══════════════════════════════════════════════════');
    for (const o of student.orders) {
        console.log(`订单 ${o.id.slice(0, 8)}  课程：${o.course.name}`);
        console.log(`  金额: ¥${o.amount}  课时: ${o.total_qty}  状态: ${o.status}  来源: ${o.order_source}`);
        console.log(`  创建: ${o.createdAt.toISOString()}`);
        if (o.payments.length > 0) {
            o.payments.forEach(pay => {
                console.log(`  支付: ¥${pay.amount} (${pay.channel}) ${pay.status} @ ${pay.createdAt.toISOString()}`);
            });
        } else {
            console.log(`  ⚠️  未支付`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`三、课时资产账户 (${student.accounts.length} 个)`);
    console.log('═══════════════════════════════════════════════════');
    for (const a of student.accounts) {
        console.log(`账户 ${a.id.slice(0, 8)}  课程：${a.course.name}`);
        console.log(`  总课时: ${a.total_qty}  剩余: ${a.remaining_qty}  锁定: ${a.locked_qty}  已退: ${a.refunded_qty}  状态: ${a.status}`);
        console.log(`  最近账本（最多 5 条）:`);
        a.ledgers.slice(0, 5).forEach(l => {
            console.log(`    [${l.occurTime.toISOString().slice(0, 19)}] ${l.type.padEnd(15)} change=${l.change_qty}  snapshot=${l.balance_snapshot}`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`四、入班记录 (${student.classes.length} 个班级)`);
    console.log('═══════════════════════════════════════════════════');
    const classIds: string[] = [];
    for (const c of student.classes) {
        classIds.push(c.class.id);
        console.log(`班级 ${c.class.id.slice(0, 8)}  ${c.class.name}`);
        console.log(`  容量: ${c.class.enrolled}/${c.class.capacity}  状态: ${c.class.status}  校区: ${c.class.campus_id}`);
        console.log(`  入班时间: ${c.enrolledAt.toISOString()}`);
        c.class.assignments.forEach(a => {
            console.log(`  分配: 课程 ${a.course.name}  教师 ${a.teacher.name}  分配状态: ${a.status}`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('五、课表');
    console.log('═══════════════════════════════════════════════════');

    // 通过班级找该学员的全部课次
    const assignments = await p.edClassAssignment.findMany({
        where: { class_id: { in: classIds } },
        include: {
            course: true,
            teacher: true,
            class: true,
            schedules: { orderBy: { start_time: 'asc' } }
        }
    });

    let totalLessons = 0;
    for (const a of assignments) {
        console.log(`班级 "${a.class.name}" / 课程 "${a.course.name}" / 教师 ${a.teacher.name}`);
        console.log(`  共 ${a.schedules.length} 节课`);
        totalLessons += a.schedules.length;
        const today = new Date();
        const upcoming = a.schedules.filter(s => s.start_time >= today).slice(0, 5);
        const past = a.schedules.filter(s => s.start_time < today);
        console.log(`  已过期: ${past.length} 节  | 未来: ${a.schedules.length - past.length} 节`);
        if (upcoming.length > 0) {
            console.log(`  最近 5 节未来课:`);
            upcoming.forEach(s => {
                console.log(`    第${String(s.lesson_no).padStart(2, '0')}节 ${s.start_time.toISOString().slice(0, 16)} → ${s.end_time.toISOString().slice(11, 16)}  教室: ${s.classroom || '待分配'}  状态: ${s.status}  is_consumed: ${s.is_consumed}`);
            });
        }
        // 显示最近 3 节已结束的
        const recentPast = past.slice(-3);
        if (recentPast.length > 0) {
            console.log(`  最近 3 节已结束课:`);
            recentPast.forEach(s => {
                console.log(`    第${String(s.lesson_no).padStart(2, '0')}节 ${s.start_time.toISOString().slice(0, 16)}  状态: ${s.status}  is_consumed: ${s.is_consumed}`);
            });
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`六、考勤记录 (${student.attendances.length} 条)`);
    console.log('═══════════════════════════════════════════════════');
    student.attendances.slice(0, 10).forEach(att => {
        console.log(`  课次 ${att.lesson.lesson_no}  课程 ${att.lesson.assignment.course.name}  状态: ${att.status}  扣课时: ${att.deduct_amount}  扣费状态: ${att.deduct_status}`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('七、异常点分析');
    console.log('═══════════════════════════════════════════════════');
    const issues: string[] = [];

    // 检查1: 订单与资产账户对应
    const paidOrders = student.orders.filter(o => o.status === 'PAID' || o.status === 'PARTIAL_REFUNDED' || o.status === 'REFUNDED');
    if (paidOrders.length !== student.accounts.length) {
        issues.push(`❌ 订单数(${paidOrders.length} 已支付) ≠ 资产账户数(${student.accounts.length})`);
    }

    // 检查2: 资产账户的课程是否对应入班
    for (const acc of student.accounts) {
        const inClass = student.classes.some(c =>
            c.class.assignments.some(a => a.course_id === acc.course_id)
        );
        if (acc.status === 'ACTIVE' && !inClass) {
            issues.push(`❌ 课程 "${acc.course.name}" 已购买但未入班`);
        }
    }

    // 检查3: 入班但没课表
    for (const a of assignments) {
        if (a.schedules.length === 0) {
            issues.push(`❌ 班级 "${a.class.name}" / 课程 "${a.course.name}" 没有任何课表`);
        } else if (a.schedules.length < (a.course.total_lessons || 0)) {
            issues.push(`⚠️  班级 "${a.class.name}" / 课程 "${a.course.name}" 课表只有 ${a.schedules.length} 节，课程应有 ${a.course.total_lessons} 节`);
        }
    }

    // 检查4: 资产剩余课时 vs 课表未上数
    for (const acc of student.accounts) {
        const remainingScheduled = assignments
            .filter(a => a.course_id === acc.course_id)
            .reduce((sum, a) => sum + a.schedules.filter(s => !s.is_consumed).length, 0);
        if (remainingScheduled !== acc.remaining_qty) {
            issues.push(`⚠️  课程 "${acc.course.name}"：账户剩余 ${acc.remaining_qty} 课时，但课表未上 ${remainingScheduled} 节（差 ${Math.abs(remainingScheduled - acc.remaining_qty)}）`);
        }
    }

    // 检查5: 课表时间冲突
    const allSched = assignments.flatMap(a => a.schedules.map(s => ({ ...s, course: a.course.name })));
    allSched.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    for (let i = 1; i < allSched.length; i++) {
        if (allSched[i].start_time < allSched[i - 1].end_time) {
            issues.push(`❌ 课表时间冲突：${allSched[i - 1].course} (${allSched[i - 1].start_time.toISOString().slice(0, 16)}) ↔ ${allSched[i].course} (${allSched[i].start_time.toISOString().slice(0, 16)})`);
        }
    }

    if (issues.length === 0) {
        console.log('✅ 无异常');
    } else {
        issues.forEach(s => console.log(s));
    }

    await p.$disconnect();
})();
