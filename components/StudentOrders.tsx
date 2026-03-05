
import React from 'react';
import {
    CreditCard,
    Wallet,
    History,
    ChevronRight,
    ArrowUpRight,
    Clock,
    AlertCircle,
    FileText,
    BadgeCheck
} from 'lucide-react';

const MOCK_ORDERS = [
    { id: 'ORD-20240501', course: '高级UI/UX设计全能课', amount: '¥4,800.00', date: '2024-05-01', status: 'paid', hours: 48 },
    { id: 'ORD-20240415', course: 'React 18 企业级开发', amount: '¥6,200.00', date: '2024-04-15', status: 'paid', hours: 64 },
    { id: 'ORD-20240310', course: '商业数据分析与看板', amount: '¥3,500.00', date: '2024-03-10', status: 'paid', hours: 32 },
];

export const StudentOrders: React.FC = () => {
    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>学员中心</span>
                        <ChevronRight size={14} />
                        <span className="text-slate-600">订单与课时</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的财务资产</h1>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                    <CreditCard size={18} /> 课时充值
                </button>
            </div>

            {/* Asset Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">剩余总课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">144.5 <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <BadgeCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">已消耗课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">42.0 <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl">
                    <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none mb-2">钱包余额</p>
                        <h3 className="text-3xl font-bold font-mono tracking-tight">¥ 1,280.00</h3>
                    </div>
                </div>
            </div>

            {/* Order List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-blue-500" /> 近期购课订单
                    </h4>
                    <button className="text-xs font-bold text-slate-400 hover:text-blue-600">查看历史全量账单</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/10 border-b border-slate-50">
                            <tr>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单信息</th>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">包含课时</th>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">实付金额</th>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">状态/操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {MOCK_ORDERS.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">{order.course}</p>
                                            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">{order.id} · {order.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className="text-sm font-bold text-slate-600 font-mono">{order.hours} H</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <span className="text-sm font-bold text-slate-900 font-mono">{order.amount}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">支付成功</span>
                                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 bg-slate-50/20 border-t border-slate-50">
                    <div className="flex items-center gap-3 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                        <AlertCircle size={20} className="text-blue-500" />
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            <span className="font-bold">温馨提示：</span>如有退费需求或课时对齐疑问，请通过侧边栏“联系班主任”或拨打校区服务热线。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
