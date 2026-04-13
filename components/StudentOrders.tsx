import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import {
    CreditCard,
    Wallet,
    History,
    ChevronRight,
    ArrowUpRight,
    Clock,
    AlertCircle,
    FileText,
    BadgeCheck,
    X
} from 'lucide-react';
import { useStore, Order } from '../store';

export const StudentOrders: React.FC = () => {
    const { currentUser, students, orders, assetAccounts, courses, processPayment, applyRefund, createOrder } = useStore();

    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isRefundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [refundReason, setRefundReason] = useState('');

    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [selectedCourseForPurchase, setSelectedCourseForPurchase] = useState('');

    const currentStudent = React.useMemo(() => {
        if (currentUser?.role === 'student') {
            return (students || []).find(s => s.id === currentUser.bindStudentId || (s as any).user_id === currentUser.id);
        }
        return null;
    }, [currentUser, students]);

    const stats = React.useMemo(() => {
        const studentAssets = (assetAccounts || []).filter(acc => acc.student_id === currentStudent?.id);
        const remaining = studentAssets.reduce((sum, acc) => sum + acc.remaining_qty, 0);
        const consumed = studentAssets.reduce((sum, acc) => sum + (acc.total_qty - acc.remaining_qty), 0);
        return { remaining, consumed };
    }, [assetAccounts, currentStudent]);

    const studentOrders = React.useMemo(() => {
        return orders.filter(o => o.student_id === currentStudent?.id);
    }, [orders, currentStudent]);

    const handlePay = async () => {
        if (!selectedOrder) return;
        try {
            await processPayment({
                orderId: selectedOrder.id,
                amount: selectedOrder.amount,
                channel: 'Wechat',
                campusId: 'C001' // default or from student
            });
            setPayModalOpen(false);
        } catch (e) { }
    };

    const handleRefund = async () => {
        if (!selectedOrder || !refundReason) return;
        try {
            await applyRefund({
                orderId: selectedOrder.id,
                reason: refundReason
            });
            setRefundModalOpen(false);
            setRefundReason('');
        } catch (e) { }
    };

    const handlePurchase = async () => {
        if (!selectedCourseForPurchase || !currentStudent) return;
        const course = (courses || []).find(c => c.id === selectedCourseForPurchase);
        if (!course) return;

        try {
            await createOrder({
                studentId: currentStudent.id,
                courseId: course.id,
                // 金额由后端根据课程计算，前端不再传 amount
            });
            setPurchaseModalOpen(false);
            // After creating an order, ideally we fetch orders again.
            // A page reload or state refresh would happen here.
        } catch (e) { }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return <span className="text-amber-600 bg-amber-50 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">待支付</span>;
            case 'PAID':
                return <span className="text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">已支付</span>;
            case 'PARTIAL_REFUNDED':
                return <span className="text-rose-600 bg-rose-50 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">部分退费</span>;
            case 'REFUNDED':
                return <span className="text-slate-600 bg-slate-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">已退费</span>;
            default:
                return <span className="text-slate-600 bg-slate-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{status}</span>;
        }
    };

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
                <button
                    onClick={() => setPurchaseModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                    <CreditCard size={18} /> 购课/充值
                </button>
            </div>

            {/* Asset Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <ElmIcon name="clock" size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">总可用课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{stats.remaining.toFixed(1)} <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <BadgeCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">已消耗课时</p>
                        <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{stats.consumed.toFixed(1)} <span className="text-sm">H</span></h3>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-xl">
                    <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none mb-2">钱包现金余额</p>
                        <h3 className="text-3xl font-bold font-mono tracking-tight">¥ {(currentStudent as any)?.balance?.toFixed(2) || '0.00'}</h3>
                    </div>
                </div>
            </div>

            {/* Order List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-blue-500" /> 近期购课订单
                    </h4>
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
                            {studentOrders.length > 0 ? studentOrders.map((order) => {
                                const course = (courses || []).find(c => c.id === order.course_id);
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-800 leading-tight">{course?.name || '未知课程'}</p>
                                                <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">{order.id} · {order.createdAt.split('T')[0]}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-bold text-slate-600 font-mono">{order.total_qty || 0} H</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className="text-sm font-bold text-slate-900 font-mono">¥ {order.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {getStatusBadge(order.status)}

                                                {order.status === 'PENDING_PAYMENT' && (
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setPayModalOpen(true); }}
                                                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                                                    >去支付</button>
                                                )}
                                                {(order.status === 'PAID' || order.status === 'PARTIAL_REFUNDED') && (
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setRefundModalOpen(true); }}
                                                        className="px-3 py-1 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition"
                                                    >申请退费</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center">
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

            {/* Pay Modal */}
            {isPayModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setPayModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <ElmIcon name="close" size={16} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">支付订单</h3>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-500">订单金额</span>
                                <span className="text-2xl font-bold text-slate-900 font-mono">¥ {selectedOrder.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">支付方式</span>
                                <span className="text-slate-800 font-medium">微信支付</span>
                            </div>
                        </div>
                        <button onClick={handlePay} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                            确认付款
                        </button>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {isRefundModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setRefundModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <ElmIcon name="close" size={16} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">申请退费</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">退费原因说明</label>
                                <textarea
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none"
                                    placeholder="请详细描述退费原因..."
                                />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                注意：退费金额将根据已上课时数进行折算。提交申请后校区管理员将进行审批，审批通过后资金将原路返回或充入钱包余额。
                            </p>
                        </div>
                        <button
                            onClick={handleRefund}
                            disabled={!refundReason}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            提交退费申请
                        </button>
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setPurchaseModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <ElmIcon name="close" size={16} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">购买新课程</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">选择课程</label>
                                <select
                                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedCourseForPurchase}
                                    onChange={e => setSelectedCourseForPurchase(e.target.value)}
                                >
                                    <option value="">请选择需购买的课程...</option>
                                    {(courses || []).filter(c => c.status === 'enabled').map(c => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.price}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handlePurchase}
                            disabled={!selectedCourseForPurchase}
                            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            生成订单
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
