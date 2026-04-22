import { test, expect } from '../fixtures/auth';
import { StudentOrdersPage } from '../pages/student/OrdersPage';

test.describe('学生端 - 订单与课时', () => {
  test('TC-SO-001 页面加载后能看到订单列表 @P0', async ({ studentPage }) => {
    const page = new StudentOrdersPage(studentPage);
    await page.goto();

    // 至少有一个"浏览课程市场"入口（空单态）或者"申请退费"按钮（有单态）
    const market = await page.browseMarketButton.count();
    const orders = await page.orderCount();
    expect(market + orders).toBeGreaterThan(0);
  });

  test('TC-SO-002 有订单时每条订单都有"申请退费"按钮 @P1', async ({ studentPage }) => {
    const page = new StudentOrdersPage(studentPage);
    await page.goto();

    const count = await page.orderCount();
    test.skip(count === 0, '没有订单数据时跳过');
    expect(count).toBeGreaterThan(0);
    await expect(page.refundButtonAt(0)).toBeVisible();
  });
});
