
import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Download, 
  Filter,
  ChevronRight,
  Home,
  ChevronDown,
  Users,
  Edit3,
  Archive,
  Clock,
  MapPin,
  BookOpen,
  User as UserIcon,
  RotateCcw,
  CheckCircle2,
  MoreHorizontal,
  // Added missing Eye icon import
  Eye
} from 'lucide-react';
import { Class, ClassStatus } from '../types';

/**
 * 通用日期选择组件 (复用逻辑)
 */
const EduDatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "选择日期", className = "" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleContainerClick = () => {
    if (inputRef.current && 'showPicker' in inputRef.current) {
      try { inputRef.current.showPicker(); } catch (e) { inputRef.current.focus(); }
    }
  };
  return (
    <div className={`relative group h-[46px] w-full cursor-pointer ${className}`} onClick={handleContainerClick}>
      <div className="absolute inset-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all group-focus-within:ring-4 group-focus-within:ring-blue-50 group-focus-within:border-blue-500 group-focus-within:bg-white pointer-events-none z-0">
        <Calendar size={16} className="text-slate-400 mr-2 group-focus-within:text-blue-500 transition-colors" />
        <span className={`text-sm font-bold ${value ? 'text-slate-900' : 'text-slate-300'}`}>{value || placeholder}</span>
      </div>
      <input 
        ref={inputRef}
        type="date" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
};

const INITIAL_CLASSES: Class[] = [
  { id: 'C-001', name: 'UI设计精英1班', campus: '总校区', courseName: '高级UI/UX设计实战', teacherName: '李建国', capacity: 30, enrolled: 28, schedule: '每周一、三 14:00-16:00', status: 'ongoing', createdAt: '2024-03-12' },
  { id: 'C-002', name: '前端开发周末班', campus: '浦东校区', courseName: '全栈开发：React', teacherName: '张教授', capacity: 25, enrolled: 12, schedule: '每周六 09:00-12:00', status: 'pending', createdAt: '2024-05-10' },
  { id: 'C-003', name: '数据分析研修班', campus: '静安校区', courseName: '商业数据分析', teacherName: '陈首席', capacity: 20, enrolled: 20, schedule: '每周二、四 18:30-20:30', status: 'ongoing', createdAt: '2024-02-15' },
  { id: 'C-004', name: 'Python基础春季班', campus: '总校区', courseName: 'Python自动化办公', teacherName: '刘老师', capacity: 30, enrolled: 30, schedule: '每周五 19:00-21:00', status: 'closed', createdAt: '2023-12-01' },
];

export const ClassManagement: React.FC = () => {
  const [classes] = useState<Class[]>(INITIAL_CLASSES);
  const [filterCampus, setFilterCampus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getStatusLabel = (status: ClassStatus) => {
    switch (status) {
      case 'ongoing': return { label: '进行中', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'pending': return { label: '未开班', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'closed': return { label: '已结班', style: 'bg-slate-50 text-slate-400 border-slate-100' };
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesCampus = filterCampus === 'all' || c.campus === filterCampus;
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesCampus && matchesStatus;
    });
  }, [classes, filterCampus, filterStatus]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={16} className="text-slate-500" />
        <a href="#" className="hover:text-blue-600 transition-colors">首页</a>
        <ChevronRight size={14} />
        <span className="text-slate-600 font-medium">班级管理</span>
      </nav>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">班级管理</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Download size={18} /> 导出
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-95">
            <Calendar size={18} /> 排课
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
            <Plus size={18} /> 创建班级
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">所属校区</label>
            <select 
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">全量校区</option>
              <option value="总校区">总部旗舰校</option>
              <option value="浦东校区">浦东分校</option>
              <option value="静安校区">静安分校</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-[34px] text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">关联课程</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">所有课程项目</option>
              <option value="UI">高级UI设计</option>
              <option value="React">React前端开发</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-[34px] text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">授课教师</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">所有讲师</option>
              <option value="李建国">李建国</option>
              <option value="张教授">张教授</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-[34px] text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">班级状态</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="pending">未开班</option>
              <option value="ongoing">进行中</option>
              <option value="closed">已结班</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-[34px] text-slate-400 pointer-events-none" />
          </div>

          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">上课时间范围</label>
            <div className="flex items-center gap-2">
              <EduDatePicker value={startDate} onChange={setStartDate} placeholder="开始日期" />
              <span className="text-slate-300">-</span>
              <EduDatePicker value={endDate} onChange={setEndDate} placeholder="截止日期" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
            <RotateCcw size={16} /> 重置
          </button>
          <button className="flex items-center gap-2 px-10 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95">
            <Search size={16} /> 查询
          </button>
        </div>
      </div>

      {/* Data Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">班级档案统计 ({filteredClasses.length})</p>
          <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Filter size={18} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">班级名称</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">所属校区</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">关联课程/教师</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">容量/已报名</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">上课安排</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">状态</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">创建时间</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">教务操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cls) => {
                const status = getStatusLabel(cls.status);
                const isFull = cls.enrolled >= cls.capacity;
                return (
                  <tr key={cls.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold border border-blue-100">
                          <Users size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 leading-tight">{cls.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold mt-1">{cls.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <MapPin size={14} className="text-slate-300" />
                        {cls.campus}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                          <BookOpen size={14} className="text-blue-400" />
                          {cls.courseName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <UserIcon size={12} className="text-slate-300" />
                          {cls.teacherName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-slate-800'}`}>
                            {cls.enrolled} / {cls.capacity}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-blue-500'}`} 
                              style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        {isFull && <span className="text-[9px] font-bold text-red-400 border border-red-100 px-1.5 py-0.5 rounded uppercase">满额</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <Clock size={14} className="text-slate-300" />
                        {cls.schedule}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-block min-w-[64px] ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 font-mono">
                      {cls.createdAt}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all" title="详情">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all" title="学员名单">
                          <Users size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all" title="编辑">
                          <Edit3 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all" title="排课">
                          <Calendar size={18} />
                        </button>
                        <div className="w-px h-4 bg-slate-100 mx-1"></div>
                        <button className="p-2 text-slate-300 hover:text-slate-900 rounded-lg transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>第 1 页 / 共 1 页</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <button className="px-3 py-1 bg-slate-100 rounded-md text-slate-800">10 条/页</button>
              <ChevronDown size={14} className="mx-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button disabled className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-300 cursor-not-allowed">上一页</button>
            <div className="flex items-center">
              <button className="w-10 h-10 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100">1</button>
            </div>
            <button disabled className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-300 cursor-not-allowed">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
};
