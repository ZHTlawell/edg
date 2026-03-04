
import React from 'react';
import { 
  Users, 
  CalendarDays, 
  ClipboardCheck, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MonitorPlay
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">下午好, 李老师！</h1>
          <p className="text-sm text-slate-500 font-medium">今天您共有 3 节课，目前已完成 1 节，待考勤 2 节。</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
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
              <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">156 <span className="text-sm">人</span></h3>
           </div>
           <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays size={18} className="text-indigo-500" /> 今日授课计划
              </h4>
              <button className="text-xs font-bold text-indigo-600 hover:underline">查看本周课表</button>
           </div>
           <div className="space-y-4">
              {[
                { time: '14:00 - 16:30', class: '24春季UI精品1班', course: '高级UI/UX设计实战', room: 'A302室', status: 'pending', students: 28 },
                { time: '18:30 - 20:30', class: '极客Figma实战组', course: '原子化设计规范', room: 'B101室', status: 'pending', students: 12 },
              ].map((lesson, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="text-center w-24">
                       <p className="text-lg font-bold text-slate-900 font-mono">{lesson.time.split(' - ')[0]}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">开始时间</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100"></div>
                    <div className="space-y-1">
                       <h5 className="font-bold text-slate-800 tracking-tight">{lesson.class}</h5>
                       <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><MonitorPlay size={14}/> {lesson.course}</span>
                          <span className="flex items-center gap-1"><MapPin size={14}/> {lesson.room}</span>
                       </div>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-sm">
                    录入考勤
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Reminders & Todo */}
        <div className="space-y-6">
           <h4 className="font-bold text-slate-800 flex items-center gap-2">
             <AlertCircle size={18} className="text-amber-500" /> 待办与预警
           </h4>
           <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">缺勤预警</p>
                    <p className="text-xs text-slate-400 leading-relaxed">学员“赵小龙”已连续缺勤 2 次，需尽快电联家长跟进原因。</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <TrendingUp size={20} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">成绩录入提醒</p>
                    <p className="text-xs text-slate-400 leading-relaxed">“UI2401班”阶段性综合作业已提交 24 份，待批改。</p>
                 </div>
              </div>
              <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-bold transition-all border border-slate-100">
                处理全部待办任务
              </button>
           </div>

           <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
              <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">教学周计划达成</h4>
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between text-2xl font-bold font-mono">
                    <span>8 / 12</span>
                    <span className="opacity-60 text-lg">课时</span>
                 </div>
                 <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '66.6%' }}></div>
                 </div>
                 <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">本周已授课课时占比</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
