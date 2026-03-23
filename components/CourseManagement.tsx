
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Download,
  Filter,
  ChevronRight,
  Home,
  ChevronDown,
  MoreHorizontal,
  Eye,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';
import { Course, CourseStatus } from '../types';
import { CourseFormModal } from './CourseFormModal';
import { useStore } from '../store';
import api from '../utils/api';

export const CourseManagement: React.FC = () => {
  const { courses, currentUser, fetchCourses, addToast, setCourses, campuses, fetchCampuses, deleteCourse } = useStore();

  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  useEffect(() => {
    fetchCampuses();
    fetchCourses(isCampusAdmin ? currentUser?.campus_id : undefined);
  }, [fetchCampuses, fetchCourses, isCampusAdmin, currentUser?.campus_id]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampus, setFilterCampus] = useState(isCampusAdmin ? (currentUser?.campus_id || 'all') : 'all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  /* Removed useEffect that forced filterCampus, as backend already handles initial filtering */

  const filteredCourses = useMemo(() => {
    console.log('[CourseManagement] Filtering courses. Total counts:', courses.length);
    const result = (courses || []).filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.code && c.code.includes(searchTerm));
      const matchesType = filterType === 'all' || c.category === filterType;
      const matchesLevel = filterLevel === 'all' || c.level === filterLevel;
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

      const matchesCampus = filterCampus === 'all' ||
        (c as any).campus_id === filterCampus ||
        c.campus === filterCampus ||
        c.campus === '总校区' || // 总部标准课程
        !(c as any).campus_id;   // 没有明确校区ID的默认为标准课程

      return matchesSearch && matchesType && matchesLevel && matchesStatus && matchesCampus;
    });
    console.log('[CourseManagement] Filtered count:', result.length);
    return result;
  }, [searchTerm, filterType, filterLevel, filterStatus, filterCampus, courses]);

  const handleToggleStatus = (id: string) => {
    setCourses((courses || []).map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'enabled' ? 'disabled' : 'enabled' as CourseStatus };
      }
      return c;
    }));
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (window.confirm(`确认要删除课程《${name}》吗？此操作不可撤销。`)) {
      await deleteCourse(id);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCourses.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterLevel('all');
    setFilterStatus('all');
    setFilterCampus(isCampusAdmin ? (currentUser?.campus_id || 'all') : 'all');
  };

  const handleSave = async (course: Course) => {
    setIsModalOpen(false);

    // Save to server
    try {
      await api.post('/api/academic/courses', {
        name: course.name,
        category: course.category,
        price: parseFloat(course.price.toString().replace(/[^\d.-]/g, '')),
        total_lessons: course.totalLessons,
        instructor_id: (course as any).instructor_id,
        standard_id: (course as any).standard_id
      });
      addToast('课程发布成功', 'success');
      fetchCourses(isCampusAdmin ? currentUser?.campus_id : undefined);
    } catch (e: any) {
      addToast(e.message || '发布失败', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={16} className="text-slate-500" />
        <a href="#" className="hover:text-blue-600 transition-colors">首页</a>
        <ElmIcon name="arrow-right" size={16} />
        <span className="text-slate-600 font-medium">课程管理</span>
      </nav>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">课程管理</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <ElmIcon name="download" size={16} />
            导出数据
          </button>
          <button
            onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <ElmIcon name="plus" size={16} />
            新增课程
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Search Box */}
          <div className="xl:col-span-2 relative group">
            <ElmIcon name="search" size={16} />
            <input
              type="text"
              placeholder="搜索课程名称 / 课程编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
            />
          </div>

          {/* Type Select */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none appearance-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">所有课程类型</option>
              <option value="设计">设计类</option>
              <option value="编程">编程开发</option>
              <option value="数据">数据分析</option>
              <option value="艺术">艺术文化</option>
            </select>
            <ElmIcon name="arrow-down" size={16} />
          </div>

          {/* Level Select */}
          <div className="relative">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none appearance-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">所有课程级别</option>
              <option value="初级">初级课程</option>
              <option value="中级">中级课程</option>
              <option value="高级">高级研修</option>
            </select>
            <ElmIcon name="arrow-down" size={16} />
          </div>

          {/* Campus Select - Hidden for campus_admin */}
          {!isCampusAdmin && (
            <div className="relative">
              <select
                value={filterCampus}
                onChange={(e) => setFilterCampus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none appearance-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-600 cursor-pointer shadow-sm"
              >
                <option value="all">全量适用校区</option>
                {(campuses || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ElmIcon name="arrow-down" size={16} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">状态筛选:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >全部</button>
                <button
                  onClick={() => setFilterStatus('enabled')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterStatus === 'enabled' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >启用中</button>
                <button
                  onClick={() => setFilterStatus('disabled')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterStatus === 'disabled' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >已停用</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              <ElmIcon name="refresh" size={16} />
              重置
            </button>
            <button className="flex items-center gap-2 px-8 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95">
              查询
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">课程档案统计 ({filteredCourses.length})</p>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <div className="h-4 w-px bg-slate-300 mx-2"></div>
                <span className="text-sm font-bold text-blue-600 underline">已选中 {selectedIds.length} 项</span>
                <button className="text-xs font-bold text-slate-600 hover:text-blue-600 ml-2">批量启用</button>
                <button className="text-xs font-bold text-slate-600 hover:text-red-600 ml-2">批量删除</button>
              </div>
            )}
          </div>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <ElmIcon name="operation" size={16} />
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredCourses.length && filteredCourses.length > 0}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">课程编号</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">课程名称</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">类型/级别</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">价格策略/课时</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">适用校区</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">当前状态</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">更新时间</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course.id} className={`hover:bg-blue-50/10 transition-colors group ${selectedIds.includes(course.id) ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-6 py-5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(course.id)}
                        onChange={() => handleSelectOne(course.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-mono font-bold text-slate-400">{course.code}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                          {course.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight">{course.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{course.category}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.level}级别</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-600">{course.price}</span>
                        <span className="text-[10px] font-medium text-slate-400">{course.totalLessons} 课时总额</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                      {(campuses || []).find(cp => cp.id === (course as any).campus_id)?.name || course.campus || '全量适用'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {course.status === 'enabled' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <ElmIcon name="circle-check" size={16} /> 启用中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                            <XCircle size={12} /> 已停用
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 font-mono">
                      {course.updateTime}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">

                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all" title="查看详情">
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => { setEditingCourse(course); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                          title="编辑"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(course.id)}
                          className={`p-2 transition-all rounded-lg ${course.status === 'enabled' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={course.status === 'enabled' ? '停用' : '启用'}
                        >
                          <ElmIcon name="refresh" size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.name)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="删除课程"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 text-slate-300 hover:text-slate-900 transition-all">
                          <ElmIcon name="more-filled" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-32 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full">
                        <ElmIcon name="user" size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-700">未找到符合条件的课程档案</p>
                        <p className="text-sm font-medium">尝试更换关键词或重置筛选条件</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>显示 1 到 {filteredCourses.length} 条 / 共 {filteredCourses.length} 条数据</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <button className="px-3 py-1 bg-slate-100 rounded-md text-slate-800">10 条/页</button>
              <ElmIcon name="arrow-down" size={16} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-300 cursor-not-allowed">上一页</button>
            <div className="flex items-center">
              <button className="w-10 h-10 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100">1</button>
              <button className="w-10 h-10 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100">2</button>
              <button className="w-10 h-10 bg-transparent text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100">3</button>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">下一页</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CourseFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingCourse}
        />
      )}
    </div>
  );
};
