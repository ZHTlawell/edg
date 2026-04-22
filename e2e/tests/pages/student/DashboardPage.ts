import { BasePage } from '../BasePage';

/**
 * Student → 学生首页
 * 基于 dump/elements/student-student-dashboard.json。
 */
export class StudentDashboardPage extends BasePage {
  readonly navLabel = '学生首页';

  get renewButton()       { return this.page.getByRole('button', { name: '立即续费' }); }
  get leaveButton()       { return this.page.getByRole('button', { name: '在线请假' }); }
  get materialsButton()   { return this.page.getByRole('button', { name: '学习资料' }); }
  get contactHeadTeacher(){ return this.page.getByRole('button', { name: '联系班主任' }); }
  get enterLearning()     { return this.page.getByRole('button', { name: '进入在线学习中心' }); }

  submitButtonAt(index: number) {
    return this.page.getByRole('button', { name: '去提交' }).nth(index);
  }
}
