
import React, { useState } from 'react';
import {
    Calendar,
    Download,
    TrendingUp,
    Search,
    ChevronDown,
    MoreHorizontal,
    AlertTriangle,
    FileCheck,
    History,
    ChevronLeft,
    ChevronRight,
    PieChart,
    Wallet,
    ArrowUpRight
} from 'lucide-react';

export const FinanceReport: React.FC = () => {
    const [activeTab, setActiveTab] = useState('all');

    const mockOrders = [
        { id: 'ORD-20231128-001', student: '陈小明', content: '少儿编程进阶课 (48课时)', amount: '¥5,280.00', channel: '微信支付', status: 'paid', operator: '张老师' },
        { id: 'ORD-20231128-002', student: '林雨欣', content: '创意美术春季班', amount: '¥3,600.00', channel: '支付宝', status: 'pending', operator: '王顾问' },
        { id: 'ORD-20231127-045', student: '周杰伦', content: '钢琴一对一 VIP卡', amount: '¥12,000.00', channel: '现金转账', status: 'void', operator: '李财务' },
        { id: 'ORD-20231127-044', student: '孙悟空', content: '围棋启蒙体验课', amount: '¥299.00', channel: '微信支付', status: 'paid', operator: '张老师' },
    ];

    return (
        <div className="max-w-[1280px] mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">财务明细与订单管理</h1>
                    <p className="text-sm text-slate-500 font-medium">管理校区订单流水并进行财务对账，确保账目清晰透明</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                        <Calendar size={14} />
                        <span>2023-11-01 至 2023-11-30</span>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                        <Download size={16} /> 导出财务账单
                    </button>
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Progress */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Wallet size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800">本月营收目标达成进度</h3>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 font-mono">75.2%</span>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: '75.2%' }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                            <div className="text-slate-400">当前实收: <span className="text-slate-800 ml-1 font-mono">¥150,400.00</span></div>
                            <div className="text-slate-400">目标任务: <span className="text-slate-800 ml-1 font-mono">¥200,000.00</span></div>
                        </div>
                    </div>
                </div>

                {/* Daily Status */}
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">今日新增订单</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-bold text-slate-900 font-mono tracking-tighter">24</h3>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1">
                            <TrendingUp size={10} /> +12% <span className="text-slate-400 font-normal ml-1">vs 昨日</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-slate-600 font-medium">已支付: 20</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <span className="text-xs text-slate-600 font-medium">待确认: 4</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Table Box */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-50 rounded-2xl w-fit">
                        {['all', 'paid', 'pending', 'void'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab === 'all' ? '全部订单' : tab === 'paid' ? '已支付' : tab === 'pending' ? '待确认' : '已作废'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14} /></span>
                            <input
                                type="text"
                                placeholder="搜索订单号/学员姓名"
                                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium w-48 focus:ring-2 ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                            支付渠道: 全部 <ChevronDown size={14} className="text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                            排序方式: 时间降序 <ChevronDown size={14} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单号</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员姓名</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">购买内容</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">实付金额</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支付渠道</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">状态</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">操作人</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {mockOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-4 text-xs font-mono font-bold text-slate-500">{order.id}</td>
                                    <td className="px-8 py-4 font-bold text-slate-800 text-sm">{order.student}</td>
                                    <td className="px-8 py-4 text-xs text-slate-500 font-medium">{order.content}</td>
                                    <td className="px-8 py-4 font-mono font-bold text-slate-900">{order.amount}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            {order.channel.includes('微信') ? <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center"><Wallet size={12} /></div> :
                                                order.channel.includes('支付') ? <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><CreditCard size={12} /></div> :
                                                    <div className="w-5 h-5 bg-slate-100 text-slate-500 rounded flex items-center justify-center"><History size={12} /></div>}
                                            {order.channel}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-400'
                                            }`}>
                                            {order.status === 'paid' ? '已支付' : order.status === 'pending' ? '待确认' : '已作废'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-center text-xs font-bold text-slate-600">{order.operator}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {order.status === 'pending' ? (
                                                <>
                                                    <button className="text-xs font-bold text-blue-600 hover:underline">确认收款</button>
                                                    <span className="text-slate-200">|</span>
                                                    <button className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">作废</button>
                                                </>
                                            ) : (
                                                <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">详情 <ArrowUpRight size={12} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-slate-50/10 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <p className="text-xs font-bold text-slate-400">显示第 1 至 10 条, 共 156 条记录</p>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md">1</button>
                            <button className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 text-xs font-bold transition-all">2</button>
                            <button className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 text-xs font-bold transition-all">3</button>
                        </div>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Donut Area */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <PieChart size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">本月收支构成分析</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Fake Donut with SVG */}
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="15.8" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                <circle cx="18" cy="18" r="15.8" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="55 100" />
                                <circle cx="18" cy="18" r="15.8" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-55" />
                                <circle cx="18" cy="18" r="15.8" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-80" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">总计支出</span>
                                <span className="text-2xl font-bold text-slate-800 font-mono">¥42.5k</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {[
                                { label: '员工工资', percentage: '55%', color: 'bg-blue-600' },
                                { label: '场地租金', percentage: '25%', color: 'bg-emerald-500' },
                                { label: '市场推广', percentage: '20%', color: 'bg-amber-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 font-mono">{item.percentage}</span>
                                </div>
                            ))}
                            <p className="text-[10px] text-slate-400 italic pt-4 leading-relaxed">
                                * 数据基于已确认的流水明细生成，仅供内部对账使用。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Audit Reminders */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">财务审计提醒</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Abnormal Alert */}
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-white text-rose-600 rounded-xl shadow-sm border border-rose-100">
                                <AlertTriangle size={18} />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-sm font-bold text-rose-800">异常对账单 (2)</h5>
                                <p className="text-xs text-rose-600 font-medium leading-relaxed">检测到订单号 ORD-20231128-002 实付金额与合同不符，请核对。</p>
                            </div>
                        </div>

                        {/* Invoice Alert */}
                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-white text-blue-600 rounded-xl shadow-sm border border-blue-100">
                                <FileCheck size={18} />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-sm font-bold text-blue-800">待开票申请 (5)</h5>
                                <p className="text-xs text-blue-600 font-medium leading-relaxed">本周共有 5 名家长提交了电子发票申请，请及时处理。</p>
                            </div>
                        </div>

                        {/* Export Log */}
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4 opacity-70">
                            <div className="p-2 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100">
                                <History size={18} />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-sm font-bold text-slate-600">上次导出记录</h5>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">2023-11-27 18:30 由系统自动导出并发送至校长邮箱。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add standard icon component for clarity
const ShieldCheck: React.FC<{ size: number }> = ({ size }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const CreditCard: React.FC<{ size: number }> = ({ size }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <rect width="20" height="14" x="2" y="5" rx="2" ry="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);
