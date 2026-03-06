
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Eye,
  ChevronRight,
  Home,
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowLeft,
  ChevronDown,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Users as UsersIcon,
  LineChart,
  PieChart,
  BarChart3,
  History,
  UserPlus,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { useStore } from '../store';

interface StudentManagementProps {
  onShowDetail?: (student: Student) => void;
}

/**
 * EduAdmin 全系统统一日期选择组件 - 深度修复版
 */
const EduDatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "年 / 月 / 日", className = "" }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    // 强制触发原生选择器
    if (inputRef.current && 'showPicker' in inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (e) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      className={`relative group h-[56px] w-full cursor-pointer ${className}`}
      onClick={handleContainerClick}
    >
      {/* 视觉模拟层：完全按照 UI 图渲染 */}
      <div className="absolute inset-0 flex items-center bg-slate-50/50 border border-slate-200 rounded-2xl px-5 transition-all group-focus-within:ring-4 group-focus-within:ring-blue-50 group-focus-within:border-blue-500 group-focus-within:bg-white shadow-sm pointer-events-none z-0">
        <CalendarIcon size={20} className="text-slate-400 mr-3 group-focus-within:text-blue-500 transition-colors" />
        <span className={`text-base font-bold ${value ? 'text-slate-900' : 'text-slate-300'}`}>
          {value || placeholder}
        </span>
      </div>

      {/* 交互层：透明的原生 input，通过 CSS 确保点击区域覆盖全场 */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="edu-date-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{ colorScheme: 'light' }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        /* 关键修复：让原生日期触发区域撑满整个容器 */
        .edu-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          cursor: pointer;
          opacity: 0;
        }
      `}} />
    </div>
  );
};

export const StudentManagement: React.FC<StudentManagementProps> = ({ onShowDetail }) => {
  const { students, currentUser, addStudent, updateStudent, deleteStudent } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>(isCampusAdmin ? myCampus : 'all');
  const [activeTab, setActiveTab] = useState<'all' | 'alert' | 'unpaid' | 'suspended'>('all');

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (isCampusAdmin) {
      setSelectedCampus(myCampus);
    }
  }, [isCampusAdmin, myCampus]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.phone.includes(searchTerm) || (student.className || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
      const matchesCampus = selectedCampus === 'all' || student.campus === selectedCampus;
      const matchesGender = filterGender === 'all' || student.gender === filterGender;

      let matchesTab = true;
      if (activeTab === 'alert') matchesTab = student.balanceLessons <= 5;
      else if (activeTab === 'unpaid') matchesTab = student.balanceAmount <= 0;
      else if (activeTab === 'suspended') matchesTab = student.status === 'inactive';

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && student.createdAt >= startDate;
      if (endDate) matchesDate = matchesDate && student.createdAt <= endDate;

      return matchesSearch && matchesStatus && matchesCampus && matchesGender && matchesDate && matchesTab;
    });
  }, [searchTerm, selectedStatus, selectedCampus, filterGender, startDate, endDate, students, activeTab]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCampus(isCampusAdmin ? myCampus : 'all');
    setFilterGender('all');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenForm = (student?: Student) => {
    if (student) {
      setEditingStudent({ ...student });
    } else {
      setEditingStudent({
        name: '',
        gender: 'female',
        phone: '',
        campus: isCampusAdmin ? myCampus : '总校区',
        status: 'active',
        birthday: '',
      });
    }
    setFormErrors({});
    setViewMode('form');
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!editingStudent?.name) errors.name = '姓名不能为空';
    if (!editingStudent?.phone) errors.phone = '手机号不能为空';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingStudent.id) {
      updateStudent({ ...editingStudent } as Student);
    } else {
      addStudent(editingStudent as any);
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setViewMode('list');
    }, 1200);
  };

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
    }
  };

  const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  const getStatusLabel = (status: StudentStatus) => {
    switch (status) {
      case 'active': return '在读';
      case 'inactive': return '停课';
      case 'graduated': return '结业';
      case 'dropped': return '流失';
      case 'potential': return '潜在';
      case 'trial': return '试听';
      default: return '未知';
    }
  };

  const getStatusStyle = (status: StudentStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'inactive': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'graduated': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'dropped': return 'bg-red-50 text-red-600 border-red-100';
      case 'potential': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'trial': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 animate-fade-in pb-32">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Home size={16} className="text-slate-500" />
          <a href="#" onClick={() => setViewMode('list')} className="hover:text-blue-600 transition-colors">首页</a>
          <ChevronRight size={14} />
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => setViewMode('list')}>学员管理</span>
          <ChevronRight size={14} />
          <span className="text-slate-600 font-medium">{editingStudent?.id ? '编辑学员' : '新增学员'}</span>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('list')} className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{editingStudent?.id ? '编辑学员档案' : '录入新学员'}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">档案编号：{editingStudent?.id || '待生成'}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-10 md:p-14 space-y-16">
            <section className="space-y-8">
              <div className="flex items-center gap-4 border-l-[4px] border-blue-600 pl-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">基本信息</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editingStudent?.name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className={`w-full bg-slate-50/50 border ${formErrors.name ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white'} rounded-2xl py-3.5 px-5 outline-none text-base font-bold text-black transition-all placeholder:text-slate-300 shadow-sm`}
                    placeholder="请输入真实姓名"
                  />
                  {formErrors.name && <p className="text-xs text-red-500 font-bold ml-2">{formErrors.name}</p>}
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">性别</label>
                  <div className="flex bg-slate-100/50 p-1.5 rounded-2xl h-[56px] shadow-sm">
                    <button
                      onClick={() => setEditingStudent({ ...editingStudent, gender: 'male' })}
                      className={`flex-1 rounded-xl text-sm font-bold transition-all ${editingStudent?.gender === 'male' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                    >男</button>
                    <button
                      onClick={() => setEditingStudent({ ...editingStudent, gender: 'female' })}
                      className={`flex-1 rounded-xl text-sm font-bold transition-all ${editingStudent?.gender === 'female' ? 'bg-white shadow text-pink-600' : 'text-slate-400'}`}
                    >女</button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">出生日期</label>
                  <EduDatePicker
                    value={editingStudent?.birthday || ''}
                    onChange={(val) => setEditingStudent(prev => ({ ...prev, birthday: val }))}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">联系电话 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={editingStudent?.phone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className={`w-full bg-slate-50/50 border ${formErrors.phone ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white'} rounded-2xl py-3.5 px-5 outline-none text-base font-bold text-black transition-all placeholder:text-slate-300 shadow-sm`}
                    placeholder="11位手机号码"
                  />
                  {formErrors.phone && <p className="text-xs text-red-500 font-bold ml-2">{formErrors.phone}</p>}
                </div>

                {!isCampusAdmin && (
                  <div className="col-span-1 md:col-span-2 space-y-2.5">
                    <label className="text-sm font-bold text-slate-600 ml-1">所属校区</label>
                    <div className="relative">
                      <select
                        value={editingStudent?.campus}
                        onChange={e => setEditingStudent({ ...editingStudent, campus: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 px-5 outline-none text-base font-bold text-black focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="总校区">总部旗舰校区</option>
                        <option value="浦东校区">浦东分校区</option>
                        <option value="静安校区">静安分校区</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">来源渠道</label>
                  <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 px-5 outline-none text-base font-bold text-black focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="如：地推咨询、老生介绍" />
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-600 ml-1">学业备注</label>
                  <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 px-5 outline-none text-base font-bold text-black focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="补充其他信息..." />
                </div>
              </div>
            </section>

            <section className="space-y-8 pb-10">
              <div className="flex items-center gap-4 border-l-[4px] border-emerald-500 pl-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">学员状态</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {['potential', 'trial', 'active', 'inactive', 'graduated', 'dropped'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setEditingStudent({ ...editingStudent, status: st as StudentStatus })}
                    className={`px-4 py-4 rounded-[1.25rem] border-2 text-[11px] font-bold uppercase tracking-widest transition-all ${editingStudent?.status === st
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {getStatusLabel(st as StudentStatus)}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-8 md:p-10 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-6">
            <button
              onClick={() => setViewMode('list')}
              className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all active:scale-95"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-14 py-4 bg-blue-600 text-white text-base font-bold rounded-[1.5rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] ring-4 ring-transparent hover:ring-blue-50"
            >
              保存档案信息
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingStudent(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">确定要删除该学员吗？</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">
                正在删除学员 <span className="text-black font-bold">{deletingStudent.name}</span> ({deletingStudent.id})。删除后该档案将永久从教务系统中移除。
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex items-center gap-3">
              <button onClick={() => setDeletingStudent(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200">取消</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95">确定删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={24} />
          <span className="font-bold text-base">学员数据已成功更新</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={16} className="text-slate-500" />
        <a href="#" className="hover:text-blue-600 transition-colors">首页</a>
        <ChevronRight size={14} />
        <span className="text-slate-600 font-medium">学员管理</span>
      </nav>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">学员档案与状态监控</h1>
          <p className="text-base text-slate-500 font-medium tracking-tight">实时管理校区学员课程余量、缴费状态及考勤活跃度</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>录入新学员</span>
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <FileSpreadsheet size={18} className="text-slate-400" />
            <span>批量导入</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 tracking-tight">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">在读学员</p>
              <h3 className="text-2xl font-black text-slate-900">1,284</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-amber-500/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">课时预警</p>
              <h3 className="text-2xl font-black text-slate-900">42</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-red-500/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500">
              <History size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">本月欠费</p>
              <h3 className="text-2xl font-black text-slate-900">15</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">本月新招</p>
              <h3 className="text-2xl font-black text-emerald-600">+86</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="搜索学员姓名、手机号、班级..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-black placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer shadow-sm min-w-[140px]"
              >
                <option value="all">全部分类</option>
                <option value="ui">UI/UX设计</option>
                <option value="python">Python开发</option>
                <option value="data">数据分析</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer shadow-sm min-w-[160px]"
              >
                <option value="all">剩余课时区间</option>
                <option value="0-5">0 - 5 课时</option>
                <option value="6-10">6 - 10 课时</option>
                <option value="10+">10 课时以上</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 border rounded-2xl text-sm font-bold transition-all active:scale-95 ${isFilterPanelOpen ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
            >
              <Filter size={18} className={isFilterPanelOpen ? 'text-blue-600' : 'text-slate-400'} />
              <span className="text-blue-600">高级筛选</span>
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
          {[
            { id: 'all', label: '全部学员', count: 1284 },
            { id: 'alert', label: '课时预警', count: 42 },
            { id: 'unpaid', label: '本月待缴', count: 15 },
            { id: 'suspended', label: '休学/停课', count: 8 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Advanced Filter Panel (Kept with updated styling) */}
        {isFilterPanelOpen && (
          <div className="pt-2 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="absolute -top-10 right-0">
                <button onClick={resetFilters} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> 重置条件
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">学员性别</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 h-14 shadow-sm">
                  <button onClick={() => setFilterGender('all')} className={`flex-1 rounded-xl text-sm font-bold transition-all ${filterGender === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>不限</button>
                  <button onClick={() => setFilterGender('male')} className={`flex-1 rounded-xl text-sm font-bold transition-all ${filterGender === 'male' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>男</button>
                  <button onClick={() => setFilterGender('female')} className={`flex-1 rounded-xl text-sm font-bold transition-all ${filterGender === 'female' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>女</button>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">开始日期</label>
                <EduDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="!h-14 !rounded-2xl"
                  placeholder="年 / 月 / 日"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">截止日期</label>
                <EduDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  className="!h-14 !rounded-2xl"
                  placeholder="年 / 月 / 日"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 w-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员姓名</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">联系电话</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">所属班级</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">剩余课时</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">缴费状态</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-12">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-8 py-5 text-center text-xs text-slate-300 font-bold">{idx + 1}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${student.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-black text-base leading-tight">{student.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{student.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 font-bold tracking-tight family-mono">{student.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100/50">
                      {student.className || '未分班'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-black ${student.balanceLessons <= 5 ? 'text-red-500' : 'text-slate-900'}`}>
                        {student.balanceLessons}
                      </span>
                      {student.balanceLessons <= 5 && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md animate-pulse">
                          (预警)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${student.balanceAmount > 0 ? 'bg-emerald-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${student.balanceAmount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {student.balanceAmount > 0 ? '正常' : '欠费'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right pr-10">
                    <div className="flex items-center justify-end gap-5">
                      <button onClick={() => onShowDetail?.(student)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90" title="详情">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleOpenForm(student)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-90" title="编辑">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => setDeletingStudent(student)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="删除">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-5 bg-slate-50 rounded-full">
                        <Search size={48} className="opacity-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-600">未找到相关学员档案</p>
                        <p className="text-xs font-medium">请尝试调整筛选条件或搜索关键词</p>
                      </div>
                      <button onClick={resetFilters} className="mt-2 text-blue-600 font-bold text-sm hover:underline">清空所有条件</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
        <p className="text-sm text-slate-400 font-bold tracking-tight">
          显示 1 到 10，共 <span className="text-slate-900 font-black">{filteredStudents.length.toLocaleString()}</span> 条数据
        </p>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          {[1, 2, 3, '...', 128].map((p, i) => (
            <button
              key={i}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${p === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
            >
              {p}
            </button>
          ))}
          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Statistics Section (Bottom Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">学员科目分布统计</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
            {/* Donut Chart Simulation with CSS */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#E2E8F0" strokeWidth="16" />
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#2563EB" strokeWidth="16" strokeDasharray="502" strokeDashoffset="211" />
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#60A5FA" strokeWidth="16" strokeDasharray="502" strokeDashoffset="351" />
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#22D3EE" strokeWidth="16" strokeDasharray="502" strokeDashoffset="426" />
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#CBD5E1" strokeWidth="16" strokeDasharray="502" strokeDashoffset="476" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">总计</p>
                <h4 className="text-2xl font-black text-slate-900">1,284</h4>
              </div>
            </div>

            <div className="space-y-4 min-w-[160px]">
              {[
                { label: '英语培训', color: 'bg-blue-600', percent: '42%' },
                { label: '数学思维', color: 'bg-blue-400', percent: '28%' },
                { label: '艺术特长', color: 'bg-cyan-400', percent: '15%' },
                { label: '其他类别', color: 'bg-slate-300', percent: '15%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">学员年龄分布统计</h3>
          </div>

          <div className="h-48 flex items-end justify-between px-4 pb-2 border-b border-slate-100 relative">
            {[45, 75, 95, 60, 30].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group flex-1">
                <div
                  className="w-12 bg-blue-500 rounded-t-xl group-hover:bg-blue-600 transition-all duration-500 relative cursor-pointer"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                    {Math.round(h * 12.8)} 人
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-4">
            {['4-6岁', '7-9岁', '10-12岁', '13-15岁', '16岁+'].map((label, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex-1 text-center">{label}</span>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
