import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, Calendar, Download, Filter, ChevronRight, Home, ChevronDown, Users, Edit3, Archive, Clock, MapPin, BookOpen, User as UserIcon, RotateCcw, CheckCircle2, MoreHorizontal, Eye
} from 'lucide-react';
import { useStore } from '../store';
import { ClassFormModal } from './ClassFormModal';
import { CourseAssignmentModal } from './CourseAssignmentModal';

export const ClassManagement: React.FC = () => {
  const { classes, currentUser, campuses, fetchCampuses, fetchClasses } = useStore();
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [selectedClassName, setSelectedClassName] = useState<string | undefined>();

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
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">容量/已报</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                        <ElmIcon name="user" size={16} />
                      </div>
                      <span className="font-bold text-slate-800">{cls.name}</span>
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
                    <span className="text-sm font-bold text-slate-700">{cls.enrolled} / {cls.capacity}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="查看课表"><ElmIcon name="calendar" size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors" title="编辑班级"><Edit3 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
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
    </div>
  );
};
