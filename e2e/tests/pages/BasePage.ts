import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Edg1 的导航是状态驱动（App.tsx 内 useState(activeView)），
 * 因此 BasePage 提供统一的"点击 Sidebar 按钮"导航方法。
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /** Sidebar 中要点击到的主按钮 label */
  abstract readonly navLabel: string;
  /** 若该视图藏在某个折叠分组下，先展开它 */
  readonly navGroup?: string;

  async goto() {
    await this.page.goto('/');
    await this.waitForAppReady();
    // 主内容区常常有同名按钮（如学生首页的"我的作业"入口卡片），
    // 所以把导航作用域收紧到 <aside>（Sidebar）。
    const sidebar = this.page.locator('aside');
    if (this.navGroup) {
      await sidebar.getByRole('button', { name: this.navGroup }).click();
    }
    await sidebar.getByRole('button', { name: this.navLabel }).click();
    await this.waitForStable();
  }

  async waitForAppReady() {
    // 登录后 Sidebar 必然可见
    await expect(this.page.locator('aside')).toBeVisible({ timeout: 10_000 });
  }

  async waitForStable() {
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async expectToast(text: string | RegExp) {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 5_000 });
  }
}
