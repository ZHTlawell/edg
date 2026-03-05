
import React, { useMemo } from 'react';
import {
   Users,
   CalendarDays,
   ClipboardCheck,
   Clock,
   MapPin,
   CheckCircle2,
   AlertCircle,
   TrendingUp,
   MonitorPlay
} from 'lucide-react';
import { useStore } from '../store';

interface TeacherDashboardProps {
   onEnterAttendance?: (lessonId: string) => void;
   onViewSchedule?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onEnterAttendance, onViewSchedule }) => {
   const { courses, assetAccounts, currentUser, students } = useStore();

   // In this mock-to-real transition, we assume teacher name matches instructor field
   const teacherName = currentUser?.role === 'teacher' ? '李建国老师' : '李老师';

   const myCourses = useMemo(() => {
      return courses.filter(c => c.instructor === teacherName || c.instructor === '李老师');
   }, [courses, teacherName]);

   const myStudentsCount = useMemo(() => {
      const myCourseIds = myCourses.map(c => c.id);
      const studentIds = new Set(assetAccounts.filter(acc => myCourseIds.includes(acc.courseId)).map(acc => acc.studentId));
      return studentIds.size;
   }, [myCourses, assetAccounts]);

   const todayLessons = useMemo(() => {
      // Logic for real lessons would come from a Schedule table, 
      // here we derive it from myCourses for the demo flow
      return myCourses.slice(0, 2).map((c, i) => ({
         time: i === 0 ? '14:00 - 16:30' : '18:30 - 20:30',
         course: c.name,
         class: `${c.name}·春季精品班`,
         room: i === 0 ? 'A302室' : 'B101室',
         students: assetAccounts.filter(acc => acc.courseId === c.id).length
      }));
   }, [myCourses, assetAccounts]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">下午好, {teacherName}！</h1>
               <p className="text-sm text-slate-500 font-medium">您今天共有 {todayLessons.length} 节授课计划，涉及 {myStudentsCount} 名在校学员。</p>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => onEnterAttendance?.('L101')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
               >
                  <ClipboardCheck size={18} /> 快速录入考勤
               </button>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本月授课课时</p>
                  <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">84.0 <span className="text-sm">H</span></h3>
               </div>
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={28} /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">平均出勤率</p>
                  <h3 className="text-3xl font-bold text-emerald-600 font-mono tracking-tighter">98.5%</h3>
               </div>
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">负责班级学员</p>
                  <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">{myStudentsCount} <span className="text-sm">人</span></h3>
               </div>
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28} /></div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                     <CalendarDays size={18} className="text-indigo-500" /> 今日实时排课报告
                  </h4>
                  <button
                     onClick={onViewSchedule}
                     className="text-xs font-bold text-indigo-600 hover:underline"
                  >查看完整周表</button>
               </div>
               <div className="space-y-4">
                  {todayLessons.length > 0 ? todayLessons.map((lesson, i) => (
                     <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                           <div className="text-center w-24">
                              <p className="text-lg font-bold text-slate-900 font-mono">{lesson.time.split(' - ')[0]}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">开始时间</p>
                           </div>
                           <div className="w-px h-10 bg-slate-100"></div>
                           <div className="space-y-1">
                              <h5 className="font-bold text-slate-800 tracking-tight">{lesson.class}</h5>
                              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                 <span className="flex items-center gap-1"><MonitorPlay size={14} /> {lesson.course}</span>
                                 <span className="flex items-center gap-1"><MapPin size={14} /> {lesson.room}</span>
                                 <span className="flex items-center gap-1 text-slate-500 font-bold"><Users size={14} /> {lesson.students} 名学员</span>
                              </div>
                           </div>
                        </div>
                        <button
                           onClick={() => onEnterAttendance?.('L101')}
                           className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-sm"
                        >
                           录入考勤
                        </button>
                     </div>
                  )) : (
                     <div className="py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                        <CalendarDays size={48} className="text-slate-200" />
                        <p className="text-sm font-bold text-slate-400">今日暂无分配的授课任务</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Reminders & Todo */}
            <div className="space-y-6">
               <h4 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <AlertCircle size={18} className="text-amber-500" /> 教学运营观测
               </h4>
               <div className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm">
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-sm">
                        <AlertCircle size={20} />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">课程异常提醒</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">您负责的课程有 1 名学员余额不足 3H，建议及时提醒续费。</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                        <TrendingUp size={20} />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">阶段测验统计</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">本周已有 {Math.floor(myStudentsCount * 0.4)} 名学员完成线上测验，待查阅反馈。</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold transition-all shadow-xl shadow-slate-100 hover:bg-indigo-600 active:scale-95">
                     查看完整待办清单
                  </button>
               </div>

               <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                  <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">教学周期达成率</h4>
                  <div className="space-y-4 relative z-10">
                     <div className="flex justify-between text-2xl font-bold font-mono">
                        <span>{Math.floor(myCourses.length * 4)} / {(myCourses.length + 1) * 5}</span>
                        <span className="opacity-60 text-lg">课时</span>
                     </div>
                     <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                     </div>
                     <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">本月排课任务执行进度</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
