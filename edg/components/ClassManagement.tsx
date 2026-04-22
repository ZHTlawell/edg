import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, Calendar, Download, Filter, ChevronRight, Home, ChevronDown, Users, Edit3, Archive, Clock, MapPin, BookOpen, User as UserIcon, RotateCcw, CheckCircle2, MoreHorizontal, Eye
} from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';
import { ClassFormModal } from './ClassFormModal';
import { CourseAssignmentModal } from './CourseAssignmentModal';

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '招生中', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ONGOING: { label: '开班中', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  COMPLETED: { label: '已结业', color: 'bg-slate-50 text-slate-500 border border-slate-200' },
  CANCELLED: { label: '已取消', color: 'bg-red-50 text-red-500 border border-red-200' },
};

export const ClassManagement: React.FC = () => {
  const { classes, currentUser, campuses, fetchCampuses, fetchClasses, students, addToast } = useStore();
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [selectedClassName, setSelectedClassName] = useState<string | undefined>();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState<string>('');
  const [enrollClassName, setEnrollClassName] = useState<string>('');
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [openingClassId, setOpeningClassId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampuses();
    fetchClasses(currentUser?.campus_id);
  }, [fetchCampuses, fetchClasses, currentUser?.campus_id]);

  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  const [filterCampus, setFilterCampus] = useState(isCampusAdmin ? (currentUser?.campus_id || 'all') : 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = useMemo(() => {
    return (classes || []).filter(c => {
      const matchesCampus = filterCampus === 'all' || (c as any).campus_id === filterCampus || c.campus === filterCampus;
      const matchesStatus = filterStatus === 'all' || c.status?.toLowerCase() === filterStatus.toLowerCase();
      const matchesSearch = searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCampus && matchesStatus && matchesSearch;
    });
  }, [classes, filterCampus, filterStatus, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">班级主体管理</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <ElmIcon name="plus" size={16} /> 创建班级主体
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <ElmIcon name="search" size={16} />
          <input
            type="text"
            placeholder="搜索班级名称..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {!isCampusAdmin && (
          <select
            value={filterCampus}
            onChange={e => setFilterCampus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">所有校区</option>
            {(campuses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">班级名称</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">所属校区</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">教学课程与导师</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">招生进度</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length > 0 ? filteredClasses.map((cls) => {
                const clsStatus = ((cls as any).status || 'ONGOING').toUpperCase();
                const statusCfg = statusConfig[clsStatus] || statusConfig['ONGOING'];
                const minStudents = (cls as any).min_students || 5;
                const isReadyToOpen = clsStatus === 'PENDING' && cls.enrolled >= minStudents;
                const shortage = Math.max(0, minStudents - cls.enrolled);
                const canOpen = currentUser?.role === 'campus_admin' || currentUser?.role === 'admin';
                return (
                <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${clsStatus === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        <ElmIcon name="user" size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">{cls.name}</span>
                        <div className="mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <ElmIcon name="location" size={16} />
                      {(campuses || []).find(cp => cp.id === (cls as any).campus_id)?.name || cls.campus || '总校区'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      {(cls as any).assignments?.length > 0 ? ((cls as any).assignments || []).map((a: any) => (
                        <div key={a.id} className="flex flex-col p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <ElmIcon name="reading" size={16} />
                            {a.course?.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-1">
                            <ElmIcon name="user" size={16} />
                            导师：{a.teacher?.name}
                          </div>
                        </div>
                      )) : (
                        <span className="text-xs text-slate-400 italic">暂未分配教学课程</span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSelectedClassName(cls.name);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 w-fit px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        <ElmIcon name="plus" size={16} /> 添加教学任务
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-700">{cls.enrolled} / {cls.capacity}</span>
                      {clsStatus === 'PENDING' && (
                        <div className="flex flex-col gap-1">
                          {/* 进度条 */}
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isReadyToOpen ? 'bg-emerald-400' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(100, Math.round(cls.enrolled / minStudents * 100))}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isReadyToOpen ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isReadyToOpen ? `已满足开班条件（${minStudents}人）` : `还差 ${shortage} 人可开班`}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* 开班按钮（PENDING 班 + 管理员角色） */}
                      {clsStatus === 'PENDING' && canOpen && (
                        <button
                          disabled={openingClassId === cls.id}
                          onClick={async () => {
                            const confirmed = isReadyToOpen || window.confirm(`当前仅 ${cls.enrolled} 人，未达到开班最低 ${minStudents} 人，是否强制开班？`);
                            if (!confirmed) return;
                            setOpeningClassId(cls.id);
                            try {
                              await api.post(`/api/academic/classes/${cls.id}/open`, { force: !isReadyToOpen });
                              addToast(`「${cls.name}」已开班！`, 'success');
                              fetchClasses(currentUser?.campus_id);
                            } catch (e: any) {
                              addToast(e?.response?.data?.message || '开班失败', 'error');
                            } finally {
                              setOpeningClassId(null);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 ${isReadyToOpen ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                        >
                          <CheckCircle2 size={13} /> {openingClassId === cls.id ? '开班中...' : '开班'}
                        </button>
                      )}
                      <button
                        onClick={() => { setEnrollClassId(cls.id); setEnrollClassName(cls.name); setIsEnrollModalOpen(true); }}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                        title="添加学员到班级"
                      >
                        <ElmIcon name="plus" size={14} /> 添加学员
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="查看课表"><ElmIcon name="calendar" size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors" title="编辑班级"><Edit3 size={18} /></button>
                    </div>
                  </td>
                </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">暂无班级数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSuccess={() => fetchClasses(currentUser?.campus_id)}
      />

      <CourseAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => fetchClasses(currentUser?.campus_id)}
        classId={selectedClassId}
        className={selectedClassName}
      />

      {/* 手动分班 Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsEnrollModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">添加学员到班级</h3>
                <p className="text-xs text-slate-400 mt-0.5">班级：{enrollClassName}</p>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><ElmIcon name="close" size={16} /></button>
            </div>
            <div className="p-4 border-b border-slate-50">
              <input
                type="text"
                placeholder="搜索学员姓名或手机号..."
                value={enrollSearch}
                onChange={e => setEnrollSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[400px]">
              {(students || []).filter(s => {
                if (!enrollSearch) return true;
                const kw = enrollSearch.toLowerCase();
                return s.name.toLowerCase().includes(kw) || s.phone.includes(kw);
              }).slice(0, 20).map(s => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.phone} · {s.className || '未分班'}</p>
                    </div>
                  </div>
                  <button
                    disabled={enrolling}
                    onClick={async () => {
                      setEnrolling(true);
                      try {
                        await api.post(`/api/academic/classes/${enrollClassId}/enroll`, { studentId: s.id });
                        addToast(`${s.name} 已加入 ${enrollClassName}`, 'success');
                        fetchClasses(currentUser?.campus_id);
                      } catch (e: any) {
                        addToast(e?.response?.data?.message || e?.message || '分班失败', 'error');
                      } finally {
                        setEnrolling(false);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    加入
                  </button>
                </div>
              ))}
              {(students || []).length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">暂无学员数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
