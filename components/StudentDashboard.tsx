
import { ElmIcon } from './ElmIcon';
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
   UserCheck,
   Briefcase
} from 'lucide-react';
import { useStore } from '../store';

interface StudentDashboardProps {
   onRenew?: () => void;
   onLeave?: () => void;
   onHomework?: () => void;
   onMaterials?: () => void;
   onContact?: () => void;
   onEnterLearning?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
   onRenew,
   onLeave,
   onHomework,
   onMaterials,
   onContact,
   onEnterLearning
}) => {
   const { currentUser, students, assetAccounts, courses } = useStore();

   const currentStudent = React.useMemo(() => {
      if (currentUser?.role === 'student') {
         // Try to find by bindStudentId (EduStudent.id) OR by currentUser.id (user_id)
         return (students || []).find(s => s.id === currentUser.bindStudentId || (s as any).user_id === currentUser.id);
      }
      return null;
   }, [currentUser, students]);

   const totalBalance = React.useMemo(() => {
      return (Array.isArray(assetAccounts) ? assetAccounts : [])
         .filter(acc => acc && (acc.student_id === currentUser?.bindStudentId || (acc as any).user_id === currentUser?.id))
         .reduce((sum, acc) => sum + (acc.remaining_qty ?? (acc as any).remainingQty ?? 0), 0);
   }, [assetAccounts, currentUser]);

   // Learning progress based on asset accounts
   const progressItems = React.useMemo(() => {
      return (Array.isArray(assetAccounts) ? assetAccounts : [])
         .filter(acc => acc && (acc.student_id === currentUser?.bindStudentId || (acc as any).user_id === currentUser?.id))
         .map(acc => {
            const course = (courses || []).find(c => c.id === acc.course_id);
            const total = acc.total_qty || (acc as any).totalQty || 1;
            const remaining = acc.remaining_qty ?? (acc as any).remainingQty ?? 0;
            const progress = Math.round(((total - remaining) / total) * 100);
            return {
               name: course?.name || '未知课程',
               progress: isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress)),
               color: progress > 50 ? 'bg-emerald-500' : 'bg-blue-500'
            };
         }).slice(0, 3);
   }, [assetAccounts, currentUser, courses]);

   console.log('StudentDashboard rendering, currentStudent:', currentStudent, 'totalBalance:', totalBalance);

   // 欠费预警：列出 remaining_qty <= 5 的资产账户
   const lowBalanceAccounts = React.useMemo(() => {
      return (Array.isArray(assetAccounts) ? assetAccounts : [])
         .filter(acc => acc && (acc.student_id === currentUser?.bindStudentId || (acc as any).user_id === currentUser?.id))
         .filter(acc => (acc.remaining_qty ?? 0) <= 5 && acc.status !== 'CLOSED')
         .map(acc => ({
            accountId: acc.id,
            courseName: (courses || []).find(c => c.id === acc.course_id)?.name || '未知课程',
            remaining: acc.remaining_qty ?? 0,
            critical: (acc.remaining_qty ?? 0) <= 0,
         }));
   }, [assetAccounts, currentUser, courses]);

   return (
      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
         {/* 欠费预警横幅 */}
         {lowBalanceAccounts.length > 0 && (
            <div className={`rounded-2xl border p-5 flex items-start gap-4 ${lowBalanceAccounts.some(a => a.critical) ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
               <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${lowBalanceAccounts.some(a => a.critical) ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Zap size={20} />
               </div>
               <div className="flex-1">
                  <h4 className={`font-bold mb-1 ${lowBalanceAccounts.some(a => a.critical) ? 'text-red-700' : 'text-amber-700'}`}>
                     {lowBalanceAccounts.some(a => a.critical) ? '课时余额已耗尽，部分功能受限' : '课时余额不足，建议续费'}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-xs">
                     {lowBalanceAccounts.map(a => (
                        <span key={a.accountId} className={`px-2.5 py-1 rounded-full font-semibold ${a.critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                           {a.courseName}: 剩余 {a.remaining} 课时
                        </span>
                     ))}
                  </div>
                  {lowBalanceAccounts.some(a => a.critical) && (
                     <p className="text-xs text-red-600 mt-2">• 无法查看新章节学习资料 • 无法提交作业 • 无法参加测验</p>
                  )}
               </div>
               {onRenew && (
                  <button onClick={onRenew} className={`px-4 py-2 rounded-xl font-semibold text-sm shrink-0 ${lowBalanceAccounts.some(a => a.critical) ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
                     立即续费
                  </button>
               )}
            </div>
         )}

         {/* Welcome & Account Summary */}
         <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
               <div className="relative">
                  <img
                     src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStudent?.name || 'Student'}`}
                     alt="Student"
                     className="w-24 h-24 rounded-[2rem] shadow-xl border-4 border-white"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
                     <UserCheck size={20} />
                  </div>
               </div>
               <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">你好, {currentStudent?.name || '学员'}！</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400 font-bold uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><ElmIcon name="location" size={16} /> {currentStudent?.campus || '总部旗舰校区'}</span>
                     <span className="flex items-center gap-1.5"><FileBadge size={14} /> 学员 ID: {currentStudent?.id || '---'}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-center px-8 py-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">剩余总课时</p>
                  <h3 className="text-3xl font-bold text-emerald-700 font-mono">{totalBalance} <span className="text-xs">H</span></h3>
               </div>
               <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
               <div className="text-center px-8 py-4 bg-amber-50 rounded-3xl border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">钱包余额</p>
                  <h3 className="text-3xl font-bold text-amber-700 font-mono">¥ {(currentStudent as any)?.balance?.toFixed(2) || '0.00'}</h3>
               </div>
               <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
               <button
                  onClick={onRenew}
                  className="flex flex-col items-center gap-2 group"
               >
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
               { label: '在线请假', icon: <ElmIcon name="clock" size={16} />, color: 'bg-blue-50 text-blue-600', onClick: onLeave },
               { label: '我的作业', icon: <Zap size={20} />, color: 'bg-amber-50 text-amber-600', onClick: onHomework },
               { label: '学习资料', icon: <PlayCircle size={20} />, color: 'bg-indigo-50 text-indigo-600', onClick: onMaterials },
               { label: '联系班主任', icon: <MessageSquareText size={20} />, color: 'bg-rose-50 text-rose-600', onClick: onContact },
            ].map((slot, i) => (
               <button
                  key={i}
                  onClick={slot.onClick}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-center gap-3 active:scale-95 group"
               >
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
                        <ElmIcon name="calendar" size={16} /> 今天 14:00
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-3xl font-bold tracking-tight">{currentStudent?.className || '暂无排班'}</h2>
                     <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">下一节课即将来临，请提前准备</p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-xs">
                           {(currentStudent?.className?.[0] || '教')}
                        </div>
                        <div>
                           <p className="text-xs font-bold">班级授课计划</p>
                           <p className="text-[10px] opacity-40 uppercase font-medium">请前往“我的课表”查看详情</p>
                        </div>
                     </div>
                     <button className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-emerald-50 transition-colors">
                        <ElmIcon name="arrow-right" size={16} />
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
                  {progressItems.length > 0 ? progressItems.map((c, i) => (
                     <div key={i} className="space-y-3">
                        <div className="flex justify-between items-end">
                           <span className="text-sm font-bold text-slate-700">{c.name}</span>
                           <span className="text-xs font-mono font-bold text-slate-400">{c.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.progress}%` }}></div>
                        </div>
                     </div>
                  )) : (
                     <div className="py-10 text-center space-y-2">
                        <p className="text-sm font-bold text-slate-400">暂无正在学习的课程</p>
                        <p className="text-[10px] text-slate-300 uppercase tracking-widest">前往精品市场开启学习之旅</p>
                     </div>
                  )}
               </div>
               <div className="pt-4">
                  <button
                     onClick={onEnterLearning}
                     className="w-full py-4 bg-slate-50 text-slate-500 rounded-3xl text-sm font-bold hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                     <Zap size={16} className="text-amber-500" /> 进入在线学习中心
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
