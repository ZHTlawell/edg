
import React, { useState, useMemo } from 'react';
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
    Loader2
} from 'lucide-react';
import { useStore } from '../store';

export const RefundManagement: React.FC = () => {
    const { campuses, students, courses, assetAccounts, requestRefund, addToast } = useStore();

    const [selectedCampus, setSelectedCampus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [refundQty, setRefundQty] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter students by campus and search term
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesCampus = !selectedCampus || s.campus === selectedCampus;
            const matchesSearch = !searchTerm || s.name.includes(searchTerm) || s.phone.includes(searchTerm);
            return matchesCampus && matchesSearch;
        });
    }, [students, selectedCampus, searchTerm]);

    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId);
    }, [students, selectedStudentId]);

    // Get asset accounts for the selected student
    const studentAssets = useMemo(() => {
        if (!selectedStudentId) return [];
        return assetAccounts.filter(acc => acc.student_id === selectedStudentId && acc.remaining_qty > 0);
    }, [assetAccounts, selectedStudentId]);

    const selectedAccount = useMemo(() => {
        return assetAccounts.find(acc => acc.id === selectedAccountId);
    }, [assetAccounts, selectedAccountId]);

    const selectedCourse = useMemo(() => {
        if (!selectedAccount) return null;
        return courses.find(c => c.id === selectedAccount.course_id);
    }, [courses, selectedAccount]);

    // Calculate Refund Amount
    const calculation = useMemo(() => {
        if (!selectedAccount || !selectedCourse) return { unitPrice: 0, amount: 0 };
        // Rule: Price / Total Lessons = Unit Price
        const unitPrice = selectedCourse.price / selectedAccount.total_qty;
        const amount = unitPrice * refundQty;
        return { unitPrice, amount };
    }, [selectedAccount, selectedCourse, refundQty]);

    const handleRefund = async () => {
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
            await requestRefund({
                accountId: selectedAccountId,
                refundQty: refundQty
            });
            // Clear selections after success
            setSelectedAccountId('');
            setRefundQty(0);
        } catch (error) {
            // Already handled in store
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        总部退费管理系统
                        <div className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-widest font-bold">Finance Control</div>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium italic">办理学员退课、结算及资金原路返回业务</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <History size={16} /> 退费历史记录
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold shadow-sm">
                        <RotateCcw size={16} /> 自动核算引擎开启中
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Search & Select */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} className="text-blue-500" /> 选择校区
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
                                {campuses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Search size={14} className="text-blue-500" /> 查找学员
                            </label>
                            <div className="relative group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
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
                                    {selectedStudentId === student.id && <CheckCircle2 size={16} />}
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
                                <User size={32} />
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
                                        <BookOpen size={18} className="text-blue-500" /> 选择退费课程资产
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {studentAssets.length > 0 ? studentAssets.map(acc => {
                                            const course = courses.find(c => c.id === acc.course_id);
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
                                                <div className="flex justify-between px-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">最大可退单位: {selectedAccount?.remaining_qty} H</span>
                                                    <button
                                                        onClick={() => setRefundQty(selectedAccount?.remaining_qty || 0)}
                                                        className="text-[10px] text-blue-600 font-bold hover:underline"
                                                    >全额退课</button>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-64 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                        <RotateCcw size={10} /> 课程单价参考
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

                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">退费特别提醒</p>
                                                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">确认提交后，系统将自动核减学员名下的课时资产，并将计算出的金额即时划拨至学员现金账户余额中。本操作不可撤销，请仔细核对。</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleRefund}
                                            disabled={isSubmitting || refundQty <= 0}
                                            className="w-full bg-slate-900 hover:bg-rose-600 text-white font-bold py-5 rounded-3xl transition-all shadow-xl hover:shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 group"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                                <>
                                                    <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                                                    <span>确认提交退费申请</span>
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

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
};
