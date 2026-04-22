/**
 * Edg1 冒烟测试：每个角色能登录进系统、看到自己的主入口
 */
import { test, expect } from '../fixtures/auth';

test.describe('Edg1 冒烟 @P0 @smoke', () => {
  test('TC-SMOKE-001 admin 进入工作台概览', async ({ adminPage }) => {
    await adminPage.goto('/');
    await expect(adminPage.getByRole('button', { name: '工作台概览' })).toBeVisible();
  });

  test('TC-SMOKE-002 campus_admin 进入教务组织', async ({ campusPage }) => {
    await campusPage.goto('/');
    await expect(campusPage.getByRole('button', { name: '教务组织' })).toBeVisible();
  });

  test('TC-SMOKE-003 teacher 进入今日教学', async ({ teacherPage }) => {
    await teacherPage.goto('/');
    await expect(teacherPage.getByRole('button', { name: '今日教学' })).toBeVisible();
  });

  test('TC-SMOKE-004 student 进入学生首页', async ({ studentPage }) => {
    await studentPage.goto('/');
    await expect(studentPage.getByRole('button', { name: '学生首页' })).toBeVisible();
  });
});
