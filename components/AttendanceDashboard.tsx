import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  Users,
  UserCheck,
  UserMinus,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  School,
  User as UserIcon
} from 'lucide-react';

interface AttendanceDashboardProps {
  onRegister: (lessonId: string) => void;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ onRegister }) => {
  const { attendanceRecords, classes, courses, students } = useStore();
  const [filterCampus, setFilterCampus] = useState('all');

  // Compute stats from real records
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    if (total === 0) return { rate: '0.0', present: 0, leave: 0, absent: 0 };
    const present = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const leave = attendanceRecords.filter(r => r.status === 'leave').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const rate = ((present / total) * 100).toFixed(1);
    return { rate, present, leave, absent };
  }, [attendanceRecords]);

  // Map raw records to grouped lesson summaries for the table
  const displayRecords = useMemo(() => {
    if (attendanceRecords.length === 0) return [];

    // Group by lesson_id
    const groups: Record<string, any> = {};
    attendanceRecords.forEach(r => {
      if (!groups[r.lesson_id]) {
        const cls = (classes || []).find(c => c.id === r.class_id);
        const course = (courses || []).find(c => c.id === r.course_id);
        groups[r.lesson_id] = {
          id: r.lesson_id,
          className: cls?.name || '未知班级',
          teacher: course?.instructor || '教师',
          date: r.createdAt.split('T')[0],
          time: '14:00 - 16:30', // Mock time for now or get from schedule
          expected: 1,
          present: 0,
          leave: 0,
          absent: 0,
          status: 'completed'
        };
      }
      groups[r.lesson_id].expected++;
      if (r.status === 'present' || r.status === 'late') groups[r.lesson_id].present++;
      else if (r.status === 'leave') groups[r.lesson_id].leave++;
      else if (r.status === 'absent') groups[r.lesson_id].absent++;
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, classes, courses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span>学员管理</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600">考勤中心</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">考勤中心看板</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <ElmIcon name="download" size={16} /> 导出分析
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
            <ElmIcon name="calendar" size={16} /> 快速考勤登记
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl"><UserCheck size={24} /></div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
              <ElmIcon name="trend-charts" size={16} /> +2.4%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">今日平均到课率</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tighter mt-1">94.2%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl"><ElmIcon name="clock" size={16} /></div>
            <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">月度累计</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">请假人次 (本月)</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tighter mt-1">128</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl"><UserMinus size={24} /></div>
            <span className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
              异常需跟进
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">缺勤人次 (本月)</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tighter mt-1">14</h3>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2.5 bg-white/10 rounded-2xl text-blue-400"><School size={24} /></div>
            <span className="text-[10px] font-bold opacity-60 tracking-widest uppercase">全校档案</span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">累计考勤人次</p>
            <h3 className="text-2xl font-bold font-mono tracking-tighter mt-1">42,850+</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Records Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-6">
                <h4 className="font-bold text-slate-800">近期排课考勤流</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-500 font-bold">今日</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <ElmIcon name="search" size={16} />
                  <input type="text" placeholder="搜索班级或教师..." className="bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs font-medium outline-none focus:border-blue-500 transition-all w-48 shadow-inner" />
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ElmIcon name="operation" size={16} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/10 border-b border-slate-50">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">课次时间</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">班级与讲师</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">到课实况</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">状态/操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-blue-50/5 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{rec.date.split('-')[1]}月</p>
                            <p className="text-lg font-bold text-slate-900 font-mono leading-none">{rec.date.split('-')[2]}</p>
                          </div>
                          <div className="w-px h-6 bg-slate-100"></div>
                          <p className="text-xs font-bold text-slate-500">{rec.time.split(' - ')[0]}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner group-hover:text-blue-600 transition-colors">
                            <ElmIcon name="user" size={16} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{rec.className}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              <span className="opacity-60">授课讲师:</span>
                              <span className="text-slate-600">{rec.teacher}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">到:{rec.present}</span>
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">假:{rec.leave}</span>
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">缺:{rec.absent}</span>
                          </div>
                          <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(rec.present / rec.expected) * 100}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {rec.status === 'completed' ? (
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">已完成登记</span>
                            <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><ElmIcon name="more-filled" size={16} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onRegister(rec.id)}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-blue-100 active:scale-95"
                          >
                            开始考勤登记 <ElmIcon name="top-right" size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-slate-50/20 border-t border-slate-50 flex items-center justify-center">
                <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">加载更多考勤档案...</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Analysis & Reminders */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ElmIcon name="warning" size={16} /> 缺勤异常预警
            </h4>
            <div className="space-y-4">
              {[
                { name: '赵小龙', class: '高级UI精品1班', status: '连续缺勤2次', time: '1小时前' },
                { name: '王大卫', class: '前端架构班', status: '今日未打卡', time: '3小时前' },
              ].map((alert, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-400 shadow-sm">{alert.name.charAt(0)}</div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-800">{alert.name}</p>
                      <span className="text-[9px] font-bold text-red-500 uppercase">{alert.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{alert.class}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-bold transition-all border border-slate-100">
              处理全部预警通知
            </button>
          </div>

          <div className="bg-blue-600 rounded-[2rem] p-8 text-white space-y-6 shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest">本周到课趋势</h4>
              <div className="flex items-end gap-2 h-24 pt-4">
                {[40, 65, 80, 50, 90, 85, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-white/20 rounded-t-lg relative group transition-all hover:bg-white/40 cursor-help" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-bold opacity-40 uppercase pt-2">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
