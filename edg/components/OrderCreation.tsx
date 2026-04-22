/**
 * OrderCreation.tsx - 报名创建订单页
 *
 * 所在模块：报名缴费中心 -> 创建订单
 * 功能：
 *   - 管理员/校区管理员为学员创建新的报名订单
 *   - 包含学员信息确认、报名核心信息（校区/课程/等级/班级/课时/开课日期）、优惠减免、
 *     支付方式、分期方案等完整表单
 *   - 右侧有费用结算预览卡，支持实时计算折扣后应付金额
 * 使用方：总部管理员、校区管理员（被 App.tsx / Payments 等路由调用）
 */

import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  BookOpen,
  Wallet,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  ChevronDown,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  AlertCircle,
  Save,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Users,
  Percent,
  Calculator,
  Info
} from 'lucide-react';

/**
 * 订单创建组件 Props
 * - onBack: 点击左上角返回按钮触发
 * - onSuccess: 成功创建订单后回调，携带订单 ID（通常用于跳转到订单详情）
 */
interface OrderCreationProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

import { useStore } from '../store';

/**
 * OrderCreation 主组件
 * - 渲染三个核心表单卡：学员信息 / 报名核心信息 / 费用与支付
 * - 右侧黑色结算卡实时显示原价/优惠/应付金额
 * - 底部固定操作栏提供保存草稿 / 确认创建
 * 关键交互：
 *   1) 选择学员 -> 自动填充校区与家长信息
 *   2) 选择课程 -> 等级联动刷新、单价按课程总课时反推
 *   3) 优惠策略切换会重置 discountValue
 *   4) 点击"确认创建"校验后调用 store.createOrder
 */
export const OrderCreation: React.FC<OrderCreationProps> = ({ onBack, onSuccess }) => {
  const { students, courses, campuses, fetchCampuses, createOrder, addToast, currentUser } = useStore();

  useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);
  // 校区端：校区锁定为当前登录校区；总部端：允许选择
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const lockedCampusName = isCampusAdmin ? (currentUser?.campusName || '本校区') : '';
  // --- Form State ---
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [campus, setCampus] = useState(lockedCampusName || '总校区');
  const [courseId, setCourseId] = useState('');
  const [level, setLevel] = useState('');
  const [classId, setClassId] = useState('pending'); // pending = 待分班
  const [lessons, setLessons] = useState(20);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // --- Finance State ---
  const [discountType, setDiscountType] = useState<'none' | 'coupon' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [showParentInfo, setShowParentInfo] = useState(false);

  // --- Derived State ---
  const student = useMemo(() => (students || []).find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const course = useMemo(() => (courses || []).find(c => c.id === courseId), [courses, courseId]);

  // Note: Standardize unit prices, fallback to 150
  const courseUnitPrice = useMemo(() => {
    if (!course) return 150;
    const priceStr = course.price.replace(/[^\d.]/g, '');
    return parseFloat(priceStr) / (course.totalLessons || 1) || 150;
  }, [course]);

  const originalPrice = useMemo(() => {
    if (!course) return 0;
    return lessons * courseUnitPrice;
  }, [course, lessons, courseUnitPrice]);

  const discountAmount = useMemo(() => {
    if (discountType === 'none') return 0;
    if (discountType === 'amount') return discountValue;
    if (discountType === 'percent') return originalPrice * (discountValue / 100);
    if (discountType === 'coupon') return Math.min(originalPrice, 200); // Fixed mock coupon
    return 0;
  }, [discountType, discountValue, originalPrice]);

  const payableAmount = Math.max(0, originalPrice - discountAmount);
  const installmentAmount = isInstallment ? (payableAmount / installmentCount).toFixed(2) : 0;

  // --- Handlers ---
  const handleStudentSearch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStudentId(e.target.value);
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCourseId(e.target.value);
    setLevel(''); // Reset level when course changes
  };

  const handleSubmit = () => {
    if (!selectedStudentId || !courseId) {
      addToast('请先完成学员与课程的选择', 'warning');
      return;
    }

    // 校区端：直接用当前登录校区 ID；总部端：按选择的校区名映射
    const campusId = isCampusAdmin
      ? (currentUser?.campus_id || '')
      : ((campuses || []).find(c => c.name === campus)?.id || 'C001');

    // 执行 Store 动作，完成订单创建与资产流转
    const orderId = createOrder({
      studentId: selectedStudentId,
      courseId: courseId,
      classId: classId,
      campusId: campusId,
      lessons: lessons,
      amount: payableAmount,
      paymentMethod: paymentMethod,
      notes: notes
    });

    onSuccess(orderId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">报名创建订单</h1>
        </div>
        <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <span>报名缴费</span>
          <ElmIcon name="arrow-right" size={16} />
          <span className="text-slate-600">创建订单</span>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Form Column */}
        <div className="flex-1 space-y-8 w-full">

          {/* A: Student Information Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><ElmIcon name="user" size={16} /></div>
                <h3 className="font-bold text-slate-800 tracking-tight">学员信息确认</h3>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <ElmIcon name="plus" size={16} /> 注册新学员
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">学员选择 <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <ElmIcon name="search" size={16} />
                    <select
                      value={selectedStudentId}
                      onChange={handleStudentSearch}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                    >
                      <option value="">点击搜索或选择学员...</option>
                      {(students || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                    </select>
                    <ElmIcon name="arrow-down" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">所属校区</label>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-sm font-bold text-slate-500">
                    {student ? student.campus : '请先选择学员'}
                  </div>
                </div>
              </div>

              {student && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员姓名</p>
                    <p className="text-sm font-bold text-slate-900">{student.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">联系电话</p>
                    <p className="text-sm font-bold text-slate-900">{student.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">当前状态</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                      {student.status === 'active' ? '在读' : '潜在'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">教务 UID</p>
                    <p className="text-sm font-bold text-slate-400 font-mono tracking-tighter">{student.id}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={() => setShowParentInfo(!showParentInfo)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  <ElmIcon name="arrow-right" size={16} />
                  {showParentInfo ? '收起家长联系信息' : '展开家长联系信息'}
                </button>
                {showParentInfo && student && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">家长姓名</p>
                      <p className="text-sm font-bold text-slate-700">{student.parentName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">家长电话</p>
                      <p className="text-sm font-bold text-slate-700">{student.parentPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* B: Enrollment Information Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><ElmIcon name="reading" size={16} /></div>
                <h3 className="font-bold text-slate-800 tracking-tight">报名核心信息</h3>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">意向校区 <span className="text-red-500">*</span></label>
                  {isCampusAdmin ? (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed">
                      {lockedCampusName} <span className="text-[10px] font-normal text-slate-400 ml-2">（当前校区，不可修改）</span>
                    </div>
                  ) : (
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                    >
                      {(campuses || []).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">选择课程项目 <span className="text-red-500">*</span></label>
                  <select
                    value={courseId}
                    onChange={handleCourseChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                  >
                    <option value="">请选择课程...</option>
                    {(courses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">课程等级</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={!courseId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 disabled:opacity-50"
                  >
                    <option value="">{courseId ? '选择级别' : '请先选课程'}</option>
                    {course?.levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">入读班级</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                  >
                    <option value="pending">待分班 (由教务后续分配)</option>
                    <option value="C001">24春季UI精品1班 (余位 2)</option>
                    <option value="C002">全栈架构周六班 (余位 12)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">购买课时量</label>
                  <div className="relative group">
                    <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="number"
                      value={lessons}
                      onChange={(e) => setLessons(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">预计开课日期</label>
                  <div className="relative group">
                    <ElmIcon name="calendar" size={16} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">备注说明</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="选填：如特殊需求、跟进记录等..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-600 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* C: Finance & Payment Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Wallet size={20} /></div>
                <h3 className="font-bold text-slate-800 tracking-tight">费用与支付结算</h3>
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Discount Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Percent size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">优惠减免策略</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'none', label: '无优惠' },
                    { id: 'coupon', label: '新学员专享 (立减¥200)' },
                    { id: 'percent', label: '折扣比例 (%)' },
                    { id: 'amount', label: '固定金额减免 (¥)' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => { setDiscountType(type.id as any); setDiscountValue(0); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all border ${discountType === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {(discountType === 'percent' || discountType === 'amount') && (
                  <div className="flex items-center gap-4 animate-in slide-in-from-left-4 max-w-xs">
                    <div className="flex-1 relative group">
                      <input
                        type="number"
                        placeholder={discountType === 'percent' ? "输入折扣 (0-100)" : "输入减免金额"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{discountType === 'percent' ? '%' : '¥'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">支付结算方式</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'wechat', label: '微信支付', icon: <Smartphone size={18} /> },
                    { id: 'alipay', label: '支付宝', icon: <Smartphone size={18} /> },
                    { id: 'cash', label: '现金支付', icon: <Banknote size={18} /> },
                    { id: 'card', label: '银行卡', icon: <CreditCard size={18} /> },
                    { id: 'transfer', label: '对公转账', icon: <ElmIcon name="house" size={16} /> }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${paymentMethod === method.id ? 'bg-blue-50 border-blue-600 text-blue-600 ring-4 ring-blue-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                      {method.icon}
                      <span className="text-[11px] font-bold uppercase tracking-widest">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Installment Section */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isInstallment ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>
                    <ElmIcon name="circle-check" size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">学费分期支付</h4>
                    <p className="text-xs text-slate-400 mt-0.5">开启后可生成多期账单计划</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setIsInstallment(!isInstallment)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${isInstallment ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isInstallment ? 'left-8' : 'left-1'}`}></div>
                  </button>

                  {isInstallment && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                      <span className="text-xs font-bold text-slate-500">分期期数:</span>
                      <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                        {[3, 6, 12].map(num => (
                          <button
                            key={num}
                            onClick={() => setInstallmentCount(num)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${installmentCount === num ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                          >{num}期</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar: Fee Summary */}
        <div className="w-full lg:w-[360px] space-y-6 sticky top-24">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>

            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">费用结算预览</span>
              <Info size={16} className="opacity-40" />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium opacity-60">课程原价</span>
                <span className="font-bold font-mono">¥ {originalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium opacity-60">课时包 ({lessons} 课时)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded uppercase tracking-wider">自动计算</span>
              </div>

              <div className="flex justify-between items-center text-sm text-red-400 font-bold">
                <span className="font-medium opacity-80">优惠减免</span>
                <span className="font-mono">-{discountAmount > 0 ? `¥ ${discountAmount.toFixed(2)}` : '¥ 0.00'}</span>
              </div>

              <div className="h-px bg-white/10 my-6"></div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">最终应付金额</p>
                <div className="text-center">
                  <span className="text-sm font-bold opacity-80 mr-1">¥</span>
                  <span className="text-5xl font-bold font-mono tracking-tighter text-emerald-400">
                    {payableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {isInstallment && (
                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">分期首付计划</p>
                    <p className="text-xs font-bold">¥ {installmentAmount} <span className="text-white/40 font-normal">× {installmentCount}期</span></p>
                  </div>
                  <ElmIcon name="circle-check" size={16} />
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.75rem] font-bold shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save size={20} />
              确认创建并支付订单
            </button>
            <p className="text-center text-[10px] mt-4 opacity-40 font-bold uppercase tracking-widest">确认后系统将立即下发缴费通知</p>
          </div>

          {/* Capacity Alert card */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ElmIcon name="warning" size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">班级库存提示</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">所选“24春季UI精品1班”当前剩余名额较少 (2)，建议尽快完成确认操作。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Fixed Actions (Secondary) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 flex items-center justify-between z-30 lg:left-64">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          返回列表
        </button>
        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">
            保存为草稿
          </button>
          <button
            onClick={handleSubmit}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            确认创建订单
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
