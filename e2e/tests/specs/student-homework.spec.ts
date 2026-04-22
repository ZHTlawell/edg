import { test, expect } from '../fixtures/auth';
import { StudentHomeworkPage } from '../pages/student/HomeworkPage';

test.describe('学生端 - 我的作业', () => {
  test('TC-SHW-001 页面加载后 4 个 Tab 可见 @P0', async ({ studentPage }) => {
    const page = new StudentHomeworkPage(studentPage);
    await page.goto();

    await expect(page.tabAll).toBeVisible();
    await expect(page.tabTodo).toBeVisible();
    await expect(page.tabGrading).toBeVisible();
    await expect(page.tabGraded).toBeVisible();
  });

  test('TC-SHW-002 切换"待提交" Tab 展示未交作业 @P1', async ({ studentPage }) => {
    const page = new StudentHomeworkPage(studentPage);
    await page.goto();

    await page.switchTab('待提交');
    // 待提交至少应出现一个"去完成作业"按钮
    await expect(page.doHomeworkButtonAt(0)).toBeVisible({ timeout: 5000 });
  });

  test('TC-SHW-003 切换"已批改" Tab 页面仍稳定 @P2', async ({ studentPage }) => {
    const page = new StudentHomeworkPage(studentPage);
    await page.goto();

    await page.switchTab('已批改');
    // 只断言不崩即可；具体内容依赖种子数据
    await expect(page.tabGraded).toBeVisible();
  });
});
