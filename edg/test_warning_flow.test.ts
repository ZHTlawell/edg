/**
 * 续费预警逻辑测试
 * 作用：验证 getLowBalanceAssetAccounts 在课时耗尽 / 续费后的正确触发与消除
 */
import { useStore } from './store.ts';

// 分 3 步演绎：初始充足 → 消课触发预警 → 续费消除预警
async function testRenewalWarningFlow() {
    console.log('--- 开始续费预警业务逻辑测试 ---');

    const studentId = 'STU_WARN_001';
    const courseId = 'COURSE_WARN_001';

    // 1. 初始化一个拥有 5 课时的学员（高于预警阈值 3）
    console.log('步骤 1: 初始化学员资产 (5 课时)...');
    useStore.getState().createOrder({
        studentId,
        courseId,
        classId: 'CLASS_001',
        campusId: '测试校区',
        lessons: 5,
        amount: 500,
        paymentMethod: '现金'
    });

    let warnings = useStore.getState().getLowBalanceAssetAccounts();
    console.log(`初始预警名单人数: ${warnings.length}`);
    if (warnings.some(w => w.studentId === studentId)) throw new Error('预警逻辑错误：课时充足时不应触发预警');

    // 2. 模拟消课，使余额降至 2 课时（触发预警）
    console.log('步骤 2: 模拟消课 (消耗 3 课时，剩余 2)...');
    // 直接操作 account 模拟消课
    const account = useStore.getState().assetAccounts.find(acc => acc.studentId === studentId && acc.courseId === courseId);
    if (account) {
        useStore.setState(state => ({
            assetAccounts: state.assetAccounts.map(acc =>
                acc.id === account.id ? { ...acc, remainingQty: 2 } : acc
            )
        }));
    }

    warnings = useStore.getState().getLowBalanceAssetAccounts();
    console.log(`消课后预警名单人数: ${warnings.length}`);
    const targetWarning = warnings.find(w => w.studentId === studentId);

    if (!targetWarning) throw new Error('预警触发失败：余额不足时未出现在名单中');
    console.log(`预警详情: 学员 ${targetWarning.studentName}, 课程 ${targetWarning.courseName}, 剩余课时 ${targetWarning.remainingQty}`);

    // 3. 模拟续费，课时增加后预警应消失
    console.log('步骤 3: 模拟续费 (增加 10 课时)...');
    useStore.getState().createOrder({
        studentId,
        courseId,
        classId: 'CLASS_001',
        campusId: '测试校区',
        lessons: 10,
        amount: 1000,
        paymentMethod: '微信支付'
    });

    warnings = useStore.getState().getLowBalanceAssetAccounts();
    console.log(`续费后预警名单人数: ${warnings.length}`);
    if (warnings.some(w => w.studentId === studentId)) throw new Error('预警消除失败：续费后仍显示在名单中');

    console.log('--- 续费预警业务逻辑测试通过! ---');
}

testRenewalWarningFlow().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
