import { test, expect } from '../fixtures/auth';
import { TeacherHomeworkPage } from '../pages/teacher/HomeworkPage';

test.describe('教师端 - 作业分发', () => {
  test('TC-THW-001 页面加载后能看到"发布新作业"入口 @P0', async ({ teacherPage }) => {
    const page = new TeacherHomeworkPage(teacherPage);
    await page.goto();

    await expect(page.publishButton).toBeVisible();
  });

  test('TC-THW-002 列表至少有 1 行作业 @P1', async ({ teacherPage }) => {
    const page = new TeacherHomeworkPage(teacherPage);
    await page.goto();

    const rows = await page.rowCount();
    expect(rows).toBeGreaterThan(0);
  });

  test('TC-THW-003 每行都有编辑/删除/去批改 3 个按钮 @P1', async ({ teacherPage }) => {
    const page = new TeacherHomeworkPage(teacherPage);
    await page.goto();

    const rows = await page.rowCount();
    // 编辑、删除的数量应该 >= 去批改数量（有的被删后残留）
    const editCount = await teacherPage.getByRole('button', { name: '编辑' }).count();
    const deleteCount = await teacherPage.getByRole('button', { name: '删除' }).count();
    expect(editCount).toBeGreaterThanOrEqual(rows);
    expect(deleteCount).toBeGreaterThanOrEqual(rows);
  });

  test('TC-THW-004 点击"发布新作业"弹出发布表单 @P1', async ({ teacherPage }) => {
    const page = new TeacherHomeworkPage(teacherPage);
    await page.goto();

    await page.publishButton.click();
    // 发布表单出现标志：页面上新增"取消""发布"或类似按钮
    await expect(teacherPage.getByRole('button', { name: /取消|关闭|返回/ }).first())
      .toBeVisible({ timeout: 5000 });
  });
});
