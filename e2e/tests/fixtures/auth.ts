/**
 * 多角色 fixture：每个角色注入一个已登录的 page
 */
import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', '.auth');

type Fixtures = {
  adminPage: Page;
  campusPage: Page;
  teacherPage: Page;
  studentPage: Page;
};

async function makePage(browser: any, role: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, `${role}.json`) });
  // sessionStorage 不在 storageState 范围内，需用 initScript 注入
  await ctx.addInitScript((r: string) => {
    try { sessionStorage.setItem('edg_active_role', r); } catch {}
  }, role);
  const page = await ctx.newPage();
  return { ctx, page };
}

export const test = base.extend<Fixtures>({
  adminPage: async ({ browser }, use) => {
    const { ctx, page } = await makePage(browser, 'admin');
    await use(page);
    await ctx.close();
  },
  campusPage: async ({ browser }, use) => {
    const { ctx, page } = await makePage(browser, 'campus_admin');
    await use(page);
    await ctx.close();
  },
  teacherPage: async ({ browser }, use) => {
    const { ctx, page } = await makePage(browser, 'teacher');
    await use(page);
    await ctx.close();
  },
  studentPage: async ({ browser }, use) => {
    const { ctx, page } = await makePage(browser, 'student');
    await use(page);
    await ctx.close();
  },
});

export { expect };
