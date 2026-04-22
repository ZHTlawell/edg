import { test, expect } from '../fixtures/auth';
import { StudentSchedulePage } from '../pages/student/SchedulePage';

test.describe('学生端 - 我的课表', () => {
  test('TC-SS-001 页面加载后能看到刷新按钮 @P0', async ({ studentPage }) => {
    const page = new StudentSchedulePage(studentPage);
    await page.goto();

    await expect(page.refreshButton).toBeVisible();
  });

  test('TC-SS-002 点击刷新不报错 @P1', async ({ studentPage }) => {
    const page = new StudentSchedulePage(studentPage);
    await page.goto();

    await page.refreshButton.click();
    await studentPage.waitForTimeout(500);
    await expect(page.refreshButton).toBeVisible();
  });
});
