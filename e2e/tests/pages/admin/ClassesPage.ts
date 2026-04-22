import { BasePage } from '../BasePage';

/**
 * Admin → 班级管理
 * 顶部有校区下拉 + "开班"按钮。
 * 基于 dump/elements/admin-classes.json。
 */
export class AdminClassesPage extends BasePage {
  readonly navLabel = '班级管理';

  get campusSelect()    { return this.page.getByRole('combobox').first(); }
  get createClassButton() { return this.page.getByRole('button', { name: '开班' }); }

  async selectCampus(name: string) {
    await this.campusSelect.selectOption({ label: name });
    await this.waitForStable();
  }
}
