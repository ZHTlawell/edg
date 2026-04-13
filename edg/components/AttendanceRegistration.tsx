
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
  History,
  Save,
  Send,
  AlertCircle,
  MapPin,
  User as UserIcon,
  DoorOpen,
  Calendar,
  Filter,
  MoreVertical,
  MinusCircle
} from 'lucide-react';
import { useStore } from '../store';

interface AttendanceRegistrationProps {
  lessonId: string;
  onBack: () => void;
}

type AttendanceStatus = 'present' | 'leave' | 'absent' | 'late';

interface StudentAttendance {
  id: string;
  name: string;
  phone: string;
  status: AttendanceStatus;
  deduction: number;
  remarks: string;
}

export const AttendanceRegistration: React.FC<AttendanceRegistrationProps> = ({ lessonId, onBack }) => {
  const { classes, students, courses, submitAttendance, addToast, attendanceRecords } = useStore();

  // Find context: lesson -> class -> course
  // Classes from API have assignments[].schedules[] nested structure
  const classContext = useMemo(() => {
    for (const cls of classes || []) {
      const clsAny = cls as any;
      // Nested: cls.assignments[].schedules[]
      if (clsAny.assignments) {
        for (const a of clsAny.assignments) {
          const lesson = (a.schedules || []).find((s: any) => s.id === lessonId);
          if (lesson) {
            return { class: cls, lesson, course: a.course, teacher: a.teacher, assignment: a };
          }
        }
      }
      // Flat: cls.schedules[] (teacher view)
      const lesson = clsAny.schedules?.find((s: any) => s.id === lessonId);
      if (lesson) {
        const course = (courses || []).find(c => c.id === clsAny.course_id) || clsAny.course;
        return { class: cls, lesson, course, teacher: clsAny.teacher, assignment: null };
      }
    }
    return null;
  }, [classes, lessonId, courses]);

  // Students enrolled in this class — from API class.students relation
  const classStudents = useMemo(() => {
    if (!classContext) return [];
    const cls = classContext.class as any;
    // API returns students: [{ student: EduStudent, ... }]
    if (cls.students && cls.students.length > 0) {
      return cls.students.map((e: any) => e.student || e);
    }
    // Fallback: match from store students by class name
    return (students || []).filter((s: any) => s.className === cls.name);
  }, [students, classContext]);

  const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);

  // 该课次已有的考勤记录（按 student_id 索引）
  const existingAttendance = useMemo(() => {
    const map: Record<string, any> = {};
    (attendanceRecords || []).forEach((r: any) => {
      if (r.lesson_id === lessonId) map[r.student_id] = r;
    });
    return map;
  }, [attendanceRecords, lessonId]);

  const isReadOnly = Object.keys(existingAttendance).length > 0; // 已登记 → 查看模式

  // Initialize attendance list
  // - 查看模式（有已登记记录）：以真实记录为准，仅展示已登记的学员
  // - 登记模式（首次）：以班级花名册为准，全部默认"出席"
  React.useEffect(() => {
    if (isReadOnly) {
      const recordedStudents = Object.values(existingAttendance).map((rec: any) => {
        const s = classStudents.find((x: any) => x.id === rec.student_id) || {};
        return {
          id: rec.student_id,
          name: (s as any).name || `学员 ${String(rec.student_id).slice(-4)}`,
          phone: (s as any).phone || '',
          status: (rec.status as AttendanceStatus) || 'present',
          deduction: rec.deductHours ?? (rec.status === 'leave' ? 0 : 1),
          remarks: rec.remarks || ''
        };
      });
      setAttendanceList(recordedStudents);
    } else if (classStudents.length > 0) {
      setAttendanceList(classStudents.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        status: 'present' as AttendanceStatus,
        deduction: 1,
        remarks: ''
      })));
    }
  }, [classStudents, existingAttendance, isReadOnly]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyShowAbnormal, setOnlyShowAbnormal] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = attendanceList.length;
    const present = attendanceList.filter(s => s.status === 'present' || s.status === 'late').length;
    const leave = attendanceList.filter(s => s.status === 'leave').length;
    const absent = attendanceList.filter(s => s.status === 'absent').length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    return { total, present, leave, absent, rate };
  }, [attendanceList]);

  // Filtering
  const filteredList = useMemo(() => {
    return attendanceList.filter(s => {
      const matchesSearch = s.name.includes(searchTerm) || s.id.includes(searchTerm);
      const matchesAbnormal = !onlyShowAbnormal || (s.status !== 'present');
      return matchesSearch && matchesAbnormal;
    });
  }, [attendanceList, searchTerm, onlyShowAbnormal]);

  const updateStatus = (id: string, status: AttendanceStatus) => {
    if (isReadOnly) {
      addToast('该课次已完成考勤登记，如需修改请使用「撤销课消」', 'info');
      return;
    }
    setAttendanceList(prev => prev.map(s => {
      if (s.id === id) {
        // Default deduction logic: absent/leave might be 0 depending on policy, present/late is usually 1
        const deduction = (status === 'leave') ? 0 : 1;
        return { ...s, status, deduction };
      }
      return s;
    }));
  };

  const batchUpdate = (status: AttendanceStatus) => {
    setAttendanceList(prev => prev.map(s => ({
      ...s,
      status,
      deduction: (status === 'leave') ? 0 : 1
    })));
  };

  const getStatusBtnStyle = (current: AttendanceStatus, target: AttendanceStatus) => {
    if (current !== target) return 'bg-white border-slate-200 text-slate-400 hover:border-slate-300';
    switch (target) {
      case 'present': return 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100';
      case 'leave': return 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100';
      case 'absent': return 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100';
      case 'late': return 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span onClick={onBack} className="hover:text-blue-600 cursor-pointer transition-colors">教学管理</span>
            <ElmIcon name="arrow-right" size={16} />
            <span onClick={onBack} className="hover:text-blue-600 cursor-pointer transition-colors">课表</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600">考勤登记</span>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">考勤登记</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-2.5 flex items-center gap-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">当前到课率</span>
              <span className="text-xl font-bold text-blue-600 font-mono tracking-tighter leading-none">{stats.rate}%</span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">+{stats.total} 位学员</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Info Strip */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">班级名称</p>
            <p className="text-sm font-bold text-slate-900">{classContext?.class.name || '加载中...'}</p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">课程项目</p>
            <p className="text-sm font-bold text-slate-900">{classContext?.course?.name || '加载中...'}</p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课教师</p>
            <div className="flex items-center gap-2">
              <ElmIcon name="user" size={16} />
              <p className="text-sm font-bold text-slate-900">{(classContext as any)?.teacher?.name || classContext?.course?.instructor || '加载中...'}</p>
            </div>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课教室</p>
            <div className="flex items-center gap-2">
              <ElmIcon name="house" size={16} />
              <p className="text-sm font-bold text-slate-900">{classContext?.lesson.classroom || '默认教室'}</p>
            </div>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">上课日期</p>
            <div className="flex items-center gap-2">
              <ElmIcon name="calendar" size={16} />
              <p className="text-sm font-bold text-slate-900">{classContext ? String(classContext.lesson.start_time).split('T')[0] : '...'}</p>
            </div>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">上课时段</p>
            <div className="flex items-center gap-2">
              <ElmIcon name="clock" size={16} />
              <p className="text-sm font-bold text-slate-900">{classContext ? String(classContext.lesson.start_time).split('T')[1]?.substring(0, 5) : '-'} - {classContext ? String(classContext.lesson.end_time).split('T')[1]?.substring(0, 5) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative flex-1 group">
                  <ElmIcon name="search" size={16} />
                  <input
                    type="text"
                    placeholder="按姓名或学号搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setOnlyShowAbnormal(!onlyShowAbnormal)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all border ${onlyShowAbnormal ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                  >
                    <ElmIcon name="operation" size={16} /> 只看异常
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => batchUpdate('present')}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[11px] font-bold hover:bg-emerald-100 transition-all shadow-sm flex items-center gap-2"
                >
                  <ElmIcon name="circle-check" size={16} /> 一键全到
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => batchUpdate('leave')}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  批量请假
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/10 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员详情</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">出勤状态登记</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">课时扣减</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">备注说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/5 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500 group-hover:scale-105 transition-transform">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{student.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">{student.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateStatus(student.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${getStatusBtnStyle(student.status, 'present')}`}
                          >到课</button>
                          <button
                            onClick={() => updateStatus(student.id, 'leave')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${getStatusBtnStyle(student.status, 'leave')}`}
                          >请假</button>
                          <button
                            onClick={() => updateStatus(student.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${getStatusBtnStyle(student.status, 'absent')}`}
                          >缺勤</button>
                          <button
                            onClick={() => updateStatus(student.id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${getStatusBtnStyle(student.status, 'late')}`}
                          >迟到</button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <button
                            className="p-1 hover:bg-white rounded-lg text-slate-400"
                            onClick={() => setAttendanceList(prev => prev.map(s => s.id === student.id ? { ...s, deduction: Math.max(0, s.deduction - 0.5) } : s))}
                          ><MinusCircle size={14} /></button>
                          <span className="text-xs font-bold text-slate-700 font-mono w-8">{student.deduction.toFixed(1)}</span>
                          <button
                            className="p-1 hover:bg-white rounded-lg text-slate-400"
                            onClick={() => setAttendanceList(prev => prev.map(s => s.id === student.id ? { ...s, deduction: s.deduction + 0.5 } : s))}
                          ><PlusCircle size={14} /></button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <input
                          type="text"
                          placeholder="补充备注..."
                          value={student.remarks}
                          onChange={(e) => setAttendanceList(prev => prev.map(s => s.id === student.id ? { ...s, remarks: e.target.value } : s))}
                          className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-xs text-slate-500 font-medium py-1 transition-all"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredList.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <ElmIcon name="search" size={16} />
                  <p className="text-sm font-bold">没有找到匹配的学员记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ElmIcon name="user" size={16} /> 考勤实时统计
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">应到人数</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</p>
              </div>
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 space-y-1">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">已到人数</p>
                <p className="text-2xl font-bold text-emerald-600 font-mono">{stats.present}</p>
              </div>
              <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 space-y-1">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">请假人数</p>
                <p className="text-2xl font-bold text-amber-600 font-mono">{stats.leave}</p>
              </div>
              <div className="bg-red-50 rounded-3xl p-5 border border-red-100 space-y-1">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">缺勤人数</p>
                <p className="text-2xl font-bold text-red-600 font-mono">{stats.absent}</p>
              </div>
            </div>

            <div className="p-6 bg-blue-600 rounded-3xl text-white space-y-4 shadow-xl shadow-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
              <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">总体考勤达成度</p>
                <p className="text-4xl font-bold font-mono tracking-tighter">{stats.rate}%</p>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${stats.rate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-[2rem] border border-amber-100 p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                <ElmIcon name="warning" size={16} />
              </div>
              <h5 className="text-sm font-bold text-amber-900 tracking-tight">考勤规则说明</h5>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                到课与迟到：默认正常扣除 1.0 课时。
              </li>
              <li className="flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                请假：系统默认不扣除课时，后续需根据中心政策手动确认。
              </li>
              <li className="flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                缺勤：视为名额占用，系统默认建议扣除 1.0 课时。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 flex items-center justify-between z-30 lg:left-64">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          {isReadOnly ? '返回考勤看板' : '取消并返回课表'}
        </button>
        {isReadOnly ? (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold">
            <CheckCircle2 size={16} /> 该课次已完成考勤登记（仅查看模式）
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
              <Save size={18} /> 保存草稿
            </button>
            <button
              className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 active:scale-95 group"
              onClick={async () => {
                if (!classContext) return;
                await submitAttendance(
                  lessonId,
                  classContext.course_id || classContext.class.course_id,
                  classContext.class.id,
                  classContext.class.campus_id,
                  attendanceList.map(a => ({
                    student_id: a.id,
                    status: a.status as any,
                    deductHours: a.deduction
                  }))
                );
                onBack();
              }}
            >
              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 提交考勤录入
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

// Internal icon for +/- deduction
const PlusCircle: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
