
import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Printer,
  Download,
  Wallet,
  History,
  RefreshCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  BookOpen,
  Calendar,
  Plus,
  FileText,
  ChevronRight,
  CreditCard,
  Info,
  DollarSign,
  Undo2,
  ExternalLink,
  // Added missing Smartphone icon import
  Smartphone
} from 'lucide-react';
import { useStore } from '../store';

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
  onViewStudent?: (student: any) => void;
}

type OrderStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'partial_refunded' | 'canceled';
type TabType = 'items' | 'payments' | 'lessons' | 'history';

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId, onBack, onViewStudent }) => {
  const { orders, students, courses, processPayment, addToast } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('items');

  const order = (orders || []).find((o: any) => o.id === orderId) as any;
  const student = order ? (students || []).find((s: any) => s.id === order.student_id) as any : null;
  const course = order ? (courses || []).find((c: any) => c.id === order.course_id) as any : null;

  const derivedStatus: OrderStatus = !order
    ? 'pending'
    : order.status === 'PAID' || order.status === 'completed' ? 'completed'
    : order.status === 'REFUNDED' || order.status === 'refunded' ? 'refunded'
    : order.status === 'PARTIAL_REFUNDED' || order.status === 'partial_refunded' ? 'partial_refunded'
    : order.status === 'VOID' || order.status === 'canceled' ? 'canceled'
    : order.status === 'partial' ? 'partial'
    : 'pending';

  const status = derivedStatus;

  const getStatusConfig = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return { label: '待支付', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'partial': return { label: '部分支付', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'completed': return { label: '已完成', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'refunded': return { label: '已退款', style: 'bg-slate-50 text-slate-400 border-slate-200' };
      case 'partial_refunded': return { label: '部分退款', style: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'canceled': return { label: '已取消', style: 'bg-red-50 text-red-600 border-red-100' };
    }
  };

  const statusConfig = getStatusConfig(status);

  if (!order) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">订单详情</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
          <div className="p-6 bg-slate-50 rounded-full">
            <FileText size={48} className="text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-600">订单不存在</p>
          <p className="text-sm font-medium">未找到订单号为 {orderId} 的订单记录</p>
          <button onClick={onBack} className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all">
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  // Map backend fields (amount, total_qty) to display fields
  const totalAmount = order.amount || order.total_amount || 0;
  const discountAmount = order.discount_amount || 0;
  const paidAmount = order.status === 'PAID' ? totalAmount : (order.paid_amount || 0);
  const dueAmount = Math.max(0, (totalAmount - discountAmount) - paidAmount);
  const receivableAmount = totalAmount - discountAmount;
  const purchasedLessons = order.total_qty || order.quantity || course?.totalLessons || 0;
  const studentName = student?.name || order.student_name || '未知学员';
  const studentPhone = student?.phone || '';
  const studentCampus = student?.campus || student?.campusId || order.campus || '';
  const courseName = course?.name || order.course_name || '未知课程';
  const courseLevel = course?.level || '';
  const payments: any[] = order.payments || [];
  const lessonRecords: any[] = order.lesson_records || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">订单详情</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${statusConfig.style}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {status !== 'completed' && status !== 'canceled' && (
            <button
              onClick={async () => {
                try {
                  await processPayment({ orderId, amount: dueAmount, channel: 'manual', campusId: order.campus_id || '' });
                  addToast('收款登记成功', 'success');
                } catch (e: any) {
                  addToast(e.message || '收款失败', 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Wallet size={16} /> 收款登记
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
            <Undo2 size={16} /> 退款
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={() => window.print()}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg"
            title="打印/导出"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Area A: Order Overview Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
          {/* Column 1: Order Meta */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单号/流水号</p>
              <p className="text-base font-bold text-slate-900 font-mono tracking-tighter">{orderId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">创建时间</p>
              <p className="text-sm font-bold text-slate-600">{order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleString('zh-CN') : '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">创建人</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200">{(order.operator_id ? '管' : '学')[0]}</div>
                <p className="text-sm font-bold text-slate-600">{order.operator_id ? '管理员' : '学员自助'}</p>
              </div>
            </div>
          </div>

          {/* Column 2: Student & Class */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员详情</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{studentName.charAt(0)}</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">{studentName}</p>
                  <p className="text-xs text-slate-400 mt-1">{studentPhone ? studentPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '—'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">所属校区</p>
              <p className="text-sm font-bold text-slate-600">{studentCampus || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">关联班级</p>
              <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                {order.class_name || student?.className || '—'} {(order.class_name || student?.className) && <ExternalLink size={12} />}
              </p>
            </div>
          </div>

          {/* Column 3: Course & Lessons */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">课程项目</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">{courseName}</p>
              {courseLevel && <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">{courseLevel}级别</span>}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">购买课时量</p>
              <p className="text-sm font-bold text-slate-600">{purchasedLessons} 课时 (课时包套餐)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">生效日期</p>
              <p className="text-sm font-bold text-slate-600">{order.effective_date || order.created_at?.split('T')[0] || '—'}</p>
            </div>
          </div>

          {/* Column 4: Financial Summary */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>原价总计</span>
                <span className="font-mono">¥ {totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-red-400 uppercase tracking-widest">
                <span>优惠合计</span>
                <span className="font-mono">-¥ {discountAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-200">
                <span>已收金额</span>
                <span className="font-mono text-slate-600">¥ {paidAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">待收欠费</p>
                  <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">¥ {dueAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">应收金额</p>
                  <p className="text-lg font-bold text-emerald-600 font-mono tracking-tighter">¥ {receivableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Area B: Tabs Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="flex items-center px-8 bg-slate-50/50 border-b border-slate-100 overflow-x-auto no-scrollbar">
              {[
                { id: 'items', label: '订单明细' },
                { id: 'payments', label: '收款记录' },
                { id: 'lessons', label: '课时余额/消耗' },
                { id: 'history', label: '变更记录/退款' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-5 text-sm font-bold transition-all relative flex-shrink-0 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-0">
              {activeTab === 'items' && (
                <div className="animate-in fade-in duration-300">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">收费项目名称</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">数量/课时</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">标准单价</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">小计金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ElmIcon name="reading" size={16} /></div>
                            <span className="font-bold text-slate-800 text-sm">高级UI/UX设计实战课时包</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">48.00</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-400 font-mono">¥ 250.00</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right font-mono">¥ 12,000.00</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ElmIcon name="document" size={16} /></div>
                            <span className="font-bold text-slate-800 text-sm">配套纸质教材及设计手册</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">1.00</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-400 font-mono">¥ 800.00</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right font-mono">¥ 800.00</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Discount details */}
                  <div className="p-8 bg-slate-50/30 border-t border-slate-100">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <DollarSign size={14} className="text-red-400" /> 优惠明细应用
                    </h5>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-white border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between min-w-[240px] shadow-sm">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">新学员立减</p>
                          <p className="text-xs font-bold text-slate-600">全校区通用活动券</p>
                        </div>
                        <span className="text-lg font-bold text-red-500 font-mono">-¥ 200.00</span>
                      </div>
                      <div className="bg-white border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between min-w-[240px] shadow-sm">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">早鸟报班折扣</p>
                          <p className="text-xs font-bold text-slate-600">系数 0.92</p>
                        </div>
                        <span className="text-lg font-bold text-red-500 font-mono">-¥ 1,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="animate-in fade-in duration-300">
                  <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">已入账流水记录 ({payments.length})</p>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-md shadow-blue-100">
                      <ElmIcon name="plus" size={16} /> 新增收款
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/10 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">收款时间</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">入账金额</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支付方式</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">经办收款人</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">备注/凭证</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length > 0 ? payments.map((p: any, i: number) => (
                        <tr key={p.id || i} className="hover:bg-blue-50/5">
                          <td className="px-8 py-5 text-xs text-slate-500 font-medium font-mono">{p.paid_at ? new Date(p.paid_at).toLocaleString('zh-CN') : '—'}</td>
                          <td className="px-8 py-5 text-sm font-bold text-emerald-600 font-mono">¥ {Number(p.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-700">
                            <div className="flex items-center gap-2"><CreditCard size={14} className="text-slate-300" /> {p.channel || '—'}</div>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-600">{p.operator || '—'}</td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-[10px] font-bold text-blue-600 hover:underline">查看凭证</button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">暂无收款记录</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="animate-in fade-in duration-300">
                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/30">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">总购买课时</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">48.0</p>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ElmIcon name="reading" size={16} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已消耗课时</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">12.0</p>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ElmIcon name="circle-check" size={16} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between ring-2 ring-blue-500/20">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">当前剩余课时</p>
                        <p className="text-2xl font-bold text-blue-600 font-mono tracking-tighter">36.0</p>
                      </div>
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><ElmIcon name="clock" size={16} /></div>
                    </div>
                  </div>
                  
                  <div className="px-8 py-4 border-t border-b border-slate-100 flex items-center justify-between bg-white">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">最近课消记录 (5)</p>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/10 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">消耗日期</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">课次主题</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">消耗数量</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">操作人</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map(i => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-8 py-5 text-xs font-mono text-slate-500 font-bold tracking-tight">2024-05-2{i} 14:00</td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-700">UI实战课：多态卡片系统设计</td>
                          <td className="px-8 py-5 text-sm font-bold text-blue-600">- 2.0</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">李老师 (签到系统自动)</td>
                          <td className="px-8 py-5 text-right text-xs text-slate-400 italic">正常考勤课消</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="animate-in fade-in duration-300">
                  <div className="p-8 space-y-10">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 border-l-4 border-red-500 pl-3">
                        <h5 className="text-sm font-bold text-slate-900">退款记录档案</h5>
                      </div>
                      <div className="bg-slate-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 border border-slate-200 border-dashed">
                        <div className="p-4 bg-white rounded-full text-slate-200 shadow-inner"><Undo2 size={48} /></div>
                        <div>
                          <p className="text-base font-bold text-slate-400">暂无退款申请或记录</p>
                          <p className="text-xs text-slate-300 mt-1 font-medium">该订单学费目前保持正常支付状态</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                        <h5 className="text-sm font-bold text-slate-900">核心变更日志</h5>
                      </div>
                      <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                        <div className="flex gap-6 relative">
                          <div className="w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-md z-10 mt-1"></div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-800 font-bold">财务对账：部分支付成功</p>
                            <p className="text-xs text-slate-500 leading-relaxed">订单状态变更为 [部分支付]，已累计入账 ¥ 6,000.00。</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">2024-05-23 15:05:33 · 操作人：教务王老师</p>
                          </div>
                        </div>
                        <div className="flex gap-6 relative">
                          <div className="w-5 h-5 rounded-full bg-slate-300 border-4 border-white shadow-md z-10 mt-1"></div>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-800 font-bold">订单初始化创建</p>
                            <p className="text-xs text-slate-500 leading-relaxed">系统生成报名合同订单，应收总额 ¥ 11,600.00。</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">2024-05-23 14:30:00 · 系统自动生成</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50/20 border-t border-slate-100 flex items-center justify-center">
               <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2 group">
                 查看更早之前的 15 条变更日志记录 <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
               </button>
            </div>
          </div>
        </div>

        {/* Area C: Sidebar Information */}
        <div className="space-y-6">
          {/* Student Shortcut Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6 group">
            <h5 className="text-xs font-bold text-slate-900 mb-5 flex items-center gap-2">
              <ElmIcon name="user" size={16} /> 学员快捷入口
            </h5>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-bold shadow-sm group-hover:scale-110 transition-transform">{studentName.charAt(0)}</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{studentName}</p>
                <p className="text-xs text-slate-400 font-medium">{courseName} 学员</p>
              </div>
            </div>
            <button
              onClick={() => student && onViewStudent?.(student)}
              className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              查看学员详情档案 <ElmIcon name="arrow-right" size={16} />
            </button>
          </div>

          {/* Arrears Risk Alert Card */}
          {(status === 'partial' || status === 'pending') ? (
            <div className="bg-amber-50 rounded-[2.25rem] p-8 border border-amber-100 shadow-xl shadow-amber-900/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-md animate-pulse">
                  <ElmIcon name="warning" size={16} />
                </div>
                <h5 className="text-sm font-bold text-amber-900 tracking-tight">订单欠费预警</h5>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">该订单当前处于"{status === 'partial' ? '部分支付' : '待支付'}"状态，尚有 <span className="font-bold text-base font-mono">¥ {dueAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span> 待收。</p>

                <div className="p-4 bg-white/50 rounded-2xl border border-white flex flex-col gap-2">
                   <div className="flex justify-between items-center text-[10px] font-bold text-amber-600">
                     <span>回款截止日</span>
                     <span>{order.due_date || '—'}</span>
                   </div>
                   <div className="w-full h-1.5 bg-amber-200/50 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0)}%` }}></div>
                   </div>
                </div>

                <button className="w-full mt-2 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-200/50 transition-all active:scale-95">
                  发送缴费催办通知
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
