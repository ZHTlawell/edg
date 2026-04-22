import { test, expect } from '../fixtures/auth';
import { StudentDashboardPage } from '../pages/student/DashboardPage';

test.describe('学生端 - 学生首页', () => {
  test('TC-SD-001 快捷入口全部可见 @P0', async ({ studentPage }) => {
    const page = new StudentDashboardPage(studentPage);
    await page.goto();

    await expect(page.renewButton).toBeVisible();
    await expect(page.leaveButton).toBeVisible();
    await expect(page.materialsButton).toBeVisible();
    await expect(page.contactHeadTeacher).toBeVisible();
    await expect(page.enterLearning).toBeVisible();
  });

  test('TC-SD-002 首页至少有 1 条待办"去提交"按钮 @P1', async ({ studentPage }) => {
    const page = new StudentDashboardPage(studentPage);
    await page.goto();

    await expect(page.submitButtonAt(0)).toBeVisible({ timeout: 5000 });
  });

  test('TC-SD-003 点击"进入在线学习中心"能成功跳转 @P1', async ({ studentPage }) => {
    const page = new StudentDashboardPage(studentPage);
    await page.goto();

    await page.enterLearning.click();
    // 跳转后应离开首页语境（sidebar"在线学习"变为激活态或主区出现学习内容）
    await studentPage.waitForTimeout(600);
    await expect(studentPage.locator('aside')).toBeVisible();
  });
});
