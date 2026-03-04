
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

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
}

type OrderStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'canceled';
type TabType = 'items' | 'payments' | 'lessons' | 'history';

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [status] = useState<OrderStatus>('partial');

  const getStatusConfig = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return { label: '待支付', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'partial': return { label: '部分支付', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'completed': return { label: '已完成', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'refunded': return { label: '已退款', style: 'bg-slate-50 text-slate-400 border-slate-200' };
      case 'canceled': return { label: '已取消', style: 'bg-red-50 text-red-600 border-red-100' };
    }
  };

  const statusConfig = getStatusConfig(status);

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
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Edit3 size={16} /> 编辑订单
          </button>
          {status !== 'completed' && status !== 'canceled' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <Wallet size={16} /> 收款登记
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
            <Undo2 size={16} /> 退款
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg" title="打印/导出">
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
              <p className="text-sm font-bold text-slate-600">2024-05-23 14:30:45</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">创建人</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200">王</div>
                <p className="text-sm font-bold text-slate-600">王主管 (教务中心)</p>
              </div>
            </div>
          </div>

          {/* Column 2: Student & Class */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员详情</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">张</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">张美玲</p>
                  <p className="text-xs text-slate-400 mt-1">138****5678</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">所属校区</p>
              <p className="text-sm font-bold text-slate-600">总部旗舰校区</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">关联班级</p>
              <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                24春季UI精品1班 <ExternalLink size={12} />
              </p>
            </div>
          </div>

          {/* Column 3: Course & Lessons */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">课程项目</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">高级UI/UX设计实战研修班</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">高级级别</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">购买课时量</p>
              <p className="text-sm font-bold text-slate-600">48 课时 (课时包套餐)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">生效日期</p>
              <p className="text-sm font-bold text-slate-600">2024-06-01</p>
            </div>
          </div>

          {/* Column 4: Financial Summary */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>原价总计</span>
                <span className="font-mono">¥ 12,800.00</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-red-400 uppercase tracking-widest">
                <span>优惠合计</span>
                <span className="font-mono">-¥ 1,200.00</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-200">
                <span>已收金额</span>
                <span className="font-mono text-slate-600">¥ 6,000.00</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">待收欠费</p>
                  <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">¥ 5,600.00</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">应收金额</p>
                  <p className="text-lg font-bold text-emerald-600 font-mono tracking-tighter">¥ 11,600.00</p>
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
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={16} /></div>
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
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></div>
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
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">已入账流水记录 (2)</p>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-md shadow-blue-100">
                      <Plus size={14} /> 新增收款
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
                      <tr className="hover:bg-blue-50/5">
                        <td className="px-8 py-5 text-xs text-slate-500 font-medium font-mono">2024-05-23 15:00:22</td>
                        <td className="px-8 py-5 text-sm font-bold text-emerald-600 font-mono">¥ 3,000.00</td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-700">
                          <div className="flex items-center gap-2"><CreditCard size={14} className="text-slate-300" /> 银行卡转账</div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-600">教务王老师</td>
                        <td className="px-8 py-5 text-right">
                          <button className="text-[10px] font-bold text-blue-600 hover:underline">查看流水单</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50/5">
                        <td className="px-8 py-5 text-xs text-slate-500 font-medium font-mono">2024-05-23 14:35:10</td>
                        <td className="px-8 py-5 text-sm font-bold text-emerald-600 font-mono">¥ 3,000.00</td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-700">
                          <div className="flex items-center gap-2"><Smartphone size={14} className="text-emerald-500" /> 微信支付</div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-600">教务王老师</td>
                        <td className="px-8 py-5 text-right">
                          <button className="text-[10px] font-bold text-blue-600 hover:underline">查看收款截图</button>
                        </td>
                      </tr>
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
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已消耗课时</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">12.0</p>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between ring-2 ring-blue-500/20">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">当前剩余课时</p>
                        <p className="text-2xl font-bold text-blue-600 font-mono tracking-tighter">36.0</p>
                      </div>
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Clock size={24} /></div>
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
              <User size={16} className="text-blue-500" /> 学员快捷入口
            </h5>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-bold shadow-sm group-hover:scale-110 transition-transform">张</div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">张美玲</p>
                <p className="text-xs text-slate-400 font-medium">高级UI设计班级学员</p>
              </div>
            </div>
            <button className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              查看学员详情档案 <ChevronRight size={14} />
            </button>
          </div>

          {/* Arrears Risk Alert Card */}
          {status === 'partial' || status === 'pending' ? (
            <div className="bg-amber-50 rounded-[2.25rem] p-8 border border-amber-100 shadow-xl shadow-amber-900/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-md animate-pulse">
                  <AlertTriangle size={24} />
                </div>
                <h5 className="text-sm font-bold text-amber-900 tracking-tight">订单欠费预警</h5>
              </div>
              
              <div className="space-y-4 relative z-10">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">该订单当前处于“部分支付”状态，尚有 <span className="font-bold text-base font-mono">¥ 5,600.00</span> 待收。</p>
                
                <div className="p-4 bg-white/50 rounded-2xl border border-white flex flex-col gap-2">
                   <div className="flex justify-between items-center text-[10px] font-bold text-amber-600">
                     <span>回款截止日</span>
                     <span>2024-06-15</span>
                   </div>
                   <div className="w-full h-1.5 bg-amber-200/50 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 rounded-full" style={{ width: '52%' }}></div>
                   </div>
                </div>

                <button className="w-full mt-2 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-200/50 transition-all active:scale-95">
                  发送缴费催办通知
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick Help card */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="opacity-60" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">业务小贴士</span>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              结课订单如果需要退款，需先进行 [学籍变更] 操作释放名额后，方可申请退费。
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 flex items-center justify-between z-30 lg:left-64">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          返回订单列表
        </button>
        <div className="flex items-center gap-4">
           <p className="text-xs text-slate-400 font-medium hidden md:block">如有疑问请咨询系统管理员或财务审计人员</p>
           <button className="px-10 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
             查看合同样本
           </button>
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
