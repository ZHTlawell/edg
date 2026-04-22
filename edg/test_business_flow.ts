/**
 * 业务链路自测脚本：考勤 → 确认消课 → 资产扣减 → 流水生成
 * 作用：校验"教师提交考勤 + 管理员确认消课"的全链路数据一致性
 */

import { useStore } from './store';

// 模拟测试环境
// 端到端执行一次考勤/消课流程，并断言剩余课时、扣课状态与流水记录
const testBusinessFlow = async () => {
    console.log('--- 开始业务链路自测 ---');

    // 1. 获取初始状态
    const state = useStore.getState();
    const studentId = 'S10001';
    const courseId = '1';
    const lessonId = 'TEST_LESSON_001';

    const initialAccount = state.assetAccounts.find(a => a.student_id === studentId && a.course_id === courseId);
    console.log(`初始状态: 学员 ${studentId}, 剩余课时: ${initialAccount?.remaining_qty}`);

    if (!initialAccount) {
        console.error('错误: 未找到初始账户数据');
        return;
    }

    // 2. 教师提交考勤
    console.log('\n步骤 1: 教师提交考勤...');
    state.submitAttendance(lessonId, courseId, 'C-001', 'C001', [
        { student_id: studentId, status: 'present', deductHours: 1.0 }
    ]);

    const afterAttendState = useStore.getState();
    const attendRecord = afterAttendState.attendanceRecords.find(r => r.lesson_id === lessonId && r.student_id === studentId);
    console.log(`考勤记录已生成: ID=${attendRecord?.id}, 状态=${attendRecord?.status}, 扣课状态=${attendRecord?.deductStatus}`);

    const afterAttendAccount = afterAttendState.assetAccounts.find(a => a.student_id === studentId && a.course_id === courseId);
    console.log(`检查余额 (此时不应扣减): ${afterAttendAccount?.remaining_qty}`);

    // 3. 确认为消课
    console.log('\n步骤 2: 确认消课 (触发逻辑核心)...');
    state.confirmConsumption(lessonId);

    const finalState = useStore.getState();
    const finalAccount = finalState.assetAccounts.find(a => a.student_id === studentId && a.course_id === courseId);
    const finalRecord = finalState.attendanceRecords.find(r => r.lesson_id === lessonId && r.student_id === studentId);
    const ledger = finalState.assetLedgers.find(l => l.refId === finalRecord?.id);

    console.log(`最终状态:`);
    console.log(`- 剩余课时: ${finalAccount?.remaining_qty} (预期: ${initialAccount.remaining_qty - 1})`);
    console.log(`- 扣课状态: ${finalRecord?.deductStatus} (预期: completed)`);
    console.log(`- 流水生成: ${ledger ? '成功' : '失败'}`);
    if (ledger) {
        console.log(`- 流水详情: 类型=${ledger.businessType}, 变动=${ledger.changeQty}, 快照余额=${ledger.balanceSnapshot}`);
    }

    // 4. 断言验证
    if (finalAccount?.remaining_qty === initialAccount.remaining_qty - 1 && finalRecord?.deductStatus === 'completed' && ledger) {
        console.log('\n✅ 业务链路自测通过！数据一致性验证成功。');
    } else {
        console.error('\n❌ 业务链路自测失败！请检查逻辑实现。');
    }
};

// 执行测试
testBusinessFlow();
