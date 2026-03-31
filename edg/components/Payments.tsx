
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import {
    Search,
    CreditCard,
    User,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Wallet,
    History,
    Building2,
    PlusCircle,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { useStore } from '../store';

export const Payments: React.FC = () => {
    const {
        students,
        courses,
        campuses,
        createOrder,
        processPayment,
        addToast,
        currentUser
    } = useStore();

    const [selectedCampus, setSelectedCampus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [paymentChannel, setPaymentChannel] = useState('Cash');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter students
    const filteredStudents = useMemo(() => {
        return (students || []).filter(s => {
            const matchesCampus = !selectedCampus || s.campus === selectedCampus || s.campus_id === selectedCampus;
            const matchesSearch = !searchTerm || s.name.includes(searchTerm) || s.phone.includes(searchTerm);
            return matchesCampus && matchesSearch;
        });
    }, [students, selectedCampus, searchTerm]);

    const selectedStudent = useMemo(() => (students || []).find(s => s.id === selectedStudentId), [students, selectedStudentId]);
    const selectedCourse = useMemo(() => (courses || []).find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

    const handleEnroll = async () => {
        if (!selectedStudentId || !selectedCourseId) {
            addToast('请选择学员和课程', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Order
            const orderId = await createOrder({
                studentId: selectedStudentId,
                courseId: selectedCourseId,
                amount: parseFloat(selectedCourse?.price.replace(/[^0-9.-]+/g, "") || "0"),
                totalQty: selectedCourse?.totalLessons
            });

            // 2. Process Payment (Since admin is doing this, we assume they are registering a payment already received)
            await processPayment({
                orderId,
                amount: parseFloat(selectedCourse?.price.replace(/[^0-9.-]+/g, "") || "0"),
                channel: paymentChannel,
                campusId: selectedStudent?.campus_id || 'C001'
            });

            addToast('报名缴费成功', 'success');

            // Success - Reset
            setSelectedCourseId('');
            // Keep student selected for multiple enrollments if needed
        } catch (error) {
            // Errors handled in store
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        报名缴费中心
                        <div className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest font-bold">Enrollment</div>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium italic">为学员办理课程报名、续费及线下缴费登记</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Student Selection */}
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
                            }}
                        >
                            <option value="">全部校区</option>
                            {(campuses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4">
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

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.id)}
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

                {/* Right: Enrollment Details */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedStudentId ? (
                        <div className="h-full bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-20 gap-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <ElmIcon name="user" size={16} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-400">请选择需要办理报名的学员</h3>
                                <p className="text-xs text-slate-300 font-medium">从左侧列表查找学员后开启报名工作台</p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
                            {/* Student Profile Quick View */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-bold border border-white/10">
                                        {selectedStudent?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">{selectedStudent?.name}</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{selectedStudent?.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right px-4 border-r border-white/10">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">钱包余额</p>
                                        <p className="text-lg font-mono font-bold text-amber-400">¥{(selectedStudent as any)?.balance?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div className="text-right px-4">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">课程数</p>
                                        <p className="text-lg font-mono font-bold text-emerald-400">2</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ElmIcon name="reading" size={16} /> 选择报考课程
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(courses || []).filter(c => c.status === 'enabled').map(course => (
                                            <button
                                                key={course.id}
                                                onClick={() => setSelectedCourseId(course.id)}
                                                className={`p-5 rounded-3xl border text-left transition-all ${selectedCourseId === course.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                                            >
                                                <p className="text-sm font-bold text-slate-800 mb-2">{course.name}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-600 font-mono">{course.price}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{course.totalLessons} 课时</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedCourse && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6 pt-6 border-t border-slate-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <CreditCard size={14} className="text-blue-500" /> 支付方式
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Cash', 'Wechat', 'Alipay', 'Bank'].map(channel => (
                                                        <button
                                                            key={channel}
                                                            onClick={() => setPaymentChannel(channel)}
                                                            className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${paymentChannel === channel ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {channel === 'Cash' ? '现金收讫' : channel === 'Wechat' ? '微信支付' : channel === 'Alipay' ? '支付宝' : '银行转账'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">应付合计</span>
                                                    <span className="text-lg font-mono font-bold text-slate-900">¥ {parseFloat(selectedCourse.price.replace(/[^0-9.-]+/g, "")).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">支付方式</span>
                                                    <span className="text-slate-900 font-bold">{paymentChannel}</span>
                                                </div>
                                                <div className="h-px bg-slate-200"></div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-800 font-extrabold uppercase tracking-widest text-[10px]">实付金额</span>
                                                    <span className="text-2xl font-mono font-bold text-blue-600">¥ {parseFloat(selectedCourse.price.replace(/[^0-9.-]+/g, "")).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleEnroll}
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                                <>
                                                    <PlusCircle size={20} />
                                                    <span>确认报名并登记缴费</span>
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
            `}} />
        </div>
    );
};
