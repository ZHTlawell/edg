/**
 * 登录模块 E2E
 *
 * 用例规格参考 .web-e2e/testcases/login.md
 * 本文件直接用 Playwright 原生 test（不用 auth fixture），确保每条用例从未登录态开始。
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TEST_ACCOUNTS, type RoleKey } from '../fixtures/test-accounts';

// 确保每个 test 跑在全新 context，彼此不串台
test.use({ storageState: { cookies: [], origins: [] } });

const ROLES: RoleKey[] = ['admin', 'campus_admin', 'teacher', 'student'];

test.describe('登录模块', () => {
  test.describe('UI 测试', () => {
    test('TC-LOGIN-U01 未登录打开页面能看到 4 个角色 Tab + 用户名/密码/登录按钮 @P0', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();

      for (const role of ROLES) {
        await expect(login.tab(role)).toBeVisible();
      }
      await expect(login.usernameInput).toBeVisible();
      await expect(login.passwordInput).toBeVisible();
      await expect(login.submitButton).toBeVisible();
    });

    test('TC-LOGIN-S01 密码输入为 type=password 不明文显示 @P2', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();

      const type = await login.passwordInput.getAttribute('type');
      expect(type).toBe('password');
    });
  });

  test.describe('功能测试 - 4 角色正确登录', () => {
    for (const role of ROLES) {
      test(`TC-LOGIN-F ${role} 正确账号能登录 @P0`, async ({ page }) => {
        const { username, password } = TEST_ACCOUNTS[role];
        const login = new LoginPage(page);
        await login.goto();

        await login.login(role, username, password);
        await login.expectLandedAs(role);
      });
    }

    test('TC-LOGIN-F05 登录后刷新仍保持登录态 @P1', async ({ page }) => {
      const login = new LoginPage(page);
      const { username, password } = TEST_ACCOUNTS.admin;
      await login.goto();
      await login.login('admin', username, password);
      await login.expectLandedAs('admin');

      await page.reload();
      await login.expectLandedAs('admin');
    });
  });

  test.describe('边界测试', () => {
    test('TC-LOGIN-B01 用户名留空点登录应被拒绝 @P1', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.selectRole('admin');
      await login.passwordInput.fill('123456');
      await login.submit();
      await login.expectLoginRejected();
    });

    test('TC-LOGIN-B02 密码留空点登录应被拒绝 @P1', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.selectRole('admin');
      await login.usernameInput.fill('admin');
      await login.submit();
      await login.expectLoginRejected();
    });
  });

  test.describe('负向测试', () => {
    test('TC-LOGIN-N01 错误密码应提示"无效的用户名或密码" @P0', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login('admin', 'admin', 'wrongpassword');

      await expect(page.getByText(/无效的用户名或密码|密码错误|登录失败/))
        .toBeVisible({ timeout: 5_000 });
      await login.expectLoginRejected();
    });

    // TC-LOGIN-N03: 现行后端没有按角色 Tab 做匹配校验 —— admin 账号在学员端 Tab 也能登录，
    // 落地到自己的角色首页。这里用"锚定测试"固化现状，防止未来无感知回归。
    // ⚠️ 若产品决策是"Tab 必须匹配角色"，这是一个需修复的缺陷（本 spec 会翻红提示）。
    test('TC-LOGIN-N03 [现状锚定] admin 账号选学员端 Tab 仍会以 admin 身份登录 @P1', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login('student', 'admin', '123456');
      // 当前后端不做 Tab 校验，实际仍按 admin 身份进入
      await login.expectLandedAs('admin');
    });
  });

  test.describe('集成测试', () => {
    test('TC-LOGIN-I01 登录后退出再登录能正常回到工作台 @P1', async ({ page }) => {
      const login = new LoginPage(page);
      const { username, password } = TEST_ACCOUNTS.admin;
      await login.goto();
      await login.login('admin', username, password);
      await login.expectLandedAs('admin');

      // 退出（总部端的"退出登录"在顶部 header，不在 aside 里）
      await page.getByRole('button', { name: '退出登录' }).click();
      await expect(login.submitButton).toBeVisible({ timeout: 5_000 });

      // 再登录
      await login.login('admin', username, password);
      await login.expectLandedAs('admin');
    });
  });
});
