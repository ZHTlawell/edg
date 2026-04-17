
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import {
    CreditCard,
    PlusCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Copy,
    BookOpen,
    Users
} from 'lucide-react';
import { useStore } from '../store';

type Step = 'select-student' | 'select-course' | 'select-class' | 'confirm' | 'payment' | 'success';

interface PaymentsProps {
    initialTab?: 'enroll' | 'orders';
    onViewOrder?: (orderId: string) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ initialTab = 'enroll', onViewOrder }) => {
    const {
        students,
        courses,
        classes,
        campuses,
        orders,
        createOrder,
        processPayment,
        createStudentByAdmin,
        addToast,
        currentUser,
        fetchClasses,
        fetchOrders
    } = useStore();

    // ─── Top-Level Tab ────────────────────────────────────────────
    const [topTab, setTopTab] = useState<'enroll' | 'orders'>(initialTab);

    // ─── Step Control ────────────────────────────────────────────
    const [step, setStep] = useState<Step>('select-student');
    const [studentTab, setStudentTab] = useState<'new' | 'existing'>('new');
    const [selectedCampus, setSelectedCampus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [paymentChannel, setPaymentChannel] = useState('Cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultOrderId, setResultOrderId] = useState('');

    // ─── New Student Form ────────────────────────────────────────
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newGender, setNewGender] = useState('male');
    const [newCampusId, setNewCampusId] = useState('');
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);

    useEffect(() => { fetchClasses(); }, []);

    // ─── Derived Data ────────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        return (students || []).filter(s => {
            const matchesCampus = !selectedCampus || s.campus === selectedCampus || s.campus_id === selectedCampus;
            const matchesSearch = !searchTerm || s.name.includes(searchTerm) || s.phone?.includes(searchTerm);
            return matchesCampus && matchesSearch;
        });
    }, [students, selectedCampus, searchTerm]);

    const selectedStudent = useMemo(() => (students || []).find(s => s.id === selectedStudentId), [students, selectedStudentId]);
    const selectedCourse = useMemo(() => (courses || []).find(c => c.id === selectedCourseId), [courses, selectedCourseId]);
    const selectedClass = useMemo(() => (classes || []).find(c => c.id === selectedClassId), [classes, selectedClassId]);

    // 筛选出 该课程关联的、有空位的班级
    const availableClasses = useMemo(() => {
        if (!selectedCourseId) return [];
        return (classes || []).filter(c => {
            const matchCourse = c.course_id === selectedCourseId || c.course?.id === selectedCourseId;
            const hasCapacity = (c.capacity || 0) > (c.enrolled || 0);
            return matchCourse && hasCapacity;
        });
    }, [classes, selectedCourseId]);

    const coursePrice = useMemo(() => {
        if (!selectedCourse) return 0;
        return parseFloat(selectedCourse.price.replace(/[^0-9.-]+/g, "")) || 0;
    }, [selectedCourse]);

    const unitPrice = useMemo(() => {
        if (!selectedCourse || !selectedCourse.totalLessons) return 0;
        return coursePrice / selectedCourse.totalLessons;
    }, [coursePrice, selectedCourse]);

    // ─── Handlers ────────────────────────────────────────────────
    const handleCreateStudent = async () => {
        if (!newName.trim() || !newPhone.trim()) {
            addToast('请填写姓名和手机号', 'error');
            return;
        }
        if (!/^1\d{10}$/.test(newPhone)) {
            addToast('请输入正确的11位手机号', 'error');
            return;
        }
        setIsCreatingStudent(true);
        try {
            const campusName = (campuses || []).find(c => c.id === newCampusId)?.name;
            const result = await createStudentByAdmin({
                name: newName.trim(),
                phone: newPhone.trim(),
                gender: newGender,
                campus_id: newCampusId || undefined,
                campusName: campusName || undefined,
            });
            setSelectedStudentId(result.studentId);
            setCreatedCredentials({ username: result.username, password: result.defaultPassword });
            setSelectedCourseId('');
            setSelectedClassId('');
            setStep('select-course');
        } catch (e) {
            // error already toasted in store
        } finally {
            setIsCreatingStudent(false);
        }
    };

    const handleSelectStudent = (id: string) => {
        setSelectedStudentId(id);
        setCreatedCredentials(null);
        setSelectedCourseId('');
        setSelectedClassId('');
        setStep('select-course');
    };

    const handleSelectCourse = (id: string) => {
        setSelectedCourseId(id);
        setSelectedClassId('');
        setStep('confirm'); // 跳过选班级（后端 processPayment 自动分班）
    };

    const handleSelectClass = (id: string) => {
        setSelectedClassId(id);
        setStep('confirm');
    };

    const handleSkipClass = () => {
        setSelectedClassId('');
        setStep('confirm');
    };

    const handleConfirmToPayment = () => {
        setStep('payment');
    };

    const handleSubmit = async () => {
        if (!selectedStudentId || !selectedCourseId) return;
        setIsSubmitting(true);
        try {
            // 后端权威计算金额与课时数，前端不传 amount/totalQty
            const orderId = await createOrder({
                studentId: selectedStudentId,
                courseId: selectedCourseId,
                classId: selectedClassId || undefined,
            });
            await processPayment({
                orderId,
                amount: coursePrice,  // 后端会校验此金额与订单一致
                channel: paymentChannel,
                campusId: selectedStudent?.campus_id || currentUser?.campus_id || 'HQ',
                classId: selectedClassId || undefined,
            });
            setResultOrderId(orderId);
            setStep('success');
        } catch (error: any) {
            addToast(error?.message || '报名失败，请重试', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep('select-student');
        setSelectedStudentId('');
        setSelectedCourseId('');
        setSelectedClassId('');
        setPaymentChannel('Cash');
        setResultOrderId('');
        setCreatedCredentials(null);
        setNewName('');
        setNewPhone('');
        setNewGender('male');
        setNewCampusId('');
    };

    const handleContinue = () => {
        // 保持学员，重新选课
        setSelectedCourseId('');
        setSelectedClassId('');
        setPaymentChannel('Cash');
        setResultOrderId('');
        setStep('select-course');
    };

    // ─── Step Indicator ──────────────────────────────────────────
    const STEPS: { key: Step; label: string }[] = [
        { key: 'select-student', label: '选择学员' },
        { key: 'select-course', label: '选择课程' },
        // select-class 已移除：后端 processPayment 自动分班
        { key: 'confirm', label: '确认信息' },
        { key: 'payment', label: '缴费登记' },
        { key: 'success', label: '完成' },
    ];
    const currentStepIdx = STEPS.findIndex(s => s.key === step);

    // 订单记录列表数据
    const [orderSearch, setOrderSearch] = useState('');
    const [orderPage, setOrderPage] = useState(1);
    const orderPageSize = 10;

    useEffect(() => {
        if (topTab === 'orders') {
            const campusId = currentUser?.role === 'campus_admin' ? currentUser.campus_id : undefined;
            fetchOrders(campusId);
        }
    }, [topTab]);

    const filteredOrders = useMemo(() => {
        return (orders || []).filter(o => {
            if (!orderSearch) return true;
            const kw = orderSearch.toLowerCase();
            return (o.course?.name || '').toLowerCase().includes(kw) ||
                (o.student_id || '').includes(kw) ||
                (o.id || '').includes(kw);
        }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [orders, orderSearch]);

    const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
    const pagedOrders = filteredOrders.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize);

    const statusMap: Record<string, { label: string; cls: string }> = {
        PAID: { label: '已支付', cls: 'bg-emerald-50 text-emerald-600' },
        PENDING_PAYMENT: { label: '待支付', cls: 'bg-amber-50 text-amber-600' },
        PARTIAL_REFUNDED: { label: '部分退款', cls: 'bg-blue-50 text-blue-600' },
        REFUNDED: { label: '已退款', cls: 'bg-slate-100 text-slate-500' },
        VOIDED: { label: '已作废', cls: 'bg-red-50 text-red-500' },
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        {topTab === 'enroll' ? '报名缴费中心' : '订单记录'}
                        <div className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 tracking-widest font-bold">
                            {topTab === 'enroll' ? '报名缴费' : '订单管理'}
                        </div>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        {topTab === 'enroll' ? '为学员办理课程报名与线下缴费登记' : '查看全部报名订单与支付状态'}
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setTopTab('enroll')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${topTab === 'enroll' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        报名缴费
                    </button>
                    <button
                        onClick={() => setTopTab('orders')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${topTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        订单记录 ({orders.length})
                    </button>
                </div>
            </div>

            {topTab === 'orders' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    {/* Search */}
                    <div className="p-6 border-b border-slate-50">
                        <div className="relative max-w-md">
                            <ElmIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="搜索课程名称、订单号..."
                                value={orderSearch}
                                onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                            />
                        </div>
                    </div>
                    {/* Table */}
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单号</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">课程</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">金额</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">课时</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">状态</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">下单时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {pagedOrders.length > 0 ? pagedOrders.map(o => {
                                const st = statusMap[o.status] || { label: o.status, cls: 'bg-slate-100 text-slate-500' };
                                return (
                                    <tr key={o.id} onClick={() => onViewOrder?.(o.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{o.id.slice(0, 8).toUpperCase()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{o.course?.name || '—'}</td>
                                        <td className="px-6 py-4 text-sm font-mono font-bold text-emerald-600">¥{o.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{o.total_qty} H</td>
                                        <td className="px-6 py-4"><span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${st.cls}`}>{st.label}</span></td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-300 text-sm italic">暂无订单记录</td></tr>
                            )}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-50 flex items-center justify-between px-6">
                        <p className="text-xs text-slate-400">
                            共 <span className="text-slate-700 font-bold">{filteredOrders.length}</span> 条{orderSearch && '（已筛选）'}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}
                                className={`p-1.5 rounded-lg ${orderPage === 1 ? 'text-slate-200' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                <ElmIcon name="arrow-left" size={14} />
                            </button>
                            <span className="text-xs font-bold text-slate-500 px-2">{orderPage} / {orderTotalPages}</span>
                            <button onClick={() => setOrderPage(p => Math.min(orderTotalPages, p + 1))} disabled={orderPage === orderTotalPages}
                                className={`p-1.5 rounded-lg ${orderPage === orderTotalPages ? 'text-slate-200' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                <ElmIcon name="arrow-right" size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {topTab === 'enroll' && <>
            {/* Step Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
                <div className="flex items-center gap-2">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <div className={`flex items-center gap-2 ${i <= currentStepIdx ? 'text-blue-600' : 'text-slate-300'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                    i < currentStepIdx ? 'bg-blue-600 border-blue-600 text-white' :
                                    i === currentStepIdx ? 'border-blue-600 text-blue-600 bg-blue-50' :
                                    'border-slate-200 text-slate-300'
                                }`}>
                                    {i < currentStepIdx ? <CheckCircle2 size={14} /> : i + 1}
                                </div>
                                <span className={`text-xs font-bold hidden sm:inline ${i <= currentStepIdx ? 'text-slate-700' : 'text-slate-300'}`}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < currentStepIdx ? 'bg-blue-500' : 'bg-slate-100'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════ Step 1: New / Select Student ═══════════════════════ */}
            {step === 'select-student' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><ElmIcon name="user" size={18} /> 学员信息</h2>
                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        <button onClick={() => setStudentTab('new')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${studentTab === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <PlusCircle size={14} className="inline mr-1.5 -mt-0.5" />新建学员
                        </button>
                        <button onClick={() => setStudentTab('existing')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${studentTab === 'existing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <ElmIcon name="search" size={14} className="inline mr-1.5 -mt-0.5" />搜索已有学员
                        </button>
                    </div>

                    {studentTab === 'new' ? (
                        /* ─── New Student Form ─── */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">姓名 <span className="text-red-400">*</span></label>
                                    <input type="text" placeholder="输入学员姓名" value={newName} onChange={e => setNewName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">手机号 <span className="text-red-400">*</span></label>
                                    <input type="tel" placeholder="11位手机号（将作为登录账号）" value={newPhone} onChange={e => setNewPhone(e.target.value)} maxLength={11}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">性别</label>
                                    <div className="flex gap-3">
                                        {[{ v: 'male', l: '男' }, { v: 'female', l: '女' }].map(g => (
                                            <button key={g.v} onClick={() => setNewGender(g.v)}
                                                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${newGender === g.v ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                {g.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">所属校区</label>
                                    <select value={newCampusId} onChange={e => setNewCampusId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                                        <option value="">请选择校区</option>
                                        {(campuses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                                <ElmIcon name="warning" size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700">系统将自动生成登录账号（手机号）和初始密码（手机号后6位），报名成功后请告知学员。</p>
                            </div>
                            <button onClick={handleCreateStudent} disabled={isCreatingStudent || !newName.trim() || !newPhone.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                                {isCreatingStudent ? <Loader2 className="animate-spin" size={18} /> : <><PlusCircle size={18} /> 创建学员并继续</>}
                            </button>
                        </div>
                    ) : (
                        /* ─── Search Existing Student ─── */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)}>
                                    <option value="">全部校区</option>
                                    {(campuses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input type="text" placeholder="输入姓名或手机号搜索..." className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <button key={student.id} onClick={() => handleSelectStudent(student.id)}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border bg-white border-slate-50 hover:border-blue-300 hover:bg-blue-50/40 text-slate-600 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{student.name.charAt(0)}</div>
                                        <div className="text-left flex-1">
                                            <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{student.phone} {student.campus ? `· ${student.campus}` : ''}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                                    </button>
                                )) : (
                                    <div className="py-12 text-center text-slate-300 text-sm">未找到匹配学员</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════ Step 2: Select Course ═══════════════════════ */}
            {step === 'select-course' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} /> 选择报读课程</h2>
                        <button onClick={() => setStep('select-student')} className="text-xs text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1"><ArrowLeft size={14} /> 重选学员</button>
                    </div>
                    {/* Student badge */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{selectedStudent?.name.charAt(0)}</div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">{selectedStudent?.name}</p>
                            <p className="text-[11px] text-slate-400">{selectedStudent?.phone}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(courses || []).filter(c => c.status === 'enabled').map(course => {
                            const price = parseFloat(course.price.replace(/[^0-9.-]+/g, "")) || 0;
                            const up = price / (course.totalLessons || 1);
                            return (
                                <button key={course.id} onClick={() => handleSelectCourse(course.id)}
                                    className="p-5 rounded-2xl border text-left transition-all bg-white border-slate-100 hover:border-blue-300 hover:shadow-md group">
                                    <p className="text-sm font-bold text-slate-800 mb-1">{course.name}</p>
                                    <p className="text-[11px] text-slate-400 mb-3">{course.category} · {course.instructor || '待分配'}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-bold text-blue-600 font-mono">{course.price}</span>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block">{course.totalLessons} 课时</span>
                                            <span className="text-[10px] text-slate-400 block">约 ¥{up.toFixed(0)}/课时</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {(courses || []).filter(c => c.status === 'enabled').length === 0 && (
                        <div className="py-16 text-center text-slate-300 text-sm">暂无可选课程</div>
                    )}
                </div>
            )}

            {/* ═══════════════════════ Step 3: Select Class ═══════════════════════ */}
            {step === 'select-class' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} /> 选择班级</h2>
                        <button onClick={() => setStep('select-course')} className="text-xs text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1"><ArrowLeft size={14} /> 重选课程</button>
                    </div>
                    {/* Course badge */}
                    <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <BookOpen size={18} className="text-blue-600" />
                        <div>
                            <p className="text-sm font-bold text-slate-800">{selectedCourse?.name}</p>
                            <p className="text-[11px] text-blue-500 font-bold">{selectedCourse?.price} · {selectedCourse?.totalLessons} 课时</p>
                        </div>
                    </div>
                    {availableClasses.length > 0 ? (
                        <div className="space-y-3">
                            {availableClasses.map(cls => (
                                <button key={cls.id} onClick={() => handleSelectClass(cls.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border bg-white border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group">
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs">班</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{cls.name}</p>
                                        <p className="text-[11px] text-slate-400">{cls.teacher?.name || cls.teacherName || '待分配'} · 已报 {cls.enrolled}/{cls.capacity} 人</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mb-1">
                                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${((cls.enrolled || 0) / (cls.capacity || 1)) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] text-slate-400">剩 {(cls.capacity || 0) - (cls.enrolled || 0)} 位</span>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-slate-300 text-sm">该课程暂无可用班级</div>
                    )}
                    <button onClick={handleSkipClass} className="w-full py-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold hover:border-blue-300 hover:text-blue-500 transition-all">
                        暂不分班，直接报名
                    </button>
                </div>
            )}

            {/* ═══════════════════════ Step 4: Confirm ═══════════════════════ */}
            {step === 'confirm' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 size={18} /> 确认报名信息</h2>
                        <button onClick={() => setStep('select-course')} className="text-xs text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1"><ArrowLeft size={14} /> 返回</button>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">学员信息</p>
                                <p className="text-sm font-bold text-slate-800">{selectedStudent?.name}</p>
                                <p className="text-xs text-slate-400">{selectedStudent?.phone}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">报读课程</p>
                                <p className="text-sm font-bold text-slate-800">{selectedCourse?.name}</p>
                                <p className="text-xs text-slate-400">{selectedCourse?.category}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">分配班级</p>
                                <p className="text-sm font-bold text-slate-800">{selectedClass?.name || '暂不分班'}</p>
                                {selectedClass && <p className="text-xs text-slate-400">{selectedClass.teacher?.name || selectedClass.teacherName || ''}</p>}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">课时明细</p>
                                <p className="text-sm font-bold text-slate-800">{selectedCourse?.totalLessons} 课时</p>
                                <p className="text-xs text-slate-400">单价 ¥{unitPrice.toFixed(2)}/课时</p>
                            </div>
                        </div>
                        <div className="h-px bg-slate-200" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-600">应付金额</span>
                            <span className="text-2xl font-mono font-bold text-blue-600">¥{coursePrice.toFixed(2)}</span>
                        </div>
                    </div>
                    <button onClick={handleConfirmToPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                        信息确认无误，去缴费 <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* ═══════════════════════ Step 5: Payment ═══════════════════════ */}
            {step === 'payment' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18} /> 缴费登记</h2>
                        <button onClick={() => setStep('confirm')} className="text-xs text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1"><ArrowLeft size={14} /> 返回</button>
                    </div>

                    {/* Quick summary */}
                    <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex-1">
                            <p className="text-xs text-slate-400">学员: <span className="text-slate-700 font-bold">{selectedStudent?.name}</span></p>
                            <p className="text-xs text-slate-400">课程: <span className="text-slate-700 font-bold">{selectedCourse?.name}</span> · {selectedCourse?.totalLessons} 课时</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">应付</p>
                            <p className="text-xl font-mono font-bold text-blue-600">¥{coursePrice.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">选择支付方式</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { key: 'Cash', label: '现金收讫', icon: 'money' },
                                { key: 'Wechat', label: '微信支付', icon: 'chat-line-round' },
                                { key: 'Alipay', label: '支付宝', icon: 'wallet' },
                                { key: 'Bank', label: '银行转账', icon: 'credit-card' }
                            ].map(ch => (
                                <button key={ch.key} onClick={() => setPaymentChannel(ch.key)}
                                    className={`py-3.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        paymentChannel === ch.key ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                    }`}>
                                    <ElmIcon name={ch.icon} size={16} />
                                    {ch.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <PlusCircle size={20} />
                                <span>确认缴费 ¥{coursePrice.toFixed(2)}</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* ═══════════════════════ Step 6: Success ═══════════════════════ */}
            {step === 'success' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center space-y-6 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold text-slate-800">报名缴费成功</h2>
                        <p className="text-sm text-slate-400">课时资产已自动创建，学员可在个人中心查看</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 inline-flex items-center gap-3 mx-auto border border-slate-100">
                        <span className="text-xs text-slate-400">订单编号</span>
                        <span className="text-sm font-mono font-bold text-slate-700">{resultOrderId?.substring(0, 16) || '-'}</span>
                        <button onClick={() => { navigator.clipboard?.writeText(resultOrderId); addToast('已复制', 'success'); }} className="text-slate-300 hover:text-blue-500">
                            <Copy size={14} />
                        </button>
                    </div>
                    {/* 新建学员时显示账号密码 */}
                    {createdCredentials && (
                        <div className="bg-blue-50 rounded-xl p-4 mx-auto max-w-sm space-y-2 border border-blue-200 text-left">
                            <p className="text-xs font-bold text-blue-700 mb-2">学员登录信息（请告知学员）</p>
                            <div className="flex justify-between text-xs"><span className="text-blue-400">登录账号</span>
                                <span className="font-mono font-bold text-blue-800">{createdCredentials.username}</span>
                            </div>
                            <div className="flex justify-between text-xs"><span className="text-blue-400">初始密码</span>
                                <span className="font-mono font-bold text-blue-800">{createdCredentials.password}</span>
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-50 rounded-xl p-4 mx-auto max-w-sm space-y-2 border border-slate-100 text-left">
                        <div className="flex justify-between text-xs"><span className="text-slate-400">学员</span><span className="font-bold text-slate-700">{selectedStudent?.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400">课程</span><span className="font-bold text-slate-700">{selectedCourse?.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400">班级</span><span className="font-bold text-slate-700">{selectedClass?.name || '暂未分班'}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400">课时</span><span className="font-bold text-slate-700">{selectedCourse?.totalLessons} 课时</span></div>
                        <div className="h-px bg-slate-200" />
                        <div className="flex justify-between text-sm"><span className="font-bold text-slate-600">实付金额</span><span className="font-bold text-blue-600">¥{coursePrice.toFixed(2)}</span></div>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2">
                            <PlusCircle size={16} /> 继续为该学员报名
                        </button>
                        <button onClick={handleReset} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all">
                            返回首页
                        </button>
                    </div>
                </div>
            )}
            </>}
        </div>
    );
};
