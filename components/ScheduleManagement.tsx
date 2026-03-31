import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ElmIcon } from './ElmIcon';
// import { ... } from 'lucide-react'; // Removing many imports to use ElmIcon
import { AttendanceModal } from './AttendanceModal';
import { ScheduleGenerationModal } from './ScheduleGenerationModal';

type ScheduleStatus = 'draft' | 'published' | 'completed' | 'canceled' | 'scheduled';
type ViewMode = 'calendar' | 'list';

interface ScheduleManagementProps {
  onEnterAttendance?: (lesson: any) => void;
  onEnterConsumption?: (lesson: any) => void;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ onEnterAttendance: _unused, onEnterConsumption: _unused_c }) => {
  /* Use real store data */
  const { 
    currentUser, attendanceRecords, confirmConsumption, generateDraft, 
    publishSchedules, assetAccounts, students, courses, classes, 
    addToast, campuses, fetchCampuses, teachers, fetchTeachers, fetchClasses 
  } = useStore();

  useEffect(() => {
    fetchCampuses();
    fetchTeachers(currentUser?.campus_id);
    fetchClasses(currentUser?.campus_id);
  }, []);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceLesson, setAttendanceLesson] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('all');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');

  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);

  const allAssignments = useMemo(() => {
    const list: any[] = [];
    (classes || []).forEach(cls => {
      const clsAny = cls as any;
      if (clsAny.assignments) {
        (clsAny.assignments || []).forEach((a: any) => {
          list.push({ id: a.id, class_id: cls.id, className: cls.name, courseName: a.course?.name });
        });
      } else if (clsAny.assignment_id) {
        list.push({ id: clsAny.assignment_id, class_id: cls.id, className: cls.name, courseName: clsAny.course?.name });
      }
    });
    return list;
  }, [classes]);

  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [anchorDate, setAnchorDate] = useState(new Date()); // Default to current date
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handlePrevWeek = () => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - 7);
    setAnchorDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + 7);
    setAnchorDate(d);
  };

  const weekRange = useMemo(() => {
    const start = new Date(anchorDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday,
      end: sunday,
      formatted: `${monday.getFullYear()}年 ${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`
    };
  }, [anchorDate]);

  const handleSearch = async () => {
    const campusId = selectedCampusId === 'all' ? currentUser?.campus_id : selectedCampusId;
    console.log('[ScheduleManagement] Querying for campusId:', campusId);
    try {
      await fetchClasses(campusId);
      addToast('课表数据已同步', 'success');
    } catch (e) {
      console.error('[ScheduleManagement] Search failed:', e);
      addToast('数据同步失败', 'error');
    }
  };

  const handleReset = () => {
    setSelectedCampusId('all');
    setSelectedAssignmentId('all');
    setSelectedClassId('all');
    setSelectedCourseName('all');
    setSelectedTeacherName('all');
    setSelectedStatus('all');
    setAnchorDate(new Date());
    fetchClasses(currentUser?.campus_id);
    addToast('筛选条件已重置', 'info');
  };

  const displayLessons = useMemo(() => {
    const allLessons: any[] = [];

    (classes || []).forEach(cls => {
      const clsAny = cls as any;
      // Handle nested assignments (Admin view)
      if (clsAny.assignments && Array.isArray(clsAny.assignments)) {
                (clsAny.assignments || []).forEach((a: any) => {
                    if (a.schedules) {
                        (a.schedules || []).forEach((sched: any) => {
                            const startDate = new Date(sched.start_time);
                            const endDate = new Date(sched.end_time);
                            allLessons.push({
                                id: sched.id,
                                date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
                                time: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
                                className: cls.name,
                                courseName: a.course?.name || '未知课程',
                                teacherName: a.teacher?.name || '未知教师',
                                teacher_id: a.teacher_id,
                                classroom: sched.classroom || '未分配',
                                expected: cls.enrolled || 0,
                                attended: sched.attendances?.length || 0,
                                usageStatus: sched.status === 'COMPLETED' ? 'confirmed' : 'unconfirmed',
                                status: (sched.status || 'draft').toLowerCase(),
                                course_id: a.course_id,
                                class_id: cls.id,
                                assignment_id: a.id
                            });
                        });
                    }
                });
      }

      // Handle flattened structure (Teacher view or legacy)
      if (clsAny.schedules && !clsAny.assignments) {
            (clsAny.schedules || []).forEach((sched: any) => {
                const startDate = new Date(sched.start_time);
                const endDate = new Date(sched.end_time);
                allLessons.push({
                    id: sched.id,
                    date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
                    time: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
                    className: cls.name,
                    courseName: clsAny.course?.name || '未知课程',
                    teacherName: clsAny.teacher?.name || '未知教师',
                    teacher_id: clsAny.teacher_id,
                    classroom: sched.classroom || '未分配',
                    expected: cls.enrolled || 0,
                    attended: sched.attendances?.length || 0,
                    usageStatus: sched.status === 'COMPLETED' ? 'confirmed' : 'unconfirmed',
                    status: (sched.status || 'draft').toLowerCase(),
                    course_id: clsAny.course_id,
                    class_id: cls.id,
                    assignment_id: clsAny.assignment_id
                });
            });
      }
    });

    let result = allLessons.filter(l => {
      const lessonDate = new Date(l.date);
      // Normalize to day start to avoid timezone/time issues
      const normalizedLessonDate = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
      const normalizedStart = new Date(weekRange.start.getFullYear(), weekRange.start.getMonth(), weekRange.start.getDate());
      const normalizedEnd = new Date(weekRange.end.getFullYear(), weekRange.end.getMonth(), weekRange.end.getDate());
      
      return normalizedLessonDate >= normalizedStart && normalizedLessonDate <= normalizedEnd;
    });

    if (selectedClassId !== 'all') {
      result = result.filter(l => l.class_id === selectedClassId);
    }

    if (selectedCourseName !== 'all') {
      result = result.filter(l => l.courseName === selectedCourseName);
    }

    if (selectedTeacherName !== 'all') {
      result = result.filter(l => l.teacherName === selectedTeacherName);
    }

    if (selectedStatus !== 'all') {
      result = result.filter(l => l.status === selectedStatus);
    }

    if (isTeacher) {
      const myId = currentUser?.teacherId;
      result = result.filter(l => (l as any).teacher_id === myId || l.teacherName === (currentUser?.name || currentUser?.username));
    }

    return result;
  }, [classes, currentUser, isTeacher, isStudent, weekRange, selectedClassId, selectedCourseName, selectedTeacherName, selectedStatus]);

  const getStatusConfig = (status: ScheduleStatus) => {
    switch (status) {
      case 'draft': return { label: '草稿 (待发布)', style: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' };
      case 'published': return { label: '已发布', style: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
      case 'completed': return { label: '已完成', style: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
      case 'canceled': return { label: '已取消', style: 'bg-red-50 text-red-400 border-red-100', dot: 'bg-red-400' };
      case 'scheduled': 
      default: 
        return { label: '已排课', style: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
    }
  };

  return (
    <div className="space-y-6 animate-in duration-500 pb-20 relative">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hover:text-blue-600 transition-colors cursor-pointer">教学管理</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600 font-medium">课表</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isTeacher || isStudent ? '我的课表' : '课表管理'}</h1>
        </div>
        {!isStudent && (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <ElmIcon name="download" size={18} /> 导出
            </button>
            <button
              onClick={() => {
                if (selectedAssignmentId === 'all') {
                  addToast('请在下方筛选器中选择具体教学任务以生成课表', 'warning');
                  return;
                }
                setIsGenModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <ElmIcon name="calendar" size={18} /> 生成课表草稿
            </button>
            <button
              onClick={async () => {
                const draftIds = displayLessons.filter(l => l.status === 'draft').map(l => l.id);
                if (draftIds.length === 0) {
                  addToast('当前没有待发布的草稿课次', 'info');
                  return;
                }
                try {
                  await publishSchedules(draftIds);
                } catch (e: any) {
                  if (e.response?.data?.conflicts) {
                    setConflictData(e.response.data.conflicts);
                    setIsConflictModalOpen(true);
                  }
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <ElmIcon name="finished" size={18} /> 发布已选课表
            </button>
          </div>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        {!isStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {!isCampusAdmin && !isTeacher && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">校区</label>
                <div className="relative">
                  <select 
                    value={selectedCampusId}
                    onChange={e => setSelectedCampusId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">全量校区</option>
                    {(campuses || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ElmIcon name="arrow-down" size={16} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">教学任务</label>
              <div className="relative">
                <select
                  value={selectedAssignmentId}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedAssignmentId(val);
                    // Also update selectedClassId for filtering
                    const assignment = allAssignments.find(a => a.id === val);
                    setSelectedClassId(assignment?.class_id || 'all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">所有教学任务</option>
                  {allAssignments.map(a => (
                    <option key={a.id} value={a.id}>{a.className} - {a.courseName}</option>
                  ))}
                </select>
                <ElmIcon name="arrow-down" size={16} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程</label>
              <div className="relative">
                <select 
                  value={selectedCourseName}
                  onChange={e => setSelectedCourseName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">所有课程</option>
                  {(courses || []).map(course => (
                    <option key={course.id} value={course.name}>{course.name}</option>
                  ))}
                </select>
                <ElmIcon name="arrow-down" size={16} />
              </div>
            </div>
            {!isTeacher && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">教师</label>
                <div className="relative">
                  <select 
                    value={selectedTeacherName}
                    onChange={e => setSelectedTeacherName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">所有教师</option>
                    {(teachers || []).map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <ElmIcon name="arrow-down" size={16} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">状态</label>
              <div className="relative">
                <select 
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">所有状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="completed">已完成</option>
                  <option value="canceled">已取消</option>
                </select>
                <ElmIcon name="arrow-down" size={16} />
              </div>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ElmIcon name="calendar" size={16} /> 周视图
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ElmIcon name="list" size={16} /> 列表
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
                  <button onClick={handlePrevWeek} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ElmIcon name="arrow-left" size={16} /></button>
                  <div className="relative group">
                    <span
                      onClick={() => dateInputRef.current?.showPicker()}
                      className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors block"
                    >
                      {weekRange.formatted}
                    </span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="absolute inset-0 opacity-0 pointer-events-none"
                      onChange={(e) => e.target.value && setAnchorDate(new Date(e.target.value))}
                    />
                  </div>
                  <button onClick={handleNextWeek} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ElmIcon name="arrow-right" size={16} /></button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              >
                <ElmIcon name="refresh" size={16} /> 重置
              </button>
              <button 
                onClick={handleSearch}
                className="flex items-center gap-2 px-10 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95"
              >
                <ElmIcon name="search" size={16} /> 查询
              </button>
            </div>
          </div>
        )}
        {isStudent && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">排课区间:</span>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <button onClick={handlePrevWeek} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ElmIcon name="arrow-left" size={16} /></button>
                <div className="relative">
                  <span
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 font-mono tracking-tight cursor-pointer hover:bg-blue-50"
                  >
                    {weekRange.formatted}
                  </span>
                </div>
                <button onClick={handleNextWeek} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ElmIcon name="arrow-right" size={16} /></button>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400">共有 <span className="text-blue-600">{displayLessons.length}</span> 节待上课程</p>
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
                <ElmIcon name="operation" size={16} />
              </div>
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
                const d = new Date(weekRange.start);
                d.setDate(d.getDate() + i);
                const dateStr = `${d.getMonth() + 1}.${d.getDate()}`;
                const isToday = new Date().toDateString() === d.toDateString();

                return (
                  <div key={i} className={`h-14 border-r border-slate-100 flex flex-col items-center justify-center ${isToday ? 'bg-blue-50/30' : ''}`}>
                    <span className={`text-[11px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'} uppercase tracking-widest`}>
                      {day} ({dateStr})
                    </span>
                  </div>
                );
              })}
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
                          <ElmIcon name="top-right" size={16} />
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
                            <ElmIcon name="reading" size={16} />
                            {lesson.courseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <ElmIcon name="user" size={16} />
                            {lesson.teacherName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <ElmIcon name="house" size={16} />
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
                            <ElmIcon name="circle-check" size={16} /> 已确认消课
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                            <ElmIcon name="clock" size={16} /> 待消课确认
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
                                <ElmIcon name="data-analysis" size={16} /> 确认消课
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <ElmIcon name="finished" size={16} /> 已完成消课
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
                              <ElmIcon name="circle-check" size={16} /> 录入考勤
                            </button>
                          )}
                          <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><ElmIcon name="more-filled" size={16} /></button>
                        </div>
                      </td>
                      {isStudent && (
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedLesson(lesson)}
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          >
                            <ElmIcon name="arrow-right" size={16} />
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
                  <ElmIcon name="arrow-down" size={16} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled className="p-2 text-slate-300 cursor-not-allowed"><ElmIcon name="arrow-left" size={16} /></button>
                <div className="flex items-center gap-1 px-2">
                  <button className="w-9 h-9 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 transition-all">1</button>
                  <button className="w-9 h-9 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">2</button>
                  <button className="w-9 h-9 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">3</button>
                </div>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><ElmIcon name="arrow-right" size={16} /></button>
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
                <ElmIcon name="close" size={16} />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Basic Meta Card */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                  <ElmIcon name="warning" size={16} /> 基础授课档案
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 grid grid-cols-2 gap-y-8 gap-x-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课时间</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLesson.date} <br /> {selectedLesson.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">授课教室</p>
                    <div className="flex items-center gap-2">
                      <ElmIcon name="location" size={16} />
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
                  <ElmIcon name="circle-check" size={16} /> 考勤与消课状态
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
                      <ElmIcon name="circle-check" size={16} /> 录入考勤
                    </button>
                    <button
                      onClick={() => confirmConsumption(selectedLesson.id)}
                      className="flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold transition-all border border-emerald-500/20 active:scale-95"
                    >
                      <ElmIcon name="data-analysis" size={16} /> 消课确认
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/10 active:scale-95">
                      <ElmIcon name="clock" size={16} /> 调整时间
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition-all border border-red-500/20 active:scale-95">
                      <ElmIcon name="close" size={16} /> 取消课次
                    </button>
                  </div>
                )}
                {isStudent && (
                  <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                    <ElmIcon name="chat-round" size={16} /> 向老师请假
                  </button>
                )}
              </div>

              {/* Student List Entry */}
              <button className="w-full p-6 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 rounded-3xl transition-all group flex items-center justify-between hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ElmIcon name="user" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">查看学员签到名单</p>
                    <p className="text-[10px] text-slate-400 font-medium">当前已报名人数 {selectedLesson.expected} 位</p>
                  </div>
                </div>
                <ElmIcon name="arrow-right" size={16} />
              </button>

              {/* Internal Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <ElmIcon name="document" size={16} /> 内部授课备注
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

      <ScheduleGenerationModal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        assignmentId={selectedAssignmentId === 'all' ? undefined : selectedAssignmentId}
        assignmentName={allAssignments.find(a => a.id === selectedAssignmentId)?.className + ' - ' + allAssignments.find(a => a.id === selectedAssignmentId)?.courseName}
      />

      {/* Conflict Modal */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConflictModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 text-white rounded-xl"><ElmIcon name="warning" size={16} /></div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">发现排课冲突</h2>
              </div>
              <button onClick={() => setIsConflictModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><ElmIcon name="close" size={16} /></button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                部分课次发布失败，系统检测到以下资源冲突。请调整相关课次的时间、教师或教室后再试：
              </p>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {conflictData?.map((c: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{c.type === 'TEACHER' ? '教师时间冲突' : '教室占用冲突'}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{c.lessonId}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsConflictModalOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all">
                返回修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
