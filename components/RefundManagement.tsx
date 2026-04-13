
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowRight,
    Wallet,
    History,
    CreditCard,
    AlertCircle,
    RotateCcw,
    Building2,
    User,
    BookOpen,
    CheckCircle2,
    Loader2,
    Clock,
    XCircle,
    CheckCircle
} from 'lucide-react';
import { useStore, RefundRecord } from '../store';
import api from '../utils/api';

export const RefundManagement: React.FC = () => {
    const {
        campuses,
        students,
        courses,
        applyRefund,
        approveRefund,
        getPendingRefunds,
        addToast
    } = useStore();

    const [activeTab, setActiveTab] = useState<'pending' | 'manual'>('pending');
    const [pendingRefunds, setPendingRefunds] = useState<RefundRecord[]>([]);
    const [isLoadingPending, setIsLoadingPending] = useState(false);

    const [selectedCampus, setSelectedCampus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [refundQty, setRefundQty] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 管理员查询指定学员的资产（通过API而非store）
    const [studentAssetAccounts, setStudentAssetAccounts] = useState<any[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);

    useEffect(() => {
        fetchPending();
    }, []);

    // 选中学员时，从后端拉取该学员的课时资产
    useEffect(() => {
        if (selectedStudentId && activeTab === 'manual') {
            setIsLoadingAssets(true);
            setSelectedAccountId('');
            setRefundQty(0);
            api.get(`/api/finance/assets/${selectedStudentId}`)
                .then(res => {
                    setStudentAssetAccounts(res.data.accounts || []);
                })
                .catch(() => {
                    setStudentAssetAccounts([]);
                })
                .finally(() => setIsLoadingAssets(false));
        } else {
            setStudentAssetAccounts([]);
        }
    }, [selectedStudentId, activeTab]);

    const fetchPending = async () => {
        setIsLoadingPending(true);
        try {
            const data = await getPendingRefunds();
            setPendingRefunds(data);
        } catch (e) { }
        finally {
            setIsLoadingPending(false);
        }
    };

    const handleApprove = async (id: string, approved: boolean) => {
        try {
            await approveRefund(id, approved);
            fetchPending(); // Refresh list
        } catch (e) { }
    };

    // Filter students by campus and search term
    const filteredStudents = useMemo(() => {
        return (students || []).filter(s => {
            const matchesCampus = !selectedCampus || s.campus === selectedCampus || s.campus_id === selectedCampus;
            const matchesSearch = !searchTerm || s.name.includes(searchTerm) || s.phone.includes(searchTerm);
            return matchesCampus && matchesSearch;
        });
    }, [students, selectedCampus, searchTerm]);

    const selectedStudent = useMemo(() => {
        return (students || []).find(s => s.id === selectedStudentId);
    }, [students, selectedStudentId]);

    // 从API返回的数据中筛选有余额的资产
    const studentAssets = useMemo(() => {
        return (studentAssetAccounts || []).filter((acc: any) => acc.remaining_qty > 0);
    }, [studentAssetAccounts]);

    const selectedAccount = useMemo(() => {
        return (studentAssetAccounts || []).find((acc: any) => acc.id === selectedAccountId);
    }, [studentAssetAccounts, selectedAccountId]);

    // course 数据直接从 asset account 的 include 中获取
    const selectedCourse = useMemo(() => {
        if (!selectedAccount) return null;
        // API返回的 account 里 include 了 course
        if (selectedAccount.course) return selectedAccount.course;
        return (courses || []).find((c: any) => c.id === selectedAccount.course_id);
    }, [courses, selectedAccount]);

    // Calculate Refund Amount
    const calculation = useMemo(() => {
        if (!selectedAccount || !selectedCourse) return { unitPrice: 0, amount: 0 };
        const price = typeof selectedCourse.price === 'number' ? selectedCourse.price : parseFloat(String(selectedCourse.price).replace(/[^0-9.-]+/g, ""));
        const unitPrice = price / selectedAccount.total_qty;
        const amount = unitPrice * refundQty;
        return { unitPrice, amount };
    }, [selectedAccount, selectedCourse, refundQty]);

    const handleManualRefund = async () => {
        if (!selectedAccountId || refundQty <= 0) {
            addToast('请选择课程账户并输入退费课时', 'error');
            return;
        }

        if (refundQty > (selectedAccount?.remaining_qty || 0)) {
            addToast('退费课时不能超过剩余课时', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. 通过学员+课程查找对应的已支付订单
            const orderRes = await api.get(`/api/finance/find-order/${selectedStudentId}/${selectedAccount.course_id}`);
            const orderId = orderRes.data.id;

            // 2. 发起退费申请（传入 refundQty 支持部分退费）
            await applyRefund({
                orderId,
                refundQty,
                reason: `管理员手动发起退费，退还 ${refundQty} 课时`
            });

            addToast('退费申请已提交，请在待审批列表中完成审核', 'success');
            setSelectedAccountId('');
            setRefundQty(0);
            // 刷新该学员资产
            if (selectedStudentId) {
                const assetsRes = await api.get(`/api/finance/assets/${selectedStudentId}`);
                setStudentAssetAccounts(assetsRes.data.accounts || []);
            }
            // 刷新待审批列表
            fetchPending();
        } catch (error: any) {
            addToast(error?.response?.data?.message || error?.message || '退费申请失败', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        财务退费管理
                        <div className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded-full border border-rose-100 tracking-widest font-bold">财务管理</div>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium italic">审批学员退款申请、处理课时结算及资金返还</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        待审批申请 ({pendingRefunds.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        手动发起退费
                    </button>
                </div>
            </div>

            {activeTab === 'pending' ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <ElmIcon name="clock" size={16} /> 退费审批队列
                        </h4>
                        <button onClick={fetchPending} className="text-xs font-bold text-blue-600 hover:rotate-180 transition-transform duration-500">刷新列表</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/10 border-b border-slate-50">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员/课程</th>
                                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">申请原因</th>
                                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">退款金额</th>
                                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoadingPending ? (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-20 text-center text-slate-300"><Loader2 className="animate-spin mx-auto mb-2" /> 加载中...</td>
                                    </tr>
                                ) : pendingRefunds.length > 0 ? pendingRefunds.map(refund => (
                                    <tr key={refund.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-800">{refund.student?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{refund.order?.course?.name || '未知课程'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-xs text-slate-600 max-w-xs truncate" title={refund.reason}>{refund.reason}</p>
                                        </td>
                                        <td className="px-10 py-6 text-right font-mono font-bold text-rose-600">
                                            ¥ {refund.amount.toFixed(2)}
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(refund.id, false)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(refund.id, true)}
                                                    className="p-2 text-emerald-500 hover:text-emerald-700 transition-colors"
                                                >
                                                    <ElmIcon name="circle-check" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-20 text-center text-slate-300 italic">暂无待处理申请</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Search & Select */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ElmIcon name="house" size={16} /> 选择校区
                                </label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                                    value={selectedCampus}
                                    onChange={(e) => {
                                        setSelectedCampus(e.target.value);
                                        setSelectedStudentId('');
                                        setSelectedAccountId('');
                                    }}
                                >
                                    <option value="">全部校区</option>
                                    {(campuses || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ElmIcon name="search" size={16} /> 查找学员
                                </label>
                                <div className="relative group">
                                    <ElmIcon name="search" size={16} />
                                    <input
                                        type="text"
                                        placeholder="输入姓名或手机号..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudentId(student.id);
                                            setSelectedAccountId('');
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${selectedStudentId === student.id ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 text-white' : 'bg-white border-slate-50 hover:border-blue-200 text-slate-600 hover:bg-blue-50/30'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${selectedStudentId === student.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className={`text-sm font-bold ${selectedStudentId === student.id ? 'text-white' : 'text-slate-800'}`}>{student.name}</p>
                                            <p className={`text-[10px] ${selectedStudentId === student.id ? 'text-blue-100' : 'text-slate-400'} font-medium`}>{student.phone}</p>
                                        </div>
                                        {selectedStudentId === student.id && <ElmIcon name="circle-check" size={16} />}
                                    </button>
                                )) : (
                                    <div className="py-10 text-center text-slate-300 text-xs italic">未找到匹配学员</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Account & Calculation */}
                    <div className="lg:col-span-2 space-y-6">
                        {!selectedStudentId ? (
                            <div className="h-full bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-20 gap-4 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <ElmIcon name="user" size={16} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-400">请选择需要办理退费的学员</h3>
                                    <p className="text-xs text-slate-300 font-medium">从左侧列表查找学员后开启退费工作台</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Student Status Bar */}
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/10">
                                            {selectedStudent?.name.charAt(0)}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-lg font-bold text-white">{selectedStudent?.name}</h3>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                                {selectedStudent?.campus} · {selectedStudent?.className || '未分配班级'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right px-4 border-r border-white/10">
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">现金余额</p>
                                            <p className="text-lg font-mono font-bold text-amber-400">¥{(selectedStudent as any)?.balance?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div className="text-right px-4">
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">剩余学时</p>
                                            <p className="text-lg font-mono font-bold text-emerald-400">{selectedStudent?.balanceLessons} H</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Select Course Asset */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                            <ElmIcon name="reading" size={16} /> 选择退费课程资产
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {isLoadingAssets ? (
                                                <div className="col-span-2 py-8 text-center text-slate-300 text-sm"><Loader2 className="animate-spin inline mr-2" size={16} />加载中...</div>
                                            ) : studentAssets.length > 0 ? studentAssets.map((acc: any) => {
                                                const course = acc.course || (courses || []).find((c: any) => c.id === acc.course_id);
                                                return (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => setSelectedAccountId(acc.id)}
                                                        className={`p-5 rounded-3xl border text-left transition-all ${selectedAccountId === acc.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                                                    >
                                                        <p className="text-sm font-bold text-slate-800 mb-2 truncate">{course?.name}</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">剩余课时 / 总课时</p>
                                                                <p className="text-sm font-mono font-bold text-blue-600">{acc.remaining_qty} / {acc.total_qty}</p>
                                                            </div>
                                                            <div className="w-px h-8 bg-slate-100"></div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">学费总额</p>
                                                                <p className="text-sm font-mono font-bold text-slate-800">¥{course?.price}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            }) : (
                                                <div className="md:col-span-2 py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 font-bold">该学员暂无可用课程资产</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedAccountId && (
                                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                                <div className="flex-1 space-y-4">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        办理退费课时 <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">H</div>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-500 transition-all text-xl font-mono font-bold text-slate-800"
                                                            placeholder="0.0"
                                                            value={refundQty || ''}
                                                            onChange={(e) => setRefundQty(Math.min(selectedAccount?.remaining_qty || 0, parseFloat(e.target.value) || 0))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-64 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                            <ElmIcon name="refresh" size={16} /> 课程单价参考
                                                        </p>
                                                        <p className="text-lg font-mono font-bold text-slate-800 tracking-tight">¥{calculation.unitPrice.toFixed(2)} <span className="text-[10px] text-slate-400">/ H</span></p>
                                                    </div>
                                                    <div className="h-px bg-slate-100"></div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1">
                                                            <CreditCard size={10} /> 预计退费金额
                                                        </p>
                                                        <p className="text-2xl font-mono font-bold text-rose-600 tracking-tighter">¥{calculation.amount.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleManualRefund}
                                                disabled={isSubmitting || refundQty <= 0}
                                                className="w-full bg-slate-900 hover:bg-rose-600 text-white font-bold py-5 rounded-3xl transition-all shadow-xl hover:shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 group"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                                    <>
                                                        <ElmIcon name="refresh" size={16} />
                                                        <span>生成并确认退费申请</span>
                                                        <ArrowRight size={20} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </div>
    );
};
