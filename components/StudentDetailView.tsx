import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Archive,
  Share2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  History,
  Plus,
  Filter,
  Search,
  FileText,
  ListFilter,
  User,
  Inbox
} from 'lucide-react';
import { Student, AssetLedger, Order, AttendanceRecord } from '../types';
import { useStore } from '../store';
import { ConfirmModal, PromptModal } from './ActionModals';

interface StudentDetailViewProps {
  student: Student;
  onBack: () => void;
}

type TabType = 'basic' | 'enrollment' | 'payment' | 'progress' | 'grades' | 'attendance' | 'homework';

// Reusable Empty State Component
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
    <div className="p-5 bg-slate-50 rounded-full text-slate-300 mb-5">
      {icon}
    </div>
    <h4 className="text-slate-800 font-bold mb-2 text-lg">{title}</h4>
    <p className="text-slate-400 text-sm max-w-[320px] leading-relaxed">{description}</p>
    <button className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
      <Plus size={16} /> 立即添加记录
    </button>
  </div>
);

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student: initialStudent, onBack }) => {
  const { orders, attendanceRecords, assetAccounts, assetLedgers, courses, classes } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  // 始终从 Store 获取最新的学员数据
  const student = useStore(state => state.students.find(s => s.id === initialStudent.id) || initialStudent);

  // 衍生数据：该学员的资产、订单、流水与考勤
  const studentOrders = useMemo(() => orders.filter(o => o.student_id === student.id), [orders, student.id]);
  const studentAttendance = useMemo(() => attendanceRecords.filter(r => r.student_id === student.id), [attendanceRecords, student.id]);
  const studentLedgers = useMemo(() => assetLedgers.filter(l => l.student_id === student.id).sort((a, b) => new Date(b.occurTime).getTime() - new Date(a.occurTime).getTime()), [assetLedgers, student.id]);
  const studentAssets = useMemo(() => assetAccounts.filter(acc => acc.student_id === student.id), [assetAccounts, student.id]);

  const { requestRefund, transferClass, addToast } = useStore();

  const [refundConfirm, setRefundConfirm] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [transferPrompt, setTransferPrompt] = useState<{ isOpen: boolean; course_id: string | null }>({ isOpen: false, course_id: null });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null); // To store the course_id for transfer

  const executeRefund = async () => {
    const order = refundConfirm.order;
    if (order) {
      // Find the specific asset account for this course to get the accountId
      const targetAccount = assetAccounts.find(
        acc => acc.student_id === order.student_id && acc.course_id === order.course_id
      );

      if (targetAccount) {
        await requestRefund({
          account_id: targetAccount.id,
          refundQty: order.lessons,
          orderId: order.id
        });
        addToast('退费申请已提交', 'success');
      } else {
        addToast('找不到对应的课时账户，无法核减资产', 'error');
      }
    }
    setRefundConfirm({ isOpen: false, order: null });
  };

  const handleRefund = (order: Order) => {
    setRefundConfirm({ isOpen: true, order });
  };

  const executeTransfer = (choice: string) => {
    if (!selectedCourseId) {
      setTransferPrompt({ isOpen: false, course_id: null });
      return;
    }

    const availableClasses = classes.filter(c => c.course_id === selectedCourseId && c.id !== student.class_id);
    const index = parseInt(choice) - 1;
    const targetClass = availableClasses[index];

    if (targetClass) {
      // Simplified transfer: finding the account for old course
      const oldAccount = assetAccounts.find(acc =>
        acc.student_id === student.id &&
        acc.course_id === selectedCourseId
      );

      if (oldAccount) {
        transferClass(student.id, oldAccount.id, targetClass.id);
        addToast(`已成功将学员转入班级：${targetClass.name}`, 'success');
      } else {
        addToast('找不到学员在该课程的资产账户', 'error');
      }
    } else {
      addToast('输入的班级编号无效', 'error');
    }
    setTransferPrompt({ isOpen: false, course_id: null });
    setSelectedCourseId(null);
  };

  const handleTransfer = (currentCourse_id: string) => {
    const availableClasses = classes.filter(c => c.course_id === currentCourse_id && c.id !== student.class_id);
    if (availableClasses.length === 0) {
      addToast('当前课程暂无其他可选班级。', 'warning');
      return;
    }
    setSelectedCourseId(currentCourse_id);
    setTransferPrompt({ isOpen: true, course_id: currentCourse_id });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基本信息' },
    { id: 'enrollment', label: '报名记录' },
    { id: 'payment', label: '资产账务' },
    { id: 'progress', label: '学习进度' },
    { id: 'grades', label: '成绩统计' },
    { id: 'attendance', label: '考勤日志' },
    { id: 'homework', label: '作业批改' },
  ];

  const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  const calculateAge = (birthday?: string) => {
    if (!birthday) return '未知';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthday = (birthday?: string) => {
    if (!birthday) return '未录入';
    const date = new Date(birthday);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1440px] mx-auto">
      {/* Top Header Information Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-0 z-20">
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-slate-200"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${student.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                {student.name.charAt(0)}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{student.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {student.status === 'active' ? '在读' : '非在读'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-8 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-2"><Phone size={15} className="text-slate-300" /> {maskPhone(student.phone)}</span>
                  <span className="flex items-center gap-2"><MapPin size={15} className="text-slate-300" /> {classes.find(c => c.id === student.class_id)?.campus_id || '未知校区'}</span>
                  <span className="flex items-center gap-2"><BookOpen size={15} className="text-blue-400" /> 剩余课时: <b className="text-slate-900">{studentAssets.reduce((sum, acc) => sum + acc.remainingQty, 0)}</b></span>
                  <span className="px-2 py-0.5 bg-slate-50 text-[10px] font-mono text-slate-400 rounded">UID: {student.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all active:scale-95">
              <Archive size={18} /> 归档学员
            </button>
            <button className="flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-200 active:scale-95">
              <Edit size={18} /> 编辑档案
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center px-8 border-t border-slate-100 bg-slate-50/20 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-5 text-sm font-bold transition-all relative flex-shrink-0 group ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)] animate-in fade-in slide-in-from-bottom-2"></div>
              )}
              <div className="absolute inset-x-2 inset-y-3 bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-0"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="min-h-[600px]">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 space-y-10 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <FileText size={18} className="text-blue-500" /> 基本教务属性
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">出生日期</p>
                      <p className="text-base text-slate-900 font-bold">
                        {formatBirthday(student.birthday)}
                        <span className="text-slate-400 font-medium ml-2 text-sm">({calculateAge(student.birthday)}岁)</span>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">证件号码</p>
                      <p className="text-base text-slate-900 font-bold tracking-widest font-mono">3101**********1234</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">最高学历</p>
                      <p className="text-base text-slate-900 font-bold">本科 · 上海交通大学 <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-2">985/211</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">紧急联系人</p>
                      <p className="text-base text-slate-900 font-bold">王美华 <span className="text-slate-400 text-sm font-medium">(母亲)</span> · 139****8888</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <Mail size={18} className="text-emerald-500" /> 联络社交详情
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">常用电子邮箱</p>
                        <p className="text-sm text-slate-800 font-bold">meiling.z@tsinghua.edu.cn</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                        <Share2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">即时通讯 (微信)</p>
                        <p className="text-sm text-slate-800 font-bold underline decoration-emerald-100 underline-offset-4">ZML_DesignPRO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-2"><History size={20} className="text-slate-400" /> 档案日志</span>
                </h3>
                <div className="space-y-8 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {[
                    { user: '教务王老师', action: '修正了 学员手机号', time: '2024-05-18 10:24' },
                    { user: '系统日志', action: '自动同步了 学习进度', time: '2024-05-17 22:15' },
                    { user: '陈主管', action: '批准了 奖学金申请', time: '2024-05-15 14:30' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-5 relative group">
                      <div className="w-[18px] h-[18px] rounded-full bg-blue-500 border-4 border-white shadow-md z-10 mt-1 transition-transform group-hover:scale-125"></div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm text-slate-800 font-bold leading-tight">{log.user}</p>
                        <p className="text-xs text-slate-500">{log.action}</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono pt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollment' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <h4 className="font-bold text-slate-800">在读与历史报名记录</h4>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">核心项目</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAssets.length > 0 ? studentAssets.map(acc => (
                  <tr key={acc.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-base">
                          {courses.find(c => c.id === acc.course_id)?.name || '未知课程'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">资产 ID: {acc.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">有效</span>
                        <button
                          onClick={() => handleTransfer(acc.course_id)}
                          className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                        >
                          办理转班
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="py-20">
                      <EmptyState
                        icon={<BookOpen size={64} />}
                        title="暂无报名记录"
                        description="该学员尚未报名任何课程，请引导其选择合适的课程进行学习。"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h4 className="font-bold text-slate-800">购课订单记录</h4>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">订单号</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">课程项目</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">购入课时</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">实付金额</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">状态</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">支付方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentOrders.length > 0 ? studentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6 font-mono text-xs text-slate-400 font-bold tracking-tighter">{order.id}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 uppercase text-sm leading-tight">
                            {courses.find(c => c.id === order.course_id)?.name || '未知课程'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-mono font-bold tracking-tighter">{order.lessons} 课时</td>
                      <td className="px-8 py-6 text-emerald-600 font-bold font-mono text-base tracking-tighter">¥ {order.amount.toFixed(2)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit uppercase tracking-wider">
                          <CheckCircle2 size={14} /> {order.status === 'paid' ? '已支付' : order.status}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right text-slate-500 font-bold">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-xs"><CreditCard size={16} className="text-slate-300" /> {order.paymentMethod}</div>
                          {order.status === 'paid' && (
                            <button
                              onClick={() => handleRefund(order)}
                              className="text-[10px] text-red-500 hover:text-red-700 hover:underline uppercase tracking-wider"
                            >
                              申请退费
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">暂无订单记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={18} className="text-blue-500" /> 资产变动明细 (Audit Ledger)
                </h4>
              </div>
              <div className="p-8 space-y-3">
                {studentLedgers.map(ledger => (
                  <div key={ledger.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-100 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ledger.businessType === 'BUY' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        {ledger.businessType === 'BUY' ? <Plus size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {ledger.businessType === 'BUY' ? '购入课时' : '上课扣除'}
                          <span className="text-xs text-slate-400 font-medium ml-2 font-mono">#{ledger.refId}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(ledger.occurTime).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${ledger.changeQty > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {ledger.changeQty > 0 ? '+' : ''}{ledger.changeQty} 课时
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono">结余: {ledger.balanceSnapshot}</p>
                    </div>
                  </div>
                ))}
                {studentLedgers.length === 0 && (
                  <p className="text-center py-10 text-slate-300 text-xs font-medium italic">尚未产生任何资产变动流水</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800">全周期考勤档案</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {studentAttendance.length > 0 ? studentAttendance.map((item) => (
                <div key={item.id} className="px-10 py-8 flex items-center justify-between hover:bg-blue-50/10 transition-all group">
                  <div className="flex items-center gap-10">
                    <div className="text-center w-16 flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.createdAt).getMonth() + 1}月</span>
                      <span className="text-2xl font-bold text-slate-900 leading-none mt-1 font-mono tracking-tighter">{new Date(item.createdAt).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {courses.find(c => c.id === item.course_id)?.name || '未知课程'}
                      </p>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-2 mt-2 uppercase tracking-wide">
                        <Clock size={14} className="text-slate-300" /> 课次：#{item.lesson_id} <span className="text-slate-200 mx-2">|</span> 状态：{item.deductStatus === 'completed' ? '已消课' : '待结算'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    {item.status === 'present' && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-inner">
                        <CheckCircle2 size={18} /> 出席
                      </div>
                    )}
                    {item.status === 'leave' && (
                      <div className="flex items-center gap-2 text-xs text-amber-500 font-bold bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-inner">
                        <Clock size={18} /> 请假
                      </div>
                    )}
                    {item.status === 'absent' && (
                      <div className="flex items-center gap-2 text-xs text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-inner">
                        <XCircle size={18} /> 缺勤
                      </div>
                    )}
                    <div className="w-24 text-right">
                      <span className="text-xs font-bold text-slate-500 font-mono">消耗 {item.deductHours}H</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-slate-400 font-medium italic">暂无上课考勤记录</div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs remain empty for now */}
        {(activeTab === 'progress' || activeTab === 'grades' || activeTab === 'homework') && (
          <EmptyState
            icon={<Inbox size={64} />}
            title="暂无详细数据分析"
            description="该模块的数据同步正在建设中，目前主要通过基本信息、报名记录和资产账务进行教务管理。"
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* Custom Action Modals */}
      <ConfirmModal
        isOpen={refundConfirm.isOpen}
        title="退费确认"
        message={refundConfirm.order ? `确定要为该订单申请退费吗？\n订单号：${refundConfirm.order.id}\n购入课时：${refundConfirm.order.lessons}\n实付金额：¥${refundConfirm.order.amount.toFixed(2)}` : ''}
        confirmText="确认退费"
        onConfirm={executeRefund}
        onCancel={() => setRefundConfirm({ isOpen: false, order: null })}
      />

      <PromptModal
        isOpen={transferPrompt.isOpen}
        title="选择转入班级"
        message={transferPrompt.courseId ? `请选择要转入的新班级（输入编号）：\n${classes.filter(c => c.course_id === transferPrompt.courseId && c.name !== student.className).map((c, i) => `${i + 1}. ${c.name} (${c.campus_id})`).join('\n')}` : ''}
        placeholder="请输入班级编号"
        confirmText="确认转入"
        onConfirm={executeTransfer}
        onCancel={() => setTransferPrompt({ isOpen: false, courseId: null })}
      />
    </div>
  );
};
