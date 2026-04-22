import { BasePage } from '../BasePage';

/**
 * Campus Admin → 统计报表 → 统计看板
 * 注意"统计报表"在校长端 Sidebar 是父分组，真正入口是下属"统计看板"/"财务报表"。
 */
export class CampusStatsPage extends BasePage {
  readonly navGroup = '统计报表';
  readonly navLabel = '统计看板';

  // 真实 label 是前面带一个空格的" 导出"，用 contains 匹配更稳
  get exportButton() { return this.page.getByRole('button', { name: /导出/ }); }
  get financeTab()   { return this.page.locator('aside').getByRole('button', { name: '财务报表' }); }
}
