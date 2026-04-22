import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * 登录页 POM。
 *
 * 不继承 BasePage，因为登录前 Sidebar 不存在，不适用"点击侧栏导航"的模型。
 */
export const ROLE_TAB: Record<string, string> = {
  admin: '总部端',
  campus_admin: '分校端',
  teacher: '教师端',
  student: '学员端',
};

export const LANDING_LABEL: Record<string, string> = {
  admin: '工作台概览',
  campus_admin: '教务组织',
  teacher: '今日教学',
  student: '学生首页',
};

export class LoginPage {
  constructor(private page: Page) {}

  // 学员端 Tab 会把"输入工号或账号"换成"请输入手机号"，所以用组合正则
  get usernameInput() { return this.page.getByPlaceholder(/输入工号或账号|请输入手机号/); }
  get passwordInput() { return this.page.getByPlaceholder('请输入登录密码'); }
  get submitButton()  { return this.page.getByRole('button', { name: '登录' }); }
  get forgotLink()    { return this.page.getByRole('button', { name: '忘记密码?' }); }

  tab(role: keyof typeof ROLE_TAB) {
    return this.page.getByRole('button', { name: ROLE_TAB[role] });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.submitButton).toBeVisible({ timeout: 10_000 });
  }

  async selectRole(role: keyof typeof ROLE_TAB) {
    await this.tab(role).click();
  }

  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(role: keyof typeof ROLE_TAB, username: string, password: string) {
    await this.selectRole(role);
    await this.fillCredentials(username, password);
    await this.submit();
  }

  /** 登录成功判断：Sidebar 出现 + 落地视图对应按钮 */
  async expectLandedAs(role: keyof typeof LANDING_LABEL) {
    await expect(this.page.locator('aside')).toBeVisible({ timeout: 10_000 });
    await expect(
      this.page.locator('aside').getByRole('button', { name: LANDING_LABEL[role] })
    ).toBeVisible();
  }

  /** 登录失败判断：仍在登录页 + 错误提示可见（或 submit 按钮仍在） */
  async expectLoginRejected() {
    await expect(this.submitButton).toBeVisible({ timeout: 5_000 });
    // Sidebar 不应出现
    await expect(this.page.locator('aside')).toHaveCount(0);
  }
}
