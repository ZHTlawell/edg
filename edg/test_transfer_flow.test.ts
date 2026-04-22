/**
 * 学员转班链路测试
 * 作用：验证 transferClass 能正确更新学员班级并写入审计流水
 */
import { useStore } from './store.ts';

// 构造新班级 → 执行转班 → 断言班级变更与 assetLedger 流水生成
async function testTransferClassFlow() {
    console.log('--- 开始学员转班业务逻辑测试 ---');

    const studentId = 'S10001'; // 张美玲
    const initialState = useStore.getState();
    const student = initialState.students.find(s => s.id === studentId);
    console.log(`初始状态: 学员 ${student?.name}, 当前班级 ${student?.className}`);

    // 1. 执行转班 (转入同课程的其他班级，演示逻辑一致性)
    // 虽然初始数据中同课程只有一个班，我们模拟创建一个新班级进行测试
    console.log('步骤 1: 创建新班级并模拟转班...');
    const newClassId = 'C-TEST-999';
    useStore.setState(state => ({
        classes: [
            ...state.classes,
            {
                id: newClassId,
                name: 'UI设计进阶2班',
                campus_id: '总校区',
                course_id: '1',
                courseName: '高级UI/UX设计实战',
                teacher_id: 'T10001',
                teacherName: '陈老师',
                capacity: 30,
                enrolled: 0,
                status: 'ongoing',
                createdAt: new Date().toISOString()
            }
        ]
    }));

    useStore.getState().transferClass(studentId, 'ACC-001', newClassId);

    const updatedState = useStore.getState();
    const updatedStudent = updatedState.students.find(s => s.id === studentId);
    console.log(`转班后状态: 班级已变更为 ${updatedStudent?.class_id}`);

    if (updatedStudent?.class_id !== newClassId) {
        throw new Error('转班失败：学生班级属性未更新');
    }

    // 2. 检查流水记录
    const ledger = updatedState.assetLedgers.find(l => l.refId === `TRANS-TO-${newClassId}`);
    if (!ledger) {
        throw new Error('转班失败：未生成审计流水记录');
    }
    console.log(`流水记录验证成功: ID ${ledger.id}, 业务类型 ${ledger.businessType}, 参考号 ${ledger.refId}`);

    console.log('--- 学员转班业务逻辑测试通过! ---');
}

testTransferClassFlow().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
