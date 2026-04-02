import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, History, BadgeCheck,
    ShoppingCart, Clock, CheckCircle2, XCircle,
    AlertCircle, RotateCcw, FileText, Info
} from 'lucide-react';
import { useStore, Order } from '../store';
import api from '../utils/api';

interface StudentOrdersProps {
    onNavigate?: (view: string) => void;
}

interface RefundRecord {
    id: string;
    order_id: string;
    requested_qty: number;
    approved_qty?: number;
    estimated_amount?: number;
    amount: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    review_note?: string;
    createdAt: string;
    reviewedAt?: string;
}

const REFUND_STATUS_CONFIG: Record<string, { label: string; icon: any; badge: string; dot: string }> = {
    PENDING: {
        label: '审批中',
        icon: Clock,
        badge: 'bg-amber-50 text-amber-600 border border-amber-100',
        dot: 'bg-amber-400',
    },
    APPROVED: {
        label: '退费成功',
        icon: CheckCircle2,
        badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        dot: 'bg-emerald-500',
    },
    REJECTED: {
        label: '已拒绝',
        icon: XCircle,
        badge: 'bg-red-50 text-red-500 border border-red-100',
        dot: 'bg-red-400',
    },
    CANCELLED: {
        label: '已撤回',
        icon: RotateCcw,
        badge: 'bg-slate-50 text-slate-500 border border-slate-200',
        dot: 'bg-slate-400',
    },
    // Legacy status compatibility
    PENDING_APPROVAL: {
        label: '审批中',
        icon: Clock,
        badge: 'bg-amber-50 text-amber-600 border border-amber-100',
        dot: 'bg-amber-400',
    },
    PENDING_HQ_APPROVAL: {
        label: '审批中',
        icon: Clock,
        badge: 'bg-amber-50 text-amber-600 border border-amber-100',
        dot: 'bg-amber-400',
    },
};

const QUICK_REASONS = [
    '课程内容与描述不符',
    '个人时间安排冲突，无法继续学习',
    '教学质量未达预期',
    '已完成学习目标，不再需要',
    '其他原因',
];

const REFUND_STEPS = [
    { label: '提交申请' },
    { label: '校区审批' },
    { label: '财务处理' },
    { label: '退费完成' },
];

export const StudentOrders: React.FC<StudentOrdersProps> = ({ onNavigate }) => {
    const { currentUser, students, orders, assetAccounts, courses, processPayment, applyRefund, fetchOrders, fetchMyAssets, addToast } = useStore();

    useEffect(() => {
        if (currentUser?.role === 'student') {
            fetchMyAssets();
            fetchOrders();
        }
    }, [currentUser, fetchMyAssets, fetchOrders]);

    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isRefundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Wechat');
    const [submitting, setSubmitting] = useState(false);
    const [refundMap, setRefundMap] = useState<Record<string, RefundRecord>>({});
    const [refundLoading, setRefundLoading] = useState(false);

    const currentStudent = React.useMemo(() => {
        if (currentUser?.role === 'student') {
            // First try finding in students array
            const found = (students || []).find(s => s.id === currentUser.bindStudentId || (s as any).user_id === currentUser.id);
            if (found) return found;
            // Fallback: use bindStudentId directly (students array may not be loaded for student role)
            if (currentUser.bindStudentId) {
                return { id: currentUser.bindStudentId, name: currentUser.name } as any;
            }
        }
        return null;
    }, [currentUser, students]);

    const loadRefunds = useCallback(async () => {
        setRefundLoading(true);
        try {
            const res = await api.get('/api/finance/my-refunds');
            const map: Record<string, RefundRecord> = {};
            for (const r of (res.data || [])) {
                if (!map[r.order_id] || r.createdAt > map[r.order_id].createdAt) {
                    map[r.order_id] = r;
                }
            }
            setRefundMap(map);
        } catch { /* silent */ } finally {
            setRefundLoading(false);
        }
    }, []);

    useEffect(() => { loadRefunds(); }, [loadRefunds]);

    const studentAssets = React.useMemo(() => {
        const raw = (assetAccounts || []).filter(acc => acc.student_id === currentStudent?.id);
        const map = new Map<string, typeof raw[0]>();
        for (const acc of raw) {
            const existing = map.get(acc.course_id);
            if (!existing || acc.total_qty > existing.total_qty) map.set(acc.course_id, acc);
        }
        return Array.from(map.values());
    }, [assetAccounts, currentStudent]);

    const stats = React.useMemo(() => {
        const remaining = studentAssets.reduce((sum, acc) => sum + acc.remaining_qty, 0);
        const consumed = studentAssets.reduce((sum, acc) => sum + (acc.total_qty - acc.remaining_qty), 0);
        return { remaining, consumed };
    }, [studentAssets]);

    const studentOrders = React.useMemo(() => {
        return orders
            .filter(o => o.student_id === currentStudent?.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, currentStudent]);

    const totalSpent = React.useMemo(() => (
        studentOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + (o.amount || 0), 0)
    ), [studentOrders]);

    const handlePay = async () => {
        if (!selectedOrder) return;
        try {
            await processPayment({
                orderId: selectedOrder.id,
                amount: selectedOrder.amount,
                channel: paymentMethod,
                campusId: (currentStudent as any)?.campus_id || 'CAMPUS_PUDONG',
            });
            await fetchOrders();
            await fetchMyAssets();
            setPayModalOpen(false);
            addToast('支付成功！课时已到账', 'success');
        } catch (e: any) {
            addToast(e?.response?.data?.message || '支付失败', 'error');
        }
    };

    const handleRefund = async () => {
        if (!selectedOrder) return;
        const finalReason = refundReason === '其他原因' ? customReason : refundReason;
        if (!finalReason.trim()) return;
        setSubmitting(true);
        try {
            await applyRefund({ orderId: selectedOrder.id, reason: finalReason });
            await loadRefunds();
            setRefundModalOpen(false);
            setRefundReason('');
            setCustomReason('');
        } catch (e: any) {
            addToast(e?.response?.data?.message || '提交失败', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getOrderStatusBadge = (status: string) => {
        const dot = (color: string) => <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} />;
        switch (status) {
            case 'PENDING_PAYMENT': return <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-amber-100">{dot('bg-amber-400')}待支付</span>;
            case 'PAID': return <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-emerald-100">{dot('bg-emerald-500')}已支付</span>;
            case 'PARTIAL_REFUNDED': return <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-orange-100">{dot('bg-orange-400')}部分退费</span>;
            case 'REFUNDED': return <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-slate-200">{dot('bg-slate-400')}已退费</span>;
            default: return <span className="text-slate-500 bg-slate-100 text-[10px] font-bold px-2.5 py-1.5 rounded-xl">{status}</span>;
        }
    };

    const openRefundModal = (order: Order) => {
        setSelectedOrder(order);
        setRefundReason('');
        setCustomReason('');
        setRefundModalOpen(true);
    };

    const renderRefundAction = (order: Order) => {
        if (order.status === 'REFUNDED' || order.status === 'CANCELLED') return null;
        const refund = refundMap[order.id];

        if (refund) {
            const cfg = REFUND_STATUS_CONFIG[refund.status] || REFUND_STATUS_CONFIG['PENDING'];
            const Icon = cfg.icon;

            const isPending = refund.status === 'PENDING' || refund.status === 'PENDING_APPROVAL' || refund.status === 'PENDING_HQ_APPROVAL';
            if (isPending) {
                return (
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl ${cfg.badge} cursor-default`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
                        {cfg.label}
                    </div>
                );
            }

            if (refund.status === 'APPROVED') {
                return (
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl ${cfg.badge}`}>
                        <Icon size={11} />{cfg.label}
                    </div>
                );
            }

            if (refund.status === 'REJECTED') {
                return (
                    <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl ${cfg.badge}`}>
                            <Icon size={11} />{cfg.label}
                        </div>
                        {(order.status === 'PAID' || order.status === 'PARTIAL_REFUNDED') && (
                            <button onClick={() => openRefundModal(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                                <RotateCcw size={10} />重新申请
                            </button>
                        )}
                    </div>
                );
            }
        }

        if (order.status === 'PAID' || order.status === 'PARTIAL_REFUNDED') {
            return (
                <button onClick={() => openRefundModal(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all">
                    <FileText size={11} />申请退费
                </button>
            );
        }
        return null;
    };

    const finalReason = refundReason === '其他原因' ? customReason : refundReason;
    const canSubmit = finalReason.trim().length > 0 && !submitting;

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>学员中心</span>
                        <ElmIcon name="arrow-right" size={16} />
                        <span className="text-slate-600">订单与课时</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的财务资产</h1>
                </div>
                <button onClick={() => onNavigate?.('student-market')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
                    <ShoppingCart size={18} /> 浏览课程市场
                </button>
            </div>

            {/* Course Assets */}
            {studentAssets.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 text-sm">已购课程</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentAssets.map(acc => {
                            const course = (courses || []).find(c => c.id === acc.course_id);
                            const pct = acc.total_qty > 0 ? Math.round(((acc.total_qty - acc.remaining_qty) / acc.total_qty) * 100) : 0;
                            return (
                                <div key={acc.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{course?.name || '未知课程'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                {acc.status === 'ACTIVE' ? '学习中' : acc.status === 'REFUNDED' ? '已退费' : acc.status}
                                            </p>
                                        </div>
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {acc.status === 'ACTIVE' ? '有效' : '失效'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>剩余 {acc.remaining_qty} 课时</span>
                                            <span>共 {acc.total_qty} 课时 · 已用 {pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><ElmIcon name="clock" size={16} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">总可用课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{stats.remaining.toFixed(1)} <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><BadgeCheck size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">已消耗课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{stats.consumed.toFixed(1)} <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none mb-2">累计消费金额</p>
                        <h3 className="text-3xl font-bold font-mono tracking-tight">¥ {totalSpent.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Order Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-blue-500" /> 近期购课订单
                    </h4>
                    {refundLoading && (
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin inline-block" />
                            同步退费状态...
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-50">
                            <tr>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单信息</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">课时</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">金额</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">订单状态</th>
                                <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {studentOrders.length > 0 ? studentOrders.map(order => {
                                const course = (courses || []).find(c => c.id === order.course_id);
                                const refund = refundMap[order.id];
                                const isPending = refund?.status === 'PENDING';
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-slate-800">{course?.name || '未知课程'}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {order.id.slice(0, 8).toUpperCase()}···{order.id.slice(-4).toUpperCase()} · {order.createdAt.split('T')[0]}
                                                </p>
                                                {/* 审批中进度条 */}
                                                {isPending && (
                                                    <div className="flex items-center gap-1 pt-1">
                                                        {REFUND_STEPS.map((step, i) => {
                                                            const done = i < 1;
                                                            const active = i === 1;
                                                            return (
                                                                <React.Fragment key={i}>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-100 text-slate-300'}`}>
                                                                            {done ? '✓' : i + 1}
                                                                        </div>
                                                                        <span className={`text-[9px] font-semibold ${active ? 'text-amber-500' : done ? 'text-emerald-500' : 'text-slate-300'}`}>{step.label}</span>
                                                                    </div>
                                                                    {i < REFUND_STEPS.length - 1 && <div className={`w-3 h-px ${done ? 'bg-emerald-200' : 'bg-slate-100'}`} />}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="text-sm font-bold text-slate-600 font-mono">{order.total_qty || 0} H</span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-sm font-bold text-slate-900 font-mono">¥ {order.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center">{getOrderStatusBadge(order.status)}</td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status === 'PENDING_PAYMENT' && (
                                                    <button onClick={() => { setSelectedOrder(order); setPayModalOpen(true); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition-all">
                                                        去支付
                                                    </button>
                                                )}
                                                {renderRefundAction(order)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <ElmIcon name="document" size={16} />
                                            <p className="text-sm font-bold uppercase tracking-widest">暂无购课订单记录</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pay Modal ── */}
            {isPayModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setPayModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><ElmIcon name="close" size={16} /></button>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">支付订单</h3>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">订单金额</span>
                                <span className="text-2xl font-bold text-slate-900 font-mono">¥ {selectedOrder.amount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-2 mb-6">
                            <p className="text-sm font-bold text-slate-700">选择支付方式</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'Wechat', label: '微信支付', active: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                                    { value: 'Alipay', label: '支付宝', active: 'border-blue-400 bg-blue-50 text-blue-700' },
                                    { value: 'BankCard', label: '银行卡', active: 'border-slate-400 bg-slate-50 text-slate-700' },
                                ].map(m => (
                                    <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                                        className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${paymentMethod === m.value ? m.active : 'border-slate-100 bg-white text-slate-500'}`}>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handlePay} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                            确认付款
                        </button>
                    </div>
                </div>
            )}

            {/* ── Refund Modal ── */}
            {isRefundModalOpen && selectedOrder && (() => {
                const course = (courses || []).find(c => c.id === selectedOrder.course_id);
                const existingRefund = refundMap[selectedOrder.id];
                const isReApply = existingRefund?.status === 'REJECTED';
                const acc = studentAssets.find(a => a.course_id === selectedOrder.course_id);
                const usedQty = acc ? acc.total_qty - acc.remaining_qty : 0;
                return (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                            {/* Header */}
                            <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{isReApply ? '重新申请退费' : '申请退费'}</h3>
                                        <p className="text-sm text-slate-400 mt-0.5">{course?.name || '未知课程'}</p>
                                    </div>
                                    <button onClick={() => setRefundModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                                        <ElmIcon name="close" size={16} />
                                    </button>
                                </div>
                                {/* Step indicator */}
                                <div className="flex items-center">
                                    {REFUND_STEPS.map((step, i) => (
                                        <React.Fragment key={i}>
                                            <div className="flex flex-col items-center gap-1.5 flex-1">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {i === 0 ? '1' : i + 1}
                                                </div>
                                                <span className={`text-[9px] font-bold tracking-wide ${i === 0 ? 'text-slate-700' : 'text-slate-300'}`}>{step.label}</span>
                                            </div>
                                            {i < REFUND_STEPS.length - 1 && <div className="flex-1 h-px bg-slate-100 mb-5" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <div className="px-8 py-6 space-y-5">
                                {/* Order summary */}
                                <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">实付金额</p>
                                        <p className="text-2xl font-bold text-slate-900 font-mono mt-0.5">¥ {selectedOrder.amount.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-medium">已使用课时</p>
                                        <p className="text-base font-bold text-slate-600 font-mono mt-0.5">
                                            {usedQty} / {acc?.total_qty || 0} H
                                        </p>
                                    </div>
                                </div>

                                {/* Rejection notice */}
                                {isReApply && (
                                    <div className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                        <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-red-600">上次申请已被拒绝</p>
                                            <p className="text-xs text-red-400 mt-0.5">请补充说明退费原因后重新提交</p>
                                        </div>
                                    </div>
                                )}

                                {/* Quick reasons */}
                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold text-slate-700 block">选择退费原因</label>
                                    <div className="space-y-2">
                                        {QUICK_REASONS.map(r => (
                                            <button key={r} onClick={() => setRefundReason(r)}
                                                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${refundReason === r
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}>
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                    {refundReason === '其他原因' && (
                                        <textarea
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent h-24 resize-none mt-2"
                                            placeholder="请详细描述退费原因..."
                                            autoFocus
                                        />
                                    )}
                                </div>

                                {/* Policy note */}
                                <div className="flex gap-2.5 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        退费金额按<span className="font-bold">剩余未消耗课时</span>比例折算。审批通过后原路退回，预计 <span className="font-bold">3–7 个工作日</span>到账。
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-8 flex gap-3">
                                <button onClick={() => setRefundModalOpen(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors">
                                    取消
                                </button>
                                <button onClick={handleRefund} disabled={!canSubmit}
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {submitting
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</>
                                        : '提交退费申请'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
