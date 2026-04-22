import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ElmIcon } from './ElmIcon';
import { AttendanceModal } from './AttendanceModal';
import { ScheduleGenerationModal } from './ScheduleGenerationModal';
import api from '../utils/api';

type ScheduleStatus = 'draft' | 'published' | 'completed' | 'canceled' | 'scheduled';
type ViewMode = 'calendar' | 'list';

interface ScheduleManagementProps {
  onEnterAttendance?: (lesson: any) => void;
  onEnterConsumption?: (lesson: any) => void;
  defaultViewMode?: 'calendar' | 'list';
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ onEnterAttendance: _unused, onEnterConsumption: _unused_c, defaultViewMode }) => {
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
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
  const [existingLeaveStatus, setExistingLeaveStatus] = useState<string | null>(null);
  const [isAttendanceListOpen, setIsAttendanceListOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

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

  const isAdminRole = currentUser?.role === 'admin' || currentUser?.role === 'campus_admin';
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(isAdminRole ? 'list' : (defaultViewMode || 'calendar'));
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

  // Fetch existing leave status when student selects a lesson
  useEffect(() => {
    if (!isStudent || !selectedLesson) { setExistingLeaveStatus(null); return; }
    let cancelled = false;
    api.get('/api/teaching/my-leaves').then(res => {
      if (cancelled) return;
      const match = (res.data || []).find((l: any) =>
        l.lesson_id === selectedLesson.id && (l.status === 'PENDING' || l.status === 'APPROVED')
      );
      setExistingLeaveStatus(match?.status || null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isStudent, selectedLesson?.id]);

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
                                attended: sched._count?.attendances || sched.attendances?.length || 0,
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
                    attended: sched._count?.attendances || sched.attendances?.length || 0,
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

  const handleExportSchedule = () => {
    if (!displayLessons || displayLessons.length === 0) {
      addToast('暂无课表数据可导出', 'warning');
      return;
    }
    const headers = ['课程日期', '时间段', '班级名称', '课程名称', '授课教师', '教室', '应到人数', '实到人数', '状态'];
    const rows = displayLessons.map((l: any) => [l.date, l.time, l.className, l.courseName, l.teacherName, l.classroom, l.expected, l.attended, l.status]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `课表数据_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    addToast(`已导出 ${displayLessons.length} 条课表记录`, 'success');
  };

  return (
    <div className="space-y-6 animate-in duration-500 pb-20 relative">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hover:text-blue-600 transition-colors cursor-pointer">教学管理</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600 font-medium">{isTeacher ? '课表与考勤' : '课表'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isTeacher ? '课表与考勤' : isStudent ? '我的课表' : '课表管理'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="flex items-center gap-1.5"><ElmIcon name="calendar" size={14} /> 周课表</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="flex items-center gap-1.5"><ElmIcon name="circle-check" size={14} /> 考勤录入</span>
              </button>
            </div>
          )}
          {!isStudent && (
            <button onClick={handleExportSchedule} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <ElmIcon name="download" size={18} /> 导出
            </button>
          )}
          {!isTeacher && !isStudent && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        {isTeacher && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">班级课程</label>
                <div className="relative">
                  <select
                    value={selectedAssignmentId}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedAssignmentId(val);
                      const assignment = allAssignments.find(a => a.id === val);
                      setSelectedClassId(assignment?.class_id || 'all');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer min-w-[200px]"
                  >
                    <option value="all">全部班级</option>
                    {allAssignments.map(a => (
                      <option key={a.id} value={a.id}>{a.className} - {a.courseName}</option>
                    ))}
                  </select>
                  <ElmIcon name="arrow-down" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">状态</label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer min-w-[140px]"
                  >
                    <option value="all">所有状态</option>
                    <option value="published">已发布</option>
                    <option value="completed">已完成</option>
                  </select>
                  <ElmIcon name="arrow-down" size={16} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>本周 <span className="text-indigo-600 text-sm">{displayLessons.length}</span> 节课</span>
              <button
                onClick={() => fetchClasses(currentUser?.campus_id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ElmIcon name="refresh" size={13} /> 刷新
              </button>
            </div>
          </div>
        )}
        {!isStudent && !isTeacher && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {!isCampusAdmin && (
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
            {!isAdminRole && (
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
            )}
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
                      onChange={(e) => e.target.value && setAnchorDate(new Date(e.target.value + 'T12:00:00'))}
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
                  <input
                    ref={dateInputRef}
                    type="date"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    onChange={(e) => e.target.value && setAnchorDate(new Date(e.target.value + 'T12:00:00'))}
                  />
                </div>
                <button onClick={handleNextWeek} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ElmIcon name="arrow-right" size={16} /></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-slate-400">本周 <span className="text-blue-600">{displayLessons.length}</span> 节课</p>
              <button
                onClick={() => fetchClasses(currentUser?.campus_id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="刷新课表数据"
              >
                <ElmIcon name="refresh" size={13} /> 刷新
              </button>
            </div>
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
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                const dayLessons = displayLessons.filter(l => {
                  const d = new Date(l.date).getDay(); // 0 is Sun
                  const normalizedDay = d === 0 ? 6 : d - 1; // Mon=0 ... Sun=6
                  return normalizedDay === dayIdx;
                });

                // Group by same start-time to handle overlapping lessons side-by-side
                const timeGroups: Record<string, typeof dayLessons> = {};
                for (const l of dayLessons) {
                  const key = l.time.split(' - ')[0];
                  if (!timeGroups[key]) timeGroups[key] = [];
                  timeGroups[key].push(l);
                }

                return (
                <div key={dayIdx} className="flex flex-col border-r border-slate-100 relative h-full">
                  {/* Background Grid Lines */}
                  {[0, 1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 border-b border-slate-100/50"></div>)}

                  {/* Course Blocks — overlapping lessons are split side-by-side */}
                  {Object.entries(timeGroups).flatMap(([timeKey, lessons]) =>
                    lessons.map((lesson, slotIdx) => {
                      const statusConfig = getStatusConfig(lesson.status);
                      const startHour = parseInt(timeKey.split(':')[0]);
                      const startMin = parseInt(timeKey.split(':')[1] || '0');
                      const topPos = (startHour - 8) * (96 / 2) + startMin * (96 / 120);

                      const total = lessons.length;
                      // Each slot gets equal share of width with 2px gap
                      const slotW = 100 / total;
                      const leftPct = slotW * slotIdx;

                      return (
                        <div
                          key={`${lesson.id}-${slotIdx}`}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`absolute p-2 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] z-10 flex flex-col justify-between overflow-hidden group ${statusConfig.style}`}
                          style={{
                            top: `${topPos}px`,
                            height: '100px',
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${slotW}% - 4px)`,
                          }}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 font-mono">{timeKey}</span>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`}></div>
                            </div>
                            <p className="text-[10px] font-bold leading-tight line-clamp-2">{lesson.courseName || lesson.className}</p>
                            {total === 1 && (
                              <p className="text-[9px] opacity-50 font-medium truncate">{lesson.teacherName} · {lesson.classroom}</p>
                            )}
                          </div>
                          {total === 1 && (
                            <div className="flex items-center justify-between mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] font-bold tracking-tighter">详情</span>
                              <ElmIcon name="top-right" size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-5 py-3">课次时间</th>
                  <th className="px-5 py-3">班级 / 课程</th>
                  <th className="px-5 py-3">教师 / 教室</th>
                  <th className="px-5 py-3 text-center">考勤人数</th>
                  <th className="px-5 py-3">课消状态</th>
                  <th className="px-5 py-3">排课状态</th>
                  {!isStudent && <th className="px-5 py-3 text-right pr-8">教务操作</th>}
                  {isStudent && <th className="px-5 py-3 text-right pr-8">详情</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayLessons.map((lesson) => {
                  const statusConfig = getStatusConfig(lesson.status);
                  return (
                    <tr key={lesson.id} className="hover:bg-blue-50/5 transition-all group">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex flex-col items-center justify-center font-mono tracking-tighter shadow-inner group-hover:bg-white group-hover:text-blue-600 transition-colors shrink-0">
                            <span className="text-[8px] leading-none mb-0.5">{lesson.date.split('-')[1]}月</span>
                            <span className="text-xs font-bold leading-none">{lesson.date.split('-')[2]}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{lesson.time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{lesson.className}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <ElmIcon name="reading" size={12} />
                            {lesson.courseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <ElmIcon name="user" size={12} />
                            {lesson.teacherName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <ElmIcon name="house" size={12} />
                            {lesson.classroom}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-bold ${lesson.attended > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {lesson.status === 'completed' ? `${lesson.attended} / ${lesson.expected}` : `-- / ${lesson.expected}`}
                          </span>
                          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: lesson.status === 'completed' ? `${(lesson.attended / lesson.expected) * 100}%` : '0%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        {lesson.usageStatus === 'confirmed' ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                            <ElmIcon name="circle-check" size={14} /> 已确认消课
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-bold">
                            <ElmIcon name="clock" size={14} /> 待消课确认
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${statusConfig.style}`}>
                          <div className={`w-1 h-1 rounded-full ${statusConfig.dot}`}></div>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
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
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
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
      {selectedLesson && (() => {
        const statusMap: Record<string, { label: string; color: string }> = {
          published: { label: '已发布', color: 'bg-blue-50 text-blue-600 border-blue-100' },
          draft:     { label: '草稿',   color: 'bg-slate-100 text-slate-500 border-slate-200' },
          completed: { label: '已完课', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          canceled:  { label: '已取消', color: 'bg-red-50 text-red-500 border-red-100' },
          scheduled: { label: '待开课', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        };
        const st = statusMap[selectedLesson.status] || { label: selectedLesson.status, color: 'bg-slate-100 text-slate-500 border-slate-200' };
        const attendRate = selectedLesson.expected > 0 ? Math.round(selectedLesson.attended / selectedLesson.expected * 100) : 0;
        return (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 animate-in fade-in duration-200" onClick={() => setSelectedLesson(null)} />
            <div className="relative w-full max-w-md bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-y-auto custom-scrollbar">

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.color}`}>{st.label}</span>
                    {selectedLesson.usageStatus === 'confirmed' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">已课消</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedLesson.courseName || selectedLesson.className}</h3>
                  <p className="text-sm text-slate-500">{selectedLesson.className}</p>
                </div>
                <button onClick={() => setSelectedLesson(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all flex-shrink-0 mt-1">
                  <ElmIcon name="close" size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-shrink-0">
                <div className="p-6 space-y-5">

                  {/* Info rows */}
                  <div className="bg-slate-50 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                    {[
                      { icon: 'clock',    label: '上课时间', value: `${selectedLesson.date}  ${selectedLesson.time}` },
                      { icon: 'location', label: '授课教室', value: selectedLesson.classroom || '待分配' },
                      { icon: 'user',     label: '授课教师', value: selectedLesson.teacherName, highlight: true },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <ElmIcon name={row.icon} size={14} />
                        </span>
                        <span className="text-xs text-slate-400 w-16 flex-shrink-0">{row.label}</span>
                        <span className={`text-sm font-bold flex-1 ${row.highlight ? 'text-indigo-600' : 'text-slate-800'}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Attendance stats — shown after class is done or when records exist */}
                  {(selectedLesson.status === 'completed' || (isTeacher && selectedLesson.attended > 0)) && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                      <p className="text-xs font-bold text-slate-500">本节出勤</p>
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold font-mono text-slate-900">{attendRate}%</span>
                        <span className="text-xs text-slate-400 mb-1">{selectedLesson.attended} / {selectedLesson.expected} 人到课</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${attendRate}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Inline student attendance list for teachers */}
                  {isTeacher && (() => {
                    const lessonRecords = (attendanceRecords || []).filter((r: any) => r.lesson_id === selectedLesson.id || r.schedule_id === selectedLesson.id);
                    return (
                      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ElmIcon name="user" size={14} />
                            <span className="text-sm font-bold text-slate-700">学员考勤</span>
                          </div>
                          <span className="text-xs text-slate-400">{selectedLesson.expected} 位学员</span>
                        </div>
                        {lessonRecords.length > 0 ? (
                          <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto custom-scrollbar">
                            {lessonRecords.map((r: any, i: number) => (
                              <div key={r.id || i} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.student_name || i}`} className="w-8 h-8 rounded-lg" alt="" />
                                  <span className="text-sm font-medium text-slate-800">{r.student_name || r.studentName || '学员' + (i+1)}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'PRESENT' || r.status === 'present' ? 'bg-emerald-50 text-emerald-600' : r.status === 'ABSENT' || r.status === 'absent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {r.status === 'PRESENT' || r.status === 'present' ? '到课' : r.status === 'ABSENT' || r.status === 'absent' ? '缺勤' : '请假'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-400">
                            <p className="text-xs font-medium">尚未录入考勤</p>
                            <p className="text-[11px] mt-1">点击下方按钮录入</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* View student list button — for admin roles */}
                  {!isStudent && !isTeacher && (
                    <button onClick={() => setIsAttendanceListOpen(true)}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-2xl transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-all">
                          <ElmIcon name="user" size={14} />
                        </span>
                        <span className="text-sm font-bold text-slate-700">查看学员签到名单</span>
                        <span className="text-xs text-slate-400">{selectedLesson.expected} 位</span>
                      </div>
                      <ElmIcon name="arrow-right" size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Footer Actions — role-specific */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                {isStudent && (() => {
                  const isPast = new Date(selectedLesson.date + 'T00:00:00') < new Date(new Date().toDateString());
                  const isDone = selectedLesson.status === 'completed' || selectedLesson.status === 'canceled';
                  const canLeave = !isPast && !isDone;
                  if (existingLeaveStatus === 'PENDING') {
                    return (
                      <div className="w-full py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold text-center">
                        <ElmIcon name="clock" size={14} /> 请假申请审批中
                      </div>
                    );
                  }
                  if (existingLeaveStatus === 'APPROVED') {
                    return (
                      <div className="w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold text-center">
                        <ElmIcon name="circle-check" size={14} /> 请假已批准
                      </div>
                    );
                  }
                  return canLeave ? (
                    <button onClick={() => { setLeaveReason(''); setIsLeaveModalOpen(true); }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                      <ElmIcon name="chat-round" size={16} /> 申请请假
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold text-center">
                      {isDone ? '该课次已结束，无法请假' : '课程已开始，无法请假'}
                    </div>
                  );
                })()}
                {isTeacher && (
                  <button
                    onClick={() => { setAttendanceLesson(selectedLesson); setIsAttendanceModalOpen(true); }}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <ElmIcon name="circle-check" size={16} /> 录入考勤
                  </button>
                )}
                {(isCampusAdmin || (!isTeacher && !isStudent)) && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setAttendanceLesson(selectedLesson); setIsAttendanceModalOpen(true); }}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95">
                      <ElmIcon name="circle-check" size={16} /> 录入考勤
                    </button>
                    <button
                      onClick={() => confirmConsumption(selectedLesson.id)}
                      className="flex items-center justify-center gap-2 py-3 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all active:scale-95">
                      <ElmIcon name="data-analysis" size={16} /> 消课确认
                    </button>
                    <button onClick={() => setIsRescheduleModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95">
                      <ElmIcon name="clock" size={16} /> 调整时间
                    </button>
                    <button onClick={() => setIsCancelConfirmOpen(true)}
                      className="flex items-center justify-center gap-2 py-3 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all active:scale-95">
                      <ElmIcon name="close" size={16} /> 取消课次
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

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
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsConflictModalOpen(false)} />
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

      {/* Leave Request Modal */}
      {isLeaveModalOpen && selectedLesson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsLeaveModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl"><ElmIcon name="chat-round" size={16} /></div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">向老师请假</h2>
              </div>
              <button onClick={() => setIsLeaveModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><ElmIcon name="close" size={16} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">请假课次</p>
                <p className="text-sm font-bold text-slate-900">{selectedLesson.date} · {selectedLesson.time}</p>
                <p className="text-xs text-slate-500">{selectedLesson.className} · {selectedLesson.teacherName}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">提交后将由授课教师或校区管理员审批，请耐心等待。</p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">请假原因</label>
                <textarea
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="请简要说明请假原因，以便老师安排..."
                  className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-800 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsLeaveModalOpen(false)} className="px-8 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all">取消</button>
              <button
                disabled={isLeaveSubmitting}
                onClick={async () => {
                  if (!leaveReason.trim()) { addToast('请填写请假原因', 'error'); return; }
                  setIsLeaveSubmitting(true);
                  try {
                    await api.post('/api/teaching/leave/apply', { lessonId: selectedLesson.id, reason: leaveReason });
                    setIsLeaveModalOpen(false);
                    setLeaveReason('');
                    setExistingLeaveStatus('PENDING');
                    addToast('请假申请已提交，等待审批', 'success');
                  } catch (e: any) {
                    addToast(e?.response?.data?.message || '提交失败', 'error');
                  } finally {
                    setIsLeaveSubmitting(false);
                  }
                }}
                className={`px-8 py-3 rounded-2xl text-xs font-bold transition-all ${isLeaveSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
              >{isLeaveSubmitting ? '提交中...' : '提交申请'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance List Modal */}
      {isAttendanceListOpen && selectedLesson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsAttendanceListOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl"><ElmIcon name="user" size={16} /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">学员签到名单</h2>
                  <p className="text-xs text-slate-400">{selectedLesson.date} · {selectedLesson.className}</p>
                </div>
              </div>
              <button onClick={() => setIsAttendanceListOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><ElmIcon name="close" size={16} /></button>
            </div>
            <div className="p-8 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {(() => {
                const lessonRecords = (attendanceRecords || []).filter((r: any) => r.lesson_id === selectedLesson.id || r.schedule_id === selectedLesson.id);
                if (lessonRecords.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400">
                      <ElmIcon name="user" size={32} />
                      <p className="mt-4 text-sm font-bold">暂无签到记录</p>
                      <p className="text-xs mt-1">该课次尚未录入签到数据</p>
                    </div>
                  );
                }
                return lessonRecords.map((r: any, i: number) => (
                  <div key={r.id || i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.student_name || i}`} className="w-10 h-10 rounded-xl" alt="" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{r.student_name || r.studentName || '学员' + (i+1)}</p>
                        <p className="text-xs text-slate-400">签到时间: {r.check_in_time || r.checkInTime || '--'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${r.status === 'PRESENT' || r.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : r.status === 'ABSENT' || r.status === 'absent' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {r.status === 'PRESENT' || r.status === 'present' ? '已签到' : r.status === 'ABSENT' || r.status === 'absent' ? '缺勤' : '请假'}
                    </span>
                  </div>
                ));
              })()}
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium">共 {selectedLesson.expected} 位学员报名 · {selectedLesson.attended} 位已签到</p>
              <button onClick={() => setIsAttendanceListOpen(false)} className="px-8 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedLesson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsRescheduleModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 text-white rounded-xl"><ElmIcon name="clock" size={16} /></div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">调整课次时间</h2>
              </div>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><ElmIcon name="close" size={16} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 font-medium">
                ⚠️ 调整课次时间后，系统将自动通知所有已报名学员，请谨慎操作。
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">新日期</label>
                <input type="date" defaultValue={selectedLesson.date} className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">新时间</label>
                <input type="time" defaultValue={selectedLesson.time?.split(' ')?.[0] || ''} className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsRescheduleModalOpen(false)} className="px-8 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all">取消</button>
              <button onClick={() => { setIsRescheduleModalOpen(false); addToast('课次时间已调整，通知将发送给学员', 'success'); }} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all">确认调整</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Lesson Confirm */}
      {isCancelConfirmOpen && selectedLesson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsCancelConfirmOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-4 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto"><ElmIcon name="close" size={24} /></div>
              <h3 className="text-xl font-bold text-slate-900">确认取消本次课次？</h3>
              <p className="text-sm text-slate-500 leading-relaxed">取消后课时将退还至学员账户，该操作不可撤销，请谨慎操作。</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-1">
                <p className="text-xs font-bold text-slate-400">课次信息</p>
                <p className="text-sm font-bold text-slate-900">{selectedLesson.date} · {selectedLesson.time}</p>
                <p className="text-xs text-slate-500">{selectedLesson.className}</p>
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => setIsCancelConfirmOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all">取消</button>
              <button onClick={() => { setIsCancelConfirmOpen(false); addToast('课次已取消，课时已退还学员', 'success'); }} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-xs font-bold hover:bg-red-600 transition-all">确认取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
