/**
 * LessonConsumption.tsx
 * ---------------------------------------------------------------
 * 课次消课 / 扣费登记页。
 * 针对单个课次逐学员登记出勤与扣课时，支持余额预警、保存草稿/正式提交。
 * 使用位置：教师端或教务「课次详情 -> 消课」。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  User,
  DollarSign,
  CreditCard,
  History,
  TrendingDown,
  ChevronDown,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../store';

// props：lessonId 目标课次 id；onBack 返回上级
interface LessonConsumptionProps {
  lessonId: string;
  onBack: () => void;
}

type DeductionReason = 'normal' | 'makeup' | 'bonus' | 'abnormal';

interface StudentConsumption {
  id: string;
  name: string;
  attendance: 'present' | 'leave' | 'absent' | 'late';
  availableBalance: number;
  deduction: number;
  reason: DeductionReason;
  remarks: string;
}

/**
 * LessonConsumption —— 消课登记主组件
 * 按 lessonId 查询课次与参与学员，展示每人余额；
 * 关键状态：consumptionMap 记录每位学员的扣课时数；提交时一并落库
 */
export const LessonConsumption: React.FC<LessonConsumptionProps> = ({ lessonId, onBack }) => {
  const { classes, students, courses, assetAccounts, addToast, submitAttendance } = useStore();

  // Find context: lesson -> class -> course (handles nested assignments[].schedules[] structure)
  const classContext = useMemo(() => {
    for (const cls of classes || []) {
      const clsAny = cls as any;
      if (clsAny.assignments) {
        for (const a of clsAny.assignments) {
          const lesson = (a.schedules || []).find((s: any) => s.id === lessonId);
          if (lesson) return { class: cls, lesson, course: a.course, teacher: a.teacher, assignment: a };
        }
      }
      const lesson = (clsAny.schedules || []).find((s: any) => s.id === lessonId);
      if (lesson) return { class: cls, lesson, course: clsAny.course, teacher: clsAny.teacher, assignment: null };
    }
    return null;
  }, [classes, lessonId]);

  // Find students and their balances using cls.students array when available
  const initialList = useMemo(() => {
    if (!classContext) return [];
    const clsAny = classContext.class as any;
    // Use cls.students array if present, otherwise fall back to filtering by className
    const enrolledStudents = clsAny.students?.length
      ? clsAny.students.map((e: any) => e.student || e).filter(Boolean)
      : (students || []).filter(s => s.className === classContext.class.name);

    const courseId = (classContext.assignment as any)?.course_id || (classContext.class as any).course_id;
    return enrolledStudents.map(s => {
      const account = (assetAccounts || []).find(acc => acc.student_id === s.id && acc.course_id === courseId);
      return {
        id: s.id,
        name: s.name,
        attendance: 'present' as const, // Default for consumption review
        availableBalance: account?.remainingQty || 0,
        deduction: 1.0,
        reason: 'normal' as const,
        remarks: ''
      };
    });
  }, [students, classContext, assetAccounts]);

  const [list, setList] = useState<StudentConsumption[]>([]);

  React.useEffect(() => {
    if (initialList.length > 0) setList(initialList);
  }, [initialList]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'present': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">到课</span>;
      case 'leave': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">请假</span>;
      case 'absent': return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100">缺勤</span>;
      default: return <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-full border border-slate-200">未到</span>;
    }
  };

  const getReasonLabel = (reason: DeductionReason) => {
    switch (reason) {
      case 'normal': return '正常上课';
      case 'makeup': return '补课课消';
      case 'bonus': return '赠课抵扣';
      case 'abnormal': return '异常扣减';
    }
  };

  const totalDeduction = useMemo(() => list.reduce((sum, item) => sum + item.deduction, 0), [list]);
  const activeStudent = list[selectedStudentIdx];

  const handleExportConsumption = useCallback(() => {
    if (!list || list.length === 0) {
      addToast('暂无课消数据可导出', 'warning');
      return;
    }
    const headers = ['学员ID', '姓名', '考勤状态', '可扣余额', '本次扣减', '课消原因', '剩余预估'];
    const rows = list.map(item => [
      item.id,
      item.name,
      item.attendance,
      item.availableBalance.toFixed(1),
      item.deduction.toFixed(1),
      item.reason,
      (item.availableBalance - item.deduction).toFixed(1)
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `课消记录_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`已导出 ${list.length} 条课消记录`, 'success');
  }, [list, addToast]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span onClick={onBack} className="hover:text-blue-600 cursor-pointer">教学管理</span>
            <ElmIcon name="arrow-right" size={16} />
            <span>课表</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600">课消确认</span>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">课消确认</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 bg-blue-50 rounded-xl text-center">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">本次待扣总量</p>
            <p className="text-lg font-bold text-blue-600 font-mono leading-none">{totalDeduction.toFixed(1)} <span className="text-[10px]">课时</span></p>
          </div>
        </div>
      </div>

      {/* Lesson Info Strip */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex divide-x divide-slate-100">
        <div className="p-6 flex-1 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">排课项目</p>
          <div className="flex items-center gap-2">
            <ElmIcon name="reading" size={16} />
            <p className="text-sm font-bold text-slate-900">{classContext?.course?.name} · {classContext?.class.name}</p>
          </div>
        </div>
        <div className="p-6 flex-1 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课时间</p>
          <div className="flex items-center gap-2">
            <ElmIcon name="calendar" size={16} />
            <p className="text-sm font-bold text-slate-900">{classContext?.lesson.start_time.split('T')[0]} <span className="text-slate-400 font-medium ml-2">{classContext?.lesson.start_time.split('T')[1]?.substring(0, 5)} - {classContext?.lesson.end_time.split('T')[1]?.substring(0, 5)}</span></p>
          </div>
        </div>
        <div className="p-6 flex-1 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">考勤统计</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-sm font-bold text-slate-700">到课 26</span></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div><span className="text-sm font-bold text-slate-700">请假 1</span></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-sm font-bold text-slate-700">缺勤 1</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Table: Consumption Detail */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">学员课消明细表</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1"><Info size={14} /> 请核对扣减原因，确认后将立即生效</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员详情</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">考勤</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">可扣余额</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center bg-blue-50/30">本次扣减</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">课消原因</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">剩余预估</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {list.map((item, idx) => {
                    const isInsufficient = item.availableBalance < item.deduction;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedStudentIdx(idx)}
                        className={`transition-all cursor-pointer group ${selectedStudentIdx === idx ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'} ${isInsufficient ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-slate-500">{item.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">{getAttendanceBadge(item.attendance)}</td>
                        <td className="px-8 py-5 text-center font-mono text-sm font-bold text-slate-500">{item.availableBalance.toFixed(1)}</td>
                        <td className={`px-8 py-5 text-center bg-blue-50/20`}>
                          <div className="inline-flex items-center gap-2">
                            {isInsufficient && <ElmIcon name="warning" size={16} />}
                            <input
                              type="number"
                              step="0.5"
                              value={item.deduction}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setList(prev => prev.map((s, i) => i === idx ? { ...s, deduction: val } : s));
                              }}
                              className={`w-16 bg-white border ${isInsufficient ? 'border-red-300 text-red-600' : 'border-slate-200 text-blue-600'} rounded-lg py-1 text-center text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none`}
                            />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <select
                            value={item.reason}
                            onChange={(e) => setList(prev => prev.map((s, i) => i === idx ? { ...s, reason: e.target.value as any } : s))}
                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors appearance-none"
                          >
                            <option value="normal">正常上课</option>
                            <option value="makeup">补课课消</option>
                            <option value="bonus">赠课抵扣</option>
                            <option value="abnormal">异常扣减</option>
                          </select>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-sm font-bold font-mono ${(item.availableBalance - item.deduction) < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                            {(item.availableBalance - item.deduction).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50/20 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium tracking-wide">注意：请核对“余额不足”的学员，系统已自动限制其课消确认权限。</p>
              <button className="text-xs font-bold text-blue-600 hover:underline">批量设置课消原因为“补课”</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Context Cards */}
        <div className="space-y-6">
          {/* Detailed Context Card for Selected Student */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-100">
                {activeStudent.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-lg font-bold text-slate-900 leading-none">{activeStudent.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">学员详情透视</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                <ElmIcon name="data-analysis" size={16} /> 课时账户全景
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">已购总量</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">48.0</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">当前剩余</p>
                  <p className="text-lg font-bold text-blue-600 font-mono">{activeStudent.availableBalance.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                <CreditCard size={14} /> 关联合同/订单
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-inner space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-800">ORD-20240110-001</p>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase">生效中</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>购买课程</span>
                    <span className="text-slate-600 font-bold">高级UI/UX设计</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>有效期至</span>
                    <span className="text-slate-600 font-bold">2025-01-10</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-black transition-all">
              <History size={16} /> 查看课消历史流水
            </button>
          </div>

          {/* Risk Card */}
          {activeStudent.availableBalance < activeStudent.deduction && (
            <div className="bg-red-50 rounded-[2rem] border border-red-100 p-8 space-y-4 animate-bounce-short">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                  <ElmIcon name="warning" size={16} />
                </div>
                <h5 className="text-sm font-bold text-red-900 tracking-tight">课时余额预警</h5>
              </div>
              <p className="text-xs text-red-800 leading-relaxed font-medium">该学员当前课时余额为 <span className="font-bold">{activeStudent.availableBalance.toFixed(1)}</span>，无法完成本次 <span className="font-bold">{activeStudent.deduction.toFixed(1)}</span> 课时的扣减。请提醒家长及时续费。</p>
              <button className="w-full py-2.5 bg-red-600 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-red-200">
                立即发送续费提醒
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 flex items-center justify-between z-30 lg:left-64">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          取消操作
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportConsumption}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <TrendingDown size={18} /> 导出课消
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Save size={18} /> 保存暂存
          </button>
          <button
            className="flex items-center gap-2 px-12 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={list.some(s => s.availableBalance < s.deduction)}
            onClick={async () => {
              if (!classContext) return;
              const submitCourseId = (classContext.assignment as any)?.course_id || (classContext.class as any).course_id;
              const submitCampusId = (classContext.class as any).campus_id;
              await submitAttendance(
                lessonId,
                submitCourseId,
                classContext.class.id,
                submitCampusId,
                list.map(a => ({
                  student_id: a.id,
                  status: a.attendance as any,
                  deductHours: a.deduction
                }))
              );
              onBack();
            }}
          >
            <ElmIcon name="circle-check" size={16} /> 确认执行课消记录
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-short { animation: bounceShort 2s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};
