import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  Plus,
  Search,
  Download,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Users,
  BookOpen,
  User as UserIcon,
  MoreHorizontal,
  RotateCcw,
  CheckCircle2,
  Clock,
  X,
  ArrowUpRight,
  AlertCircle,
  FileText,
  DoorOpen,
  Settings2,
  TrendingDown,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';

type ScheduleStatus = 'pending' | 'ongoing' | 'completed' | 'canceled';
type ViewMode = 'calendar' | 'list';

interface ScheduleManagementProps {
  onEnterAttendance?: (lesson: any) => void;
  onEnterConsumption?: (lesson: any) => void;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ onEnterAttendance: _unused, onEnterConsumption: _unused_c }) => {
  /* Use real store data */
  const { currentUser, attendanceRecords, confirmConsumption, assetAccounts, students, courses, classes } = useStore();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceLesson, setAttendanceLesson] = useState<any>(null);

  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const displayLessons = useMemo(() => {
    // Transform classes.schedules into Lesson[]
    const allLessons: any[] = [];
    classes.forEach(cls => {
      if (cls.schedules) {
        cls.schedules.forEach(sched => {
          allLessons.push({
            id: sched.id,
            date: (sched.start_time || '').split(/[T ]/)[0] || '',
            time: (() => {
              const start = (sched.start_time || '').split(/[T ]/)[1];
              const end = (sched.end_time || '').split(/[T ]/)[1];
              if (start && end) {
                return `${start.substring(0, 5)} - ${end.substring(0, 5)}`;
              }
              return '00:00 - 00:00';
            })(),
            className: cls.name,
            courseName: cls.course?.name || '未知课程',
            teacherName: cls.teacher?.name || '未知教师',
            classroom: sched.classroom || '未分配',
            expected: cls.enrolled || 0,
            attended: sched.attendances?.length || 0,
            usageStatus: sched.status === 'COMPLETED' ? 'confirmed' : 'unconfirmed',
            status: sched.status.toLowerCase(),
            course_id: cls.course_id,
            class_id: cls.id
          });
        });
      }
    });

    if (isTeacher) {
      const teacherProfile = (currentUser as any)?.teacherProfile;
      return allLessons.filter(l => l.teacherName === teacherProfile?.name);
    }
    if (isStudent && currentUser?.bindStudentId) {
      // Filter by student's enrolled classes
      const studentEnrollments = classes.filter(cls =>
        cls.students?.some((s: any) => s.student_id === currentUser.bindStudentId)
      ).map(cls => cls.name);
      return allLessons.filter(l => studentEnrollments.includes(l.className));
    }

    return allLessons;
  }, [classes, currentUser, isTeacher, isStudent]);

  const getStatusConfig = (status: ScheduleStatus) => {
    switch (status) {
      case 'pending': return { label: '未开始', style: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' };
      case 'ongoing': return { label: '进行中', style: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
      case 'completed': return { label: '已完成', style: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
      case 'canceled': return { label: '已取消', style: 'bg-slate-50 text-slate-400 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hover:text-blue-600 transition-colors cursor-pointer">教学管理</span>
            <ChevronRight size={14} />
            <span className="text-slate-600 font-medium">课表</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isTeacher || isStudent ? '我的课表' : '课表管理'}</h1>
        </div>
        {!isStudent && (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Download size={18} /> 导出
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-95">
              <Plus size={18} /> 新增课次
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
              <Calendar size={18} /> 生成课表
            </button>
          </div>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        {!isStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {!isCampusAdmin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">校区</label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer">
                    <option value="all">全量校区</option>
                    <option value="1">总部旗舰校</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">班级</label>
              <div className="relative">
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer">
                  <option value="all">所有班级</option>
                  <option value="1">UI精英1班</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程</label>
              <div className="relative">
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer">
                  <option value="all">所有课程</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {!isTeacher && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">教师</label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer">
                    <option value="all">所有教师</option>
                    <option value="李老师">李老师</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">状态</label>
              <div className="relative">
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer">
                  <option value="all">所有状态</option>
                  <option value="pending">未开始</option>
                  <option value="ongoing">进行中</option>
                  <option value="completed">已完成</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Calendar size={14} /> 周视图
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={14} /> 列表
                </button>
              </div>
            </div>
          </div>
        )}
        {!isStudent && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">排课区间:</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                  <span className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100">2024年 5月20日 - 5月26日</span>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
                <RotateCcw size={16} /> 重置
              </button>
              <button className="flex items-center gap-2 px-10 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95">
                <Search size={16} /> 查询
              </button>
            </div>
          </div>
        )}
        {isStudent && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">当前周次:</span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                <span className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 font-mono tracking-tight">2024.05.20 - 2024.05.26</span>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400">共有 <span className="text-blue-600">3</span> 节待上课程</p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'calendar' ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            {/* Calendar Header Row (Weekdays) */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-slate-50/50 border-b border-slate-100">
              <div className="h-14 border-r border-slate-100 flex items-center justify-center">
                <Settings2 size={16} className="text-slate-300" />
              </div>
              {['周一 (5.20)', '周二 (5.21)', '周三 (5.22)', '周四 (5.23)', '周五 (5.24)', '周六 (5.25)', '周日 (5.26)'].map((day, i) => (
                <div key={i} className={`h-14 border-r border-slate-100 flex flex-col items-center justify-center ${i === 0 ? 'bg-blue-50/30' : ''}`}>
                  <span className={`text-[11px] font-bold ${i === 0 ? 'text-blue-600' : 'text-slate-400'} uppercase tracking-widest`}>{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid Body */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] relative h-[600px] overflow-y-auto custom-scrollbar">
              {/* Time Column */}
              <div className="flex flex-col border-r border-slate-100 bg-slate-50/30">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(t => (
                  <div key={t} className="h-24 border-b border-slate-100 flex items-start justify-center pt-2">
                    <span className="text-[10px] font-bold text-slate-300 font-mono tracking-tighter">{t}</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                <div key={dayIdx} className="flex flex-col border-r border-slate-100 relative h-full">
                  {/* Background Grid Lines */}
                  {[0, 1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 border-b border-slate-100/50"></div>)}

                  {/* Course Blocks for each day (Demo Logic) */}
                  {displayLessons.filter(l => {
                    const d = new Date(l.date).getDay(); // 0 is Sun
                    const normalizedDay = d === 0 ? 6 : d - 1; // Mon=0 ... Sun=6
                    return normalizedDay === dayIdx;
                  }).map((lesson, idx) => {
                    const statusConfig = getStatusConfig(lesson.status);
                    // Determine vertical position based on mock time
                    const startHour = parseInt(lesson.time.split(':')[0]);
                    const topPos = (startHour - 8) * (96 / 2); // 96px per 2 hours

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`absolute left-1 right-1 p-3 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] z-10 flex flex-col justify-between overflow-hidden group ${statusConfig.style}`}
                        style={{ top: `${topPos}px`, height: '110px' }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">{lesson.time.split(' - ')[0]}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
                          </div>
                          <p className="text-xs font-bold truncate leading-tight">{lesson.className}</p>
                          <p className="text-[10px] opacity-60 font-medium truncate">{lesson.teacherName} · {lesson.classroom}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-bold tracking-tighter">详情</span>
                          <ArrowUpRight size={12} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">课次时间</th>
                  <th className="px-8 py-5">班级 / 课程</th>
                  <th className="px-8 py-5">教师 / 教室</th>
                  <th className="px-8 py-5 text-center">考勤人数</th>
                  <th className="px-8 py-5">课消状态</th>
                  <th className="px-8 py-5">排课状态</th>
                  {!isStudent && <th className="px-8 py-5 text-right pr-12">教务操作</th>}
                  {isStudent && <th className="px-8 py-5 text-right pr-12">详情</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayLessons.map((lesson) => {
                  const statusConfig = getStatusConfig(lesson.status);
                  return (
                    <tr key={lesson.id} className="hover:bg-blue-50/5 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex flex-col items-center justify-center font-mono tracking-tighter shadow-inner group-hover:bg-white group-hover:text-blue-600 transition-colors">
                            <span className="text-[9px] leading-none mb-0.5">{lesson.date.split('-')[1]}月</span>
                            <span className="text-sm font-bold leading-none">{lesson.date.split('-')[2]}</span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-800">{lesson.time}</p>
                            <p className="text-[10px] text-slate-400 font-medium">预计耗时 150min</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{lesson.className}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <BookOpen size={12} className="opacity-40" />
                            {lesson.courseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <UserIcon size={14} className="text-slate-300" />
                            {lesson.teacherName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <DoorOpen size={12} className="text-slate-300" />
                            {lesson.classroom}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`text-sm font-bold ${lesson.attended > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {lesson.status === 'completed' ? `${lesson.attended} / ${lesson.expected}` : `-- / ${lesson.expected}`}
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: lesson.status === 'completed' ? `${(lesson.attended / lesson.expected) * 100}%` : '0%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {lesson.usageStatus === 'confirmed' ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                            <CheckCircle2 size={14} /> 已确认消课
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                            <Clock size={14} /> 待消课确认
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 w-fit ${statusConfig.style}`}>
                          <div className={`w-1 h-1 rounded-full ${statusConfig.dot}`}></div>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-4">
                          {attendanceRecords.some(r => r.lesson_id === lesson.id) ? (
                            attendanceRecords.find(r => r.lesson_id === lesson.id)?.deductStatus === 'pending' ? (
                              <button
                                onClick={() => confirmConsumption(lesson.id)}
                                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 transition-all active:scale-95"
                              >
                                <TrendingDown size={14} /> 确认消课
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <ShieldCheck size={14} /> 已完成消课
                              </div>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                setAttendanceLesson(lesson);
                                setIsAttendanceModalOpen(true);
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all active:scale-95"
                            >
                              <CheckCircle2 size={14} /> 录入考勤
                            </button>
                          )}
                          <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreHorizontal size={16} /></button>
                        </div>
                      </td>
                      {isStudent && (
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedLesson(lesson)}
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination for List View */}
            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-4">
                <span>显示 1 - 10 / 共 156 课次</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button className="px-2 py-1 text-[10px] bg-slate-100 rounded">10 条/页</button>
                  <ChevronDown size={12} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled className="p-2 text-slate-300 cursor-not-allowed"><ChevronLeft size={20} /></button>
                <div className="flex items-center gap-1 px-2">
                  <button className="w-9 h-9 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 transition-all">1</button>
                  <button className="w-9 h-9 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">2</button>
                  <button className="w-9 h-9 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">3</button>
                </div>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Detail Drawer */}
      {selectedLesson && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedLesson(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">课次详情</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedLesson.id} · 系统流水档</p>
              </div>
              <button onClick={() => setSelectedLesson(null)} className="p-2.5 hover:bg-slate-200 text-slate-400 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Basic Meta Card */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                  <AlertCircle size={14} /> 基础授课档案
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 grid grid-cols-2 gap-y-8 gap-x-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课时间</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLesson.date} <br /> {selectedLesson.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课教室</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-300" />
                      <p className="text-sm font-bold text-slate-900">{selectedLesson.classroom}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">班级名称</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLesson.className}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课讲师</p>
                    <p className="text-sm font-bold text-blue-600 underline underline-offset-4">{selectedLesson.teacherName}</p>
                  </div>
                </div>
              </section>

              {/* Status Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                  <CheckCircle2 size={14} /> 考勤与消课状态
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本节出勤率</p>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                        {selectedLesson.status === 'completed' ? `${((selectedLesson.attended / selectedLesson.expected) * 100).toFixed(0)}%` : '--'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{selectedLesson.attended} / {selectedLesson.expected} 人</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">课消状态</p>
                    <div className="flex items-center gap-2 h-full">
                      {selectedLesson.usageStatus === 'confirmed' ? (
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">已扣除课时</div>
                      ) : (
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100">待扣课时</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions Card */}
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-xl shadow-slate-200">
                <div className="space-y-1">
                  <h4 className="text-base font-bold tracking-tight">课次快捷管理</h4>
                  <p className="text-[10px] opacity-60 font-medium">您可以对该节课次进行考勤录入或状态变更</p>
                </div>
                {!isStudent && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setAttendanceLesson(selectedLesson);
                        setIsAttendanceModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all shadow-lg active:scale-95"
                    >
                      <CheckCircle2 size={16} /> 录入考勤
                    </button>
                    <button
                      onClick={() => confirmConsumption(selectedLesson.id)}
                      className="flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold transition-all border border-emerald-500/20 active:scale-95"
                    >
                      <TrendingDown size={16} /> 消课确认
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/10 active:scale-95">
                      <Clock size={16} /> 调整时间
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition-all border border-red-500/20 active:scale-95">
                      <X size={16} /> 取消课次
                    </button>
                  </div>
                )}
                {isStudent && (
                  <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> 向老师请假
                  </button>
                )}
              </div>

              {/* Student List Entry */}
              <button className="w-full p-6 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 rounded-3xl transition-all group flex items-center justify-between hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Users size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">查看学员签到名单</p>
                    <p className="text-[10px] text-slate-400 font-medium">当前已报名人数 {selectedLesson.expected} 位</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Internal Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <FileText size={14} /> 内部授课备注
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-3xl min-h-[100px] text-sm text-slate-500 font-medium italic leading-relaxed">
                  "该班级学风较为活跃，本节课重点讲解 Figma 高级原型交互，需提醒学员带好个人笔记本电脑。"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-in { animation-fill-mode: forwards; }
        .fade-in { animation-name: fadeIn; }
        .slide-in-from-right { animation-name: slideInRight; }
      `}} />

      {attendanceLesson && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setAttendanceLesson(null);
          }}
          lesson={attendanceLesson}
        />
      )}
    </div>
  );
};
