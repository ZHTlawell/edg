import { BasePage } from '../BasePage';

/**
 * Student → 订单与课时
 * 基于 dump/elements/student-student-orders.json。
 */
export class StudentOrdersPage extends BasePage {
  readonly navLabel = '订单与课时';

  get browseMarketButton() { return this.page.getByRole('button', { name: '浏览课程市场' }); }

  refundButtonAt(index: number) {
    return this.page.getByRole('button', { name: '申请退费' }).nth(index);
  }

  async orderCount() {
    return await this.page.getByRole('button', { name: '申请退费' }).count();
  }
}
