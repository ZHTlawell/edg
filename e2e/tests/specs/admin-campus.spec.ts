/**
 * Admin → 校区管理（基于 DOM Dump 结果生成的首个业务流 spec）
 */
import { test, expect } from '../fixtures/auth';
import { CampusListPage } from '../pages/admin/CampusListPage';

test.describe('校区管理 - CRUD & 筛选', () => {
  test.describe('功能测试', () => {
    test('TC-CAMPUS-001 打开页面后能看到校区列表和搜索框 @P0', async ({ adminPage }) => {
      const page = new CampusListPage(adminPage);
      await page.goto();

      await expect(page.searchInput).toBeVisible();
      await expect(page.reviewButton).toBeVisible();
      // 列表至少有一行可查看详情
      await expect(page.detailButtonAt(0)).toBeVisible();
    });

    test('TC-CAMPUS-002 搜索校区名称能过滤结果 @P1', async ({ adminPage }) => {
      const page = new CampusListPage(adminPage);
      await page.goto();

      await page.searchCampus('浦东');
      // 结果里应包含"浦东"字样
      await expect(adminPage.getByText(/浦东/)).toBeVisible({ timeout: 5000 });
    });

    test('TC-CAMPUS-003 点击"校区审核"进入审核入口 @P1', async ({ adminPage }) => {
      const page = new CampusListPage(adminPage);
      await page.goto();

      await page.reviewButton.click();
      // 断言进入审核视图（根据页面实际跳转调整）
      await expect(adminPage.getByRole('heading').filter({ hasText: /审核/ })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('边界测试', () => {
    test('TC-CAMPUS-B01 搜索无匹配关键字时列表为空或空状态提示 @P2', async ({ adminPage }) => {
      const page = new CampusListPage(adminPage);
      await page.goto();

      await page.searchCampus('不可能存在的校区ZZZ');
      // 允许两种表现：空状态文案 或 没有"查看详情"按钮
      const emptyOrNoRow = adminPage.getByText(/暂无|无数据|No data/i).or(page.detailButtonAt(0));
      await expect(async () => {
        const count = await page.detailButtonAt(0).count();
        expect(count).toBe(0);
      }).toPass({ timeout: 5000 }).catch(async () => {
        await expect(adminPage.getByText(/暂无|无数据/)).toBeVisible({ timeout: 2000 });
      });
    });
  });
});
