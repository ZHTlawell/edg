
import React from 'react';
import { 
  CalendarDays, 
  Wallet, 
  Zap, 
  MessageSquareText, 
  ChevronRight, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileBadge,
  UserCheck
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Welcome & Account Summary */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="flex items-center gap-8">
            <div className="relative">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe" 
                alt="Student" 
                className="w-24 h-24 rounded-[2rem] shadow-xl border-4 border-white"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="space-y-2">
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">你好, 张美玲！</h1>
               <div className="flex items-center gap-4 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><MapPin size={14}/> 总部旗舰校区</span>
                  <span className="flex items-center gap-1.5"><FileBadge size={14}/> 学员 ID: S10084</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="text-center px-8 py-4 bg-emerald-50 rounded-3xl border border-emerald-100">
               <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">剩余总课时</p>
               <h3 className="text-3xl font-bold text-emerald-700 font-mono">36.5 <span className="text-xs">H</span></h3>
            </div>
            <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
            <button className="flex flex-col items-center gap-2 group">
               <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">立即续费</span>
            </button>
         </div>
      </div>

      {/* Quick Action King Slots */}
      <div className="grid grid-cols-4 gap-4">
         {[
           { label: '在线请假', icon: <Clock size={20}/>, color: 'bg-blue-50 text-blue-600' },
           { label: '我的作业', icon: <Zap size={20}/>, color: 'bg-amber-50 text-amber-600' },
           { label: '学习资料', icon: <PlayCircle size={20}/>, color: 'bg-indigo-50 text-indigo-600' },
           { label: '联系班主任', icon: <MessageSquareText size={20}/>, color: 'bg-rose-50 text-rose-600' },
         ].map((slot, i) => (
           <button key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-center gap-3 active:scale-95 group">
              <div className={`p-4 rounded-2xl ${slot.color} transition-transform group-hover:rotate-6`}>{slot.icon}</div>
              <span className="text-xs font-bold text-slate-700">{slot.label}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Next Class Card */}
         <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <span className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md text-emerald-400">即将上课</span>
                  <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                    <CalendarDays size={14}/> 今天 14:00
                  </div>
               </div>
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">高级UI/UX设计实战</h2>
                  <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">第12课：App 复杂列表系统设计</p>
               </div>
               <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-xs">李</div>
                     <div>
                        <p className="text-xs font-bold">李建国 老师</p>
                        <p className="text-[10px] opacity-40 uppercase font-medium">A区 302 多媒体教室</p>
                     </div>
                  </div>
                  <button className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-emerald-50 transition-colors">
                     <ChevronRight size={20} />
                  </button>
               </div>
            </div>
         </div>

         {/* Learning Progress List */}
         <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 space-y-8 shadow-sm">
            <div className="flex items-center justify-between">
               <h4 className="font-bold text-slate-900">课程学习进度</h4>
               <button className="text-xs font-bold text-blue-600 hover:underline">查看全部</button>
            </div>
            <div className="space-y-8">
               {[
                 { name: '高级UI/UX设计全能课', progress: 75, color: 'bg-blue-500' },
                 { name: 'React 18 企业级开发', progress: 32, color: 'bg-indigo-500' },
                 { name: '商业数据分析与看板', progress: 12, color: 'bg-emerald-500' },
               ].map((c, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-bold text-slate-700">{c.name}</span>
                       <span className="text-xs font-mono font-bold text-slate-400">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                       <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.progress}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="pt-4">
               <button className="w-full py-4 bg-slate-50 text-slate-500 rounded-3xl text-sm font-bold hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-center gap-2">
                 <Zap size={16} className="text-amber-500" /> 进入在线学习中心
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
