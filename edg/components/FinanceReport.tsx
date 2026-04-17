
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useMemo } from 'react';
import {
    FileCheck,
    History,
    ChevronLeft,
    ChevronRight,
    PieChart,
    Wallet,
} from 'lucide-react';
import { useStore } from '../store';

interface FinanceReportProps {
    onNavigate?: (view: string) => void;
    onViewOrder?: (orderId: string) => void;
}

export const FinanceReport: React.FC<FinanceReportProps> = ({ onNavigate, onViewOrder }) => {
    const { orders, fetchOrders, voidOrder, processPayment, currentUser, addToast } = useStore();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const campusId = currentUser?.role === 'campus_admin' ? currentUser.campus_id : undefined;
        fetchOrders(campusId);
    }, []);

    // Normalize status: backend uses PAID/PENDING_PAYMENT/VOID, tabs use paid/pending/void
    const normalize = (s: string) => {
        if (s === 'PAID') return 'paid';
        if (s === 'PENDING_PAYMENT') return 'pending';
        if (s === 'VOID') return 'void';
        return s.toLowerCase();
    };

    const filtered = useMemo(() => {
        return (orders || []).filter((o: any) => {
            const status = normalize(o.status);
            const matchesTab = activeTab === 'all' || status === activeTab;
            const matchesSearch = !searchTerm ||
                (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.student_name || '').includes(searchTerm);
            return matchesTab && matchesSearch;
        });
    }, [orders, activeTab, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Summary stats
    const totalRevenue = (orders || []).filter((o: any) => o.status === 'PAID').reduce((s: number, o: any) => s + (o.amount || 0), 0);
    const pendingCount = (orders || []).filter((o: any) => o.status === 'PENDING_PAYMENT').length;
    const paidCount = (orders || []).filter((o: any) => o.status === 'PAID').length;

    const handleExportFinance = () => {
        if (filtered.length === 0) { addToast('暂无数据可导出', 'warning'); return; }
        const headers = ['订单编号', '学员姓名', '购买课程', '实付金额', '支付渠道', '状态', '下单时间'];
        const rows = filtered.map((o: any) => [
            o.id, o.student_name, o.course_name,
            `¥${Number(o.amount).toFixed(2)}`, o.channel || '-',
            normalize(o.status) === 'paid' ? '已支付' : normalize(o.status) === 'pending' ? '待确认' : '已作废',
            o.createdAt ? String(o.createdAt).split('T')[0] : '-'
        ]);
        const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `财务账单_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        addToast(`已导出 ${filtered.length} 条账单`, 'success');
    };

    const handleConfirmPayment = async (o: any) => {
        try {
            await processPayment({ orderId: o.id, amount: o.amount, channel: 'manual', campusId: o.campus_id || currentUser?.campus_id || 'CAMPUS_DEFAULT' });
            addToast('收款确认成功', 'success');
            // Refresh orders list to reflect new PAID status
            const campusId = currentUser?.role === 'campus_admin' ? currentUser.campus_id : undefined;
            fetchOrders(campusId);
        } catch (e: any) {
            addToast(e.message || '确认收款失败', 'error');
        }
    };

    const handleVoid = async (o: any) => {
        if (!window.confirm(`确认作废订单「${o.course_name}」？此操作不可撤销。`)) return;
        try { await voidOrder(o.id); } catch { /* toast already shown */ }
    };

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
                        <ElmIcon name="calendar" size={16} />
                        <span>2023-11-01 至 2023-11-30</span>
                    </div>
                    <button onClick={handleExportFinance} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                        <ElmIcon name="download" size={16} /> 导出财务账单
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
                        <span className="text-2xl font-bold text-blue-600 font-mono">{Math.min(100, Math.round(totalRevenue / 2000)).toFixed(1)}%</span>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, totalRevenue / 2000)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                            <div className="text-slate-400">当前实收: <span className="text-slate-800 ml-1 font-mono">¥{totalRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="text-slate-400">目标任务: <span className="text-slate-800 ml-1 font-mono">¥200,000.00</span></div>
                        </div>
                    </div>
                </div>

                {/* Daily Status */}
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">今日新增订单</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-bold text-slate-900 font-mono tracking-tighter">{(orders || []).length}</h3>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1">
                            <ElmIcon name="trend-charts" size={16} /> 全部订单
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-slate-600 font-medium">已支付: {paidCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <span className="text-xs text-slate-600 font-medium">待确认: {pendingCount}</span>
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
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><ElmIcon name="search" size={16} /></span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                placeholder="搜索订单号/学员姓名"
                                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium w-48 focus:ring-2 ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                            支付渠道: 全部 <ElmIcon name="arrow-down" size={16} />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                            排序方式: 时间降序 <ElmIcon name="arrow-down" size={16} />
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
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-16 text-center text-slate-400 text-sm font-medium">
                                        暂无订单数据
                                    </td>
                                </tr>
                            ) : paginated.map((o: any) => {
                                const status = normalize(o.status);
                                const channel = o.channel || '-';
                                return (
                                    <tr key={o.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-4 text-xs font-mono font-bold text-slate-500">{o.id}</td>
                                        <td className="px-8 py-4 font-bold text-slate-800 text-sm">{o.student_name || '-'}</td>
                                        <td className="px-8 py-4 text-xs text-slate-500 font-medium">{o.course_name || '-'}</td>
                                        <td className="px-8 py-4 font-mono font-bold text-slate-900">¥{Number(o.amount || 0).toFixed(2)}</td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                {channel.includes('微信') ? <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center"><Wallet size={12} /></div> :
                                                    channel.includes('支付') ? <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><CreditCard size={12} /></div> :
                                                        <div className="w-5 h-5 bg-slate-100 text-slate-500 rounded flex items-center justify-center"><History size={12} /></div>}
                                                {channel}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                    status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-100 text-slate-400'
                                                }`}>
                                                {status === 'paid' ? '已支付' : status === 'pending' ? '待确认' : '已作废'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center text-xs font-bold text-slate-600">{o.operator_id ? '管理员' : '学员'}</td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirmPayment(o)}
                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                        >确认收款</button>
                                                        <span className="text-slate-200">|</span>
                                                        <button
                                                            onClick={() => handleVoid(o)}
                                                            className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                                                        >作废</button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => onViewOrder?.(o.id)}
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >详情 <ElmIcon name="top-right" size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-slate-50/10 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <p className="text-xs font-bold text-slate-400">
                        显示第 {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} 至 {Math.min(page * PAGE_SIZE, filtered.length)} 条, 共 {filtered.length} 条记录
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white text-slate-400'}`}
                                    >{p}</button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Analysis */}
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
