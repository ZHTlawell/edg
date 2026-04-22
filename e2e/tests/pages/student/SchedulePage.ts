import { BasePage } from '../BasePage';

/**
 * Student → 我的课表
 * 基于 dump/elements/student-student-schedule.json。
 */
export class StudentSchedulePage extends BasePage {
  readonly navLabel = '我的课表';

  get refreshButton() { return this.page.getByRole('button', { name: '刷新' }); }
}
