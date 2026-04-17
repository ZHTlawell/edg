
import { ElmIcon } from './ElmIcon';
import React, { useMemo, useEffect, useState } from 'react';
import {
   ClipboardCheck,
} from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';

interface TeacherDashboardProps {
   onEnterAttendance?: (lessonId: string) => void;
   onViewSchedule?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onEnterAttendance, onViewSchedule }) => {
   const { currentUser, attendanceRecords, classes, homeworkSubmissions } = useStore();
   const teacherId = (currentUser as any)?.teacherId;
   const teacherName = currentUser?.name || '老师';

   // 从 classes (带 assignments.schedules) 提取今日真实课次
   const [todayLessons, setTodayLessons] = useState<any[]>([]);

   useEffect(() => {
      // classes store 包含 assignments[].schedules[]
      const today = new Date().toISOString().split('T')[0];
      const lessons: any[] = [];
      (classes || []).forEach((cls: any) => {
         // 教师端扁平结构：cls 直接有 schedules/course/teacher_id
         const isMine = cls.teacher_id === teacherId || cls.teacher?.id === teacherId;
         if (isMine && cls.schedules) {
            cls.schedules.forEach((s: any) => {
               const schedDate = (s.start_time || '').split('T')[0];
               if (schedDate === today) {
                  const startDt = new Date(s.start_time);
                  const endDt = new Date(s.end_time);
                  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  lessons.push({
                     id: s.id,
                     time: `${fmt(startDt)} - ${fmt(endDt)}`,
                     timeSort: startDt.getTime(),
                     course: cls.course?.name || '未知课程',
                     class: cls.name,
                     room: s.classroom || s.room?.name || '未分配',
                     students: cls.enrolled || cls.students?.length || 0,
                     status: s.status,
                     isConsumed: s.is_consumed,
                  });
               }
            });
         }
         // 嵌套结构 fallback（admin/campus_admin 视角）
         (cls.assignments || []).forEach((a: any) => {
            if (a.teacher_id !== teacherId && a.teacher?.id !== teacherId) return;
            (a.schedules || []).forEach((s: any) => {
               const schedDate = (s.start_time || '').split('T')[0];
               if (schedDate === today) {
                  const startDt = new Date(s.start_time);
                  const endDt = new Date(s.end_time);
                  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  // 避免重复（如果扁平结构已经添加过）
                  if (!lessons.find(l => l.id === s.id)) {
                     lessons.push({
                        id: s.id,
                        time: `${fmt(startDt)} - ${fmt(endDt)}`,
                        timeSort: startDt.getTime(),
                        course: a.course?.name || '未知课程',
                        class: cls.name,
                        room: s.classroom || s.room?.name || '未分配',
                        students: cls.enrolled || cls.students?.length || 0,
                        status: s.status,
                        isConsumed: s.is_consumed,
                     });
                  }
               }
            });
         });
      });
      lessons.sort((a, b) => a.timeSort - b.timeSort);
      setTodayLessons(lessons);
   }, [classes, teacherId]);

   // 统计 KPI
   const myAttendance = attendanceRecords || [];
   const attendanceRate = useMemo(() => {
      if (myAttendance.length === 0) return '0.0';
      const present = myAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      return ((present / myAttendance.length) * 100).toFixed(1);
   }, [myAttendance]);

   const totalStudents = useMemo(() => {
      return (classes || []).reduce((sum: number, c: any) => {
         const hasMe = c.teacher_id === teacherId || c.teacher?.id === teacherId || c.assignments?.some((a: any) => a.teacher_id === teacherId || a.teacher?.id === teacherId);
         return sum + (hasMe ? (c.enrolled || c.students?.length || 0) : 0);
      }, 0);
   }, [classes, teacherId]);

   const monthConsumption = useMemo(() => {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return myAttendance.filter(r => (r.createdAt || '').startsWith(ym) && (r.status === 'present' || r.status === 'late')).length;
   }, [myAttendance]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {new Date().getHours() < 12 ? '上午好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}, {teacherName}！
               </h1>
               <p className="text-sm text-slate-500 font-medium">
                  您今天共有 {todayLessons.length} 节授课计划，涉及 {totalStudents} 名在校学员。
               </p>
            </div>
            <div className="flex items-center gap-3">
               {todayLessons.length > 0 && todayLessons.find(l => !l.isConsumed) && (
                  <button
                     onClick={() => {
                        const next = todayLessons.find(l => !l.isConsumed);
                        if (next) onEnterAttendance?.(next.id);
                     }}
                     className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                     <ClipboardCheck size={18} /> 快速录入考勤
                  </button>
               )}
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本月考勤人次</p>
                  <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">{monthConsumption} <span className="text-sm">次</span></h3>
               </div>
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><ElmIcon name="clock" size={16} /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">平均出勤率</p>
                  <h3 className="text-3xl font-bold text-emerald-600 font-mono tracking-tighter">{attendanceRate}%</h3>
               </div>
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><ElmIcon name="circle-check" size={16} /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">负责班级学员</p>
                  <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">{totalStudents} <span className="text-sm">人</span></h3>
               </div>
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><ElmIcon name="user" size={16} /></div>
            </div>
         </div>

         {/* Today's Schedule */}
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h4 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <ElmIcon name="calendar" size={16} /> 今日排课
               </h4>
               <button onClick={onViewSchedule} className="text-xs font-bold text-indigo-600 hover:underline">查看完整周表</button>
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
                              <span className="flex items-center gap-1"><ElmIcon name="video-play" size={16} /> {lesson.course}</span>
                              <span className="flex items-center gap-1"><ElmIcon name="location" size={16} /> {lesson.room}</span>
                              <span className="flex items-center gap-1 text-slate-500 font-bold"><ElmIcon name="user" size={16} /> {lesson.students} 名学员</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        {lesson.isConsumed ? (
                           <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">已完成</span>
                        ) : (
                           <button
                              onClick={() => onEnterAttendance?.(lesson.id)}
                              className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-sm"
                           >
                              录入考勤
                           </button>
                        )}
                     </div>
                  </div>
               )) : (
                  <div className="py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                     <ElmIcon name="calendar" size={16} />
                     <p className="text-sm font-bold text-slate-400">今日暂无分配的授课任务</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
