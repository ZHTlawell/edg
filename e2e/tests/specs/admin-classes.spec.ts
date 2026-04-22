import { test, expect } from '../fixtures/auth';
import { AdminClassesPage } from '../pages/admin/ClassesPage';

test.describe('管理员 - 班级管理', () => {
  test('TC-CLS-001 页面加载后能看到校区筛选和开班按钮 @P0', async ({ adminPage }) => {
    const page = new AdminClassesPage(adminPage);
    await page.goto();

    await expect(page.campusSelect).toBeVisible();
    await expect(page.createClassButton).toBeVisible();
  });

  test('TC-CLS-002 点击"开班"按钮不报错 @P1', async ({ adminPage }) => {
    const page = new AdminClassesPage(adminPage);
    await page.goto();

    // TODO: 等"开班"弹窗的数据契约确定后再加具体断言。目前只保证按钮可点击、点击后页面不崩。
    await page.createClassButton.click();
    await adminPage.waitForTimeout(500);
    await expect(adminPage.locator('aside')).toBeVisible();
  });
});
