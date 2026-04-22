import { BasePage } from '../BasePage';

/**
 * Student → 我的作业
 * 基于 dump/elements/student-student-homework.json。
 * 顶部有 Tab：全部/待提交/待批改/已批改；列表每项有"去完成作业"按钮。
 */
export class StudentHomeworkPage extends BasePage {
  readonly navLabel = '我的作业';

  // Tab 的可访问名里有计数 span，渲染成 "全部 5"；用包含匹配而不是锚定正则
  get tabAll()     { return this.page.getByRole('button', { name: /^全部/ }); }
  get tabTodo()    { return this.page.getByRole('button', { name: /^待提交/ }); }
  get tabGrading() { return this.page.getByRole('button', { name: /^待批改/ }); }
  get tabGraded()  { return this.page.getByRole('button', { name: /^已批改/ }); }

  doHomeworkButtonAt(index: number) {
    return this.page.getByRole('button', { name: '去完成作业' }).nth(index);
  }

  async switchTab(name: '全部' | '待提交' | '待批改' | '已批改') {
    await this.page.getByRole('button', { name: new RegExp('^' + name) }).click();
    await this.waitForStable();
  }
}
