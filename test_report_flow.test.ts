import { useStore } from './store.ts';

async function testReportExportLogic() {
    console.log('--- 开始报表导出数据聚合逻辑测试 ---');

    const state = useStore.getState();

    // 1. 获取订单导出数据
    console.log('步骤 1: 获取全部校区订单导出数据...');
    const orderData = state.getExportData('orders');
    console.log(`获取到 ${orderData.length} 条订单记录`);

    if (orderData.length > 0) {
        const first = orderData[0];
        console.log(`第一条记录详情: 订单号 ${first.id}, 学员 ${first.studentName}, 课程 ${first.courseName}, 金额 ${first.amount}`);
        if (!first.studentName || first.studentName === '未知') {
            throw new Error('聚合失败：未正确关联学员名称');
        }
    }

    // 2. 验证过滤逻辑 (按关键字)
    console.log('步骤 2: 验证关键字过滤 (搜索 "张美玲")...');
    const filtered = state.getExportData('orders', { keyword: '张美玲' });
    console.log(`关键字过滤结果数: ${filtered.length}`);
    if (filtered.length > 0 && !filtered.every(o => o.studentName.includes('张美玲'))) {
        throw new Error('过滤失败：关键字匹配不准确');
    }

    // 3. 模拟 UI 中的统计逻辑
    console.log('步骤 3: 模拟报表统计汇总...');
    const totalAmount = orderData.reduce((acc, curr) => acc + curr.amount, 0);
    console.log(`导出数据总金额: ¥ ${totalAmount}`);

    // 校验订单总数是否与 store 一致
    if (orderData.length !== state.orders.length) {
        throw new Error('数据不一致：导出记录数与 Store 订单数不符');
    }

    console.log('--- 报表导出数据聚合逻辑测试通过! ---');
}

testReportExportLogic().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
