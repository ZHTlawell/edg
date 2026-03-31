
import { useStore } from './store.ts';

async function testSelfEnrollmentFlow() {
    console.log('--- 开始学员自助购课业务逻辑测试 ---');

    const studentId = 'S10001'; // 张美玲
    const courseId = '2';      // 全栈开发：从入门到架构
    const initialState = useStore.getState();

    const initialAsset = initialState.assetAccounts.find(a => a.studentId === studentId && a.courseId === courseId);
    const initialQty = initialAsset ? initialAsset.remainingQty : 0;
    console.log(`初始状态: 学员 ${studentId}, 课程 ${courseId} 剩余课时: ${initialQty}`);

    // 1. 执行自助购课
    console.log('步骤 1: 模拟学员点击“立即选购”...');
    const course = initialState.courses.find(c => c.id === courseId);
    if (!course) throw new Error('未找到指定测试课程');

    const amount = parseFloat(course.price.replace(/[^\d.]/g, ''));

    initialState.createOrder({
        studentId: studentId,
        courseId: course.id,
        classId: 'C-TBD',
        campusId: '总校区',
        lessons: course.totalLessons,
        amount: amount,
        paymentMethod: '余额支付',
        notes: '自动化测试下单'
    });

    const updatedState = useStore.getState();

    // 2. 校验资产更新
    const updatedAsset = updatedState.assetAccounts.find(a => a.studentId === studentId && a.courseId === courseId);
    const finalQty = updatedAsset ? updatedAsset.remainingQty : 0;
    console.log(`购课后状态: 剩余课时变更为 ${finalQty}`);

    if (finalQty !== initialQty + course.totalLessons) {
        throw new Error(`资产更新不正确！期望 ${initialQty + course.totalLessons}, 实际 ${finalQty}`);
    }

    // 3. 校验订单流水
    const latestOrder = updatedState.orders[updatedState.orders.length - 1];
    console.log(`最新订单校验: ID ${latestOrder.id}, 状态 ${latestOrder.status}, 学员 ${latestOrder.studentId}`);

    if (latestOrder.studentId !== studentId || latestOrder.courseId !== courseId) {
        throw new Error('订单数据记录错误');
    }

    console.log('--- 学员自助购课业务逻辑测试通过! ---');
}

testSelfEnrollmentFlow().catch(err => {
    console.error('测试结果: FAILED');
    console.error(err);
    process.exit(1);
});
