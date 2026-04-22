import { BasePage } from '../BasePage';

/**
 * Teacher → 作业分发
 * 每行作业都有"编辑 / 删除 / 去批改"三个按钮，是典型多实例场景。
 * 基于 dump/elements/teacher-teacher-homework.json。
 */
export class TeacherHomeworkPage extends BasePage {
  readonly navLabel = '作业分发';

  get publishButton()  { return this.page.getByRole('button', { name: '发布新作业' }); }

  /** 第 index 行的"编辑"按钮 */
  editButtonAt(index: number)   { return this.page.getByRole('button', { name: '编辑' }).nth(index); }
  deleteButtonAt(index: number) { return this.page.getByRole('button', { name: '删除' }).nth(index); }
  gradeButtonAt(index: number)  { return this.page.getByRole('button', { name: '去批改' }).nth(index); }

  /** 列表总行数（通过"去批改"按钮数推断） */
  async rowCount() {
    return await this.page.getByRole('button', { name: '去批改' }).count();
  }
}
