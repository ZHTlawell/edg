import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Admin → 校区组织 → 校区管理
 *
 * 基于 .web-e2e/dump/elements/admin-campus-list.json 生成。
 * 该页无 data-testid，因此用 getByRole / getByPlaceholder 定位。
 */
export class CampusListPage extends BasePage {
  // edg/ 下的 admin 菜单已把"校区管理"提升为顶级项
  readonly navLabel = '校区管理';

  get searchInput()        { return this.page.getByPlaceholder('搜索校区名称、负责人...'); }
  get regionFilter()       { return this.page.getByRole('combobox').first(); } // fallback
  get reviewButton()       { return this.page.getByRole('button', { name: '校区审核' }); }
  get addCampusButton()    { return this.page.getByRole('button', { name: /新增校区|添加校区/ }); }

  detailButtonAt(index: number) {
    return this.page.getByRole('button', { name: '查看详情' }).nth(index);
  }

  rowByName(name: string) {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  async searchCampus(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.waitForStable();
  }
}
