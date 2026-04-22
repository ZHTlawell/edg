import { test, expect } from '../fixtures/auth';
import { CampusStatsPage } from '../pages/campus/StatsPage';

test.describe('校长端 - 统计报表', () => {
  test('TC-CST-001 进入统计看板能看到导出按钮 @P0', async ({ campusPage }) => {
    const page = new CampusStatsPage(campusPage);
    await page.goto();

    await expect(page.exportButton.first()).toBeVisible();
  });

  test('TC-CST-002 切到"财务报表"子页不报错 @P1', async ({ campusPage }) => {
    const page = new CampusStatsPage(campusPage);
    await page.goto();

    await page.financeTab.click();
    await campusPage.waitForTimeout(600);
    // 切换后 Sidebar 仍然可见，说明没崩
    await expect(campusPage.locator('aside')).toBeVisible();
  });
});
