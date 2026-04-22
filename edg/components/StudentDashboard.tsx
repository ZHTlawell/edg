
import { ElmIcon } from './ElmIcon';
import React, { useEffect, useMemo, useState } from 'react';
import {
   Wallet,
   Zap,
   MessageSquareText,
   PlayCircle,
   FileBadge,
   UserCheck,
   BookOpen,
   Bell,
   AlertTriangle,
   ClipboardList,
   ChevronRight,
   X,
   CalendarOff,
   Send,
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
   const [showLeaveModal, setShowLeaveModal] = useState(false);
   const [leaveReason, setLeaveReason] = useState('');
   const [leaveDate, setLeaveDate] = useState('');
   const [leaveSubmitted, setLeaveSubmitted] = useState(false);

   const handleLeaveSubmit = () => {
      if (!leaveReason.trim() || !leaveDate) return;
      setLeaveSubmitted(true);
      setTimeout(() => {
         setShowLeaveModal(false);
         setLeaveSubmitted(false);
         setLeaveReason('');
         setLeaveDate('');
      }, 1800);
   };

   const {
      currentUser, students, assetAccounts, courses,
      homeworks, homeworkSubmissions,
      announcements,
      fetchMyAssets, fetchCourses, fetchAnnouncementsActive,
   } = useStore();

   useEffect(() => {
      fetchMyAssets();
      if (!courses || courses.length === 0) fetchCourses?.();
      fetchAnnouncementsActive?.();
   }, []);

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

   // Learning progress based on asset accounts (aggregated by course)
   const progressItems = React.useMemo(() => {
      const myAccounts = (Array.isArray(assetAccounts) ? assetAccounts : [])
         .filter(acc => acc && (acc.student_id === currentUser?.bindStudentId || (acc as any).user_id === currentUser?.id));
      // Aggregate by course_id
      const courseMap = new Map<string, { total: number; remaining: number; courseId: string }>();
      for (const acc of myAccounts) {
         const existing = courseMap.get(acc.course_id);
         const remaining = acc.remaining_qty ?? (acc as any).remainingQty ?? 0;
         const total = acc.total_qty || (acc as any).totalQty || 0;
         if (existing) {
            existing.total += total;
            existing.remaining += remaining;
         } else {
            courseMap.set(acc.course_id, { total, remaining, courseId: acc.course_id });
         }
      }
      return Array.from(courseMap.values()).map(({ total, remaining, courseId }) => {
         const course = (courses || []).find(c => c.id === courseId);
         const progress = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
         return {
            name: course?.name || '未知课程',
            progress: isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress)),
            color: progress > 50 ? 'bg-emerald-500' : 'bg-blue-500'
         };
      }).slice(0, 5);
   }, [assetAccounts, currentUser, courses]);

   // ── 待办事项聚合 ──────────────────────────────────────────────────────────────
   const todoItems = useMemo(() => {
      const items: {
         id: string; type: string; title: string; subtitle: string;
         urgency: 'high' | 'medium' | 'low'; actionLabel?: string; onAction?: () => void;
      }[] = [];

      // 1. 待提交作业
      const myPendingHW = (homeworks || []).filter(hw => {
         const submitted = (homeworkSubmissions || []).some(
            s => s.homework_id === hw.id &&
               (s.student_id === currentUser?.bindStudentId || (s as any).user_id === currentUser?.id)
         );
         return !submitted && hw.status === 'active';
      });
      for (const hw of myPendingHW.slice(0, 3)) {
         const deadline = hw.deadline ? new Date(hw.deadline) : null;
         const hoursLeft = deadline ? (deadline.getTime() - Date.now()) / 36e5 : Infinity;
         items.push({
            id: `hw-${hw.id}`,
            type: 'homework',
            title: `作业待提交：${hw.title}`,
            subtitle: deadline ? `截止 ${deadline.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '无截止日期',
            urgency: hoursLeft < 24 ? 'high' : hoursLeft < 72 ? 'medium' : 'low',
            actionLabel: '去提交',
            onAction: onHomework,
         });
      }

      // 2. 课时不足预警 (< 5 课时)
      if (totalBalance > 0 && totalBalance < 5) {
         items.push({
            id: 'low-balance',
            type: 'warning',
            title: `课时余额不足 (剩余 ${totalBalance} H)`,
            subtitle: '建议尽快续费，避免影响正常上课',
            urgency: 'high',
            actionLabel: '立即续费',
            onAction: onRenew,
         });
      }

      // 3. 课时为零
      if (totalBalance === 0 && assetAccounts && assetAccounts.length > 0) {
         items.push({
            id: 'zero-balance',
            type: 'warning',
            title: '课时已用完，无法继续上课',
            subtitle: '请联系班主任或前往订单页续费',
            urgency: 'high',
            actionLabel: '去续费',
            onAction: onRenew,
         });
      }

      // 4. 最新公告 (最多 2 条)
      const activeAnnouncements = (announcements || [])
         .filter(a => a.status === 'PUBLISHED')
         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
         .slice(0, 2);
      for (const ann of activeAnnouncements) {
         items.push({
            id: `ann-${ann.id}`,
            type: 'announcement',
            title: ann.title,
            subtitle: new Date(ann.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' · 管理通知',
            urgency: 'low',
         });
      }

      // 5. 空学习提醒（无作业无公告时引导去学习）
      if (items.length === 0) {
         items.push({
            id: 'go-learn',
            type: 'info',
            title: '今日无待办，继续保持学习节奏！',
            subtitle: '点击进入在线学习中心，开始新课时',
            urgency: 'low',
            actionLabel: '去学习',
            onAction: onEnterLearning,
         });
      }

      return items;
   }, [homeworks, homeworkSubmissions, announcements, totalBalance, assetAccounts, currentUser]);

   console.log('StudentDashboard rendering, currentStudent:', currentStudent, 'totalBalance:', totalBalance);

   return (
      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
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
               { label: '在线请假', icon: <ElmIcon name="clock" size={16} />, color: 'bg-blue-50 text-blue-600', onClick: () => setShowLeaveModal(true) },
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

         {/* ── 我的待办 + 课程进度 side by side ────────────────────────────── */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
         {/* 我的待办 */}
         <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center">
                     <ClipboardList size={17} className="text-amber-500" />
                  </div>
                  <h4 className="font-bold text-slate-900">我的待办</h4>
                  {todoItems.some(t => t.urgency === 'high') && (
                     <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full border border-red-100">
                        {todoItems.filter(t => t.urgency === 'high').length} 紧急
                     </span>
                  )}
               </div>
               <span className="text-xs text-slate-400 font-bold">{todoItems.length} 项</span>
            </div>
            <div className="divide-y divide-slate-50">
               {todoItems.map(item => {
                  const urgencyStyle = {
                     high: { bar: 'bg-red-400', icon: <AlertTriangle size={15} className="text-red-400" />, badge: 'text-red-500 bg-red-50' },
                     medium: { bar: 'bg-amber-400', icon: <BookOpen size={15} className="text-amber-400" />, badge: 'text-amber-500 bg-amber-50' },
                     low: { bar: 'bg-slate-300', icon: <Bell size={15} className="text-slate-400" />, badge: 'text-slate-500 bg-slate-50' },
                  }[item.urgency];

                  const typeIcon = {
                     homework: <BookOpen size={15} className="text-indigo-400" />,
                     warning: <AlertTriangle size={15} className="text-red-400" />,
                     announcement: <Bell size={15} className="text-blue-400" />,
                     info: <Zap size={15} className="text-amber-400" />,
                  }[item.type] || urgencyStyle.icon;

                  return (
                     <div key={item.id} className="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/60 transition-colors group">
                        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${urgencyStyle.bar}`} />
                        <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                           {typeIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                           <p className="text-xs text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                        {item.actionLabel && item.onAction && (
                           <button
                              onClick={item.onAction}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                           >
                              {item.actionLabel} <ChevronRight size={12} />
                           </button>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Learning Progress List */}
         <div className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-6 shadow-sm">
               <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">课程学习进度</h4>
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
               <div className="pt-2">
                  <button
                     onClick={onEnterLearning}
                     className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                     <Zap size={16} className="text-amber-500" /> 进入在线学习中心
                  </button>
               </div>
            </div>
         </div>{/* end grid */}

         {/* ── 在线请假 Modal ────────────────────────────────────────────── */}
         {showLeaveModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40" onClick={() => setShowLeaveModal(false)}>
               <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  {leaveSubmitted ? (
                     <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                           <Send size={28} className="text-emerald-500" />
                        </div>
                        <p className="text-lg font-bold text-slate-900">请假申请已提交</p>
                        <p className="text-sm text-slate-400">等待老师确认，结果将通过通知告知您</p>
                     </div>
                  ) : (
                     <>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                                 <CalendarOff size={20} className="text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-900">在线请假</h3>
                           </div>
                           <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                              <X size={18} className="text-slate-400" />
                           </button>
                        </div>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">请假日期</label>
                              <input
                                 type="date"
                                 value={leaveDate}
                                 onChange={e => setLeaveDate(e.target.value)}
                                 min={new Date().toISOString().split('T')[0]}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">请假原因</label>
                              <textarea
                                 value={leaveReason}
                                 onChange={e => setLeaveReason(e.target.value)}
                                 placeholder="请填写请假原因，例如：身体不适、家庭事务等..."
                                 rows={4}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none leading-relaxed"
                              />
                           </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                           <button
                              onClick={() => setShowLeaveModal(false)}
                              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                           >
                              取消
                           </button>
                           <button
                              onClick={handleLeaveSubmit}
                              disabled={!leaveReason.trim() || !leaveDate}
                              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                              <Send size={15} /> 提交申请
                           </button>
                        </div>
                     </>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};
