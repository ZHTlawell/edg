
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    Plus,
    FileText,
    Mail,
    Phone,
    MapPin,
    ChevronRight,
    Home,
    Filter,
    RefreshCw,
    User,
    CheckCircle2,
    XCircle,
    Building2,
    Calendar,
    ArrowLeft,
    Loader2,
    MoreHorizontal,
    Trash2,
    Edit3
} from 'lucide-react';
import { useStore } from '../store';
import { Teacher } from '../types';

interface TeacherRegistrationProps {
    onNavigate?: (view: string) => void;
}

export const TeacherRegistration: React.FC<TeacherRegistrationProps> = ({ onNavigate }) => {
    const { currentUser, teachers, fetchTeachers, setClassTeacherFilter, addToast } = useStore();
    const isCampusAdmin = currentUser?.role === 'campus_admin';
    const myCampus = currentUser?.campus || '总校区';

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        // 重要：校区主管必须传入 campus_id 以确保数据隔离
        const filterId = isCampusAdmin ? currentUser?.campus_id : undefined;
        await fetchTeachers(filterId);
        setLoading(false);
    }, [fetchTeachers, isCampusAdmin, currentUser]);

    useEffect(() => {
        load();
    }, [load]);

    const filteredTeachers = (teachers || []).filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.phone && t.phone.includes(searchTerm));
        const matchesDept = selectedDepartment === 'all' || t.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    const handleDelete = async (id: string) => {
        if (window.confirm('确定要移除该教师档案吗？此操作无法撤销。')) {
            addToast('功能开发中：教师档案移除', 'info');
        }
    };

    const handleViewClasses = (teacher: Teacher) => {
        // 1. 设置全局班级过滤器
        setClassTeacherFilter(teacher.name);
        // 2. 切换视图
        if (onNavigate) {
            onNavigate('classes');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-slate-400">
                <Home size={16} className="text-slate-500" />
                <a href="#" className="hover:text-cyan-600 transition-colors">首页</a>
                <ElmIcon name="arrow-right" size={16} />
                <span className="text-slate-600 font-medium">教务组织</span>
                <ElmIcon name="arrow-right" size={16} />
                <span className="text-slate-600 font-medium">教师档案</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">教师档案管理</h1>
                    <p className="text-sm text-slate-500">维护全校教师基本信息、任教科目及入职状态</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={load}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-100 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <ElmIcon name="refresh" size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: '在职总人数', value: teachers.length, icon: <ElmIcon name="user" size={16} />, bg: 'bg-cyan-50' },
                    { label: '本周新入职', value: 0, icon: <ElmIcon name="circle-check" size={16} />, bg: 'bg-emerald-50' },
                    { label: '核心教研员', value: (teachers || []).filter(t => t.department === '教研部').length, icon: <ElmIcon name="document" size={16} />, bg: 'bg-indigo-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className={`p-4 rounded-xl ${s.bg}`}>{s.icon}</div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <ElmIcon name="search" size={16} />
                    <input
                        type="text"
                        placeholder="搜索教师姓名或手机号..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-cyan-50 focus:border-cyan-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-cyan-50 min-w-[140px]"
                        value={selectedDepartment}
                        onChange={e => setSelectedDepartment(e.target.value)}
                    >
                        <option value="all">所有部门</option>
                        <option value="教研部">教研部</option>
                        <option value="教务部">教务部</option>
                        <option value="咨询部">咨询部</option>
                    </select>
                    <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        <ElmIcon name="operation" size={16} />
                        筛选
                    </button>
                </div>
            </div>

            {/* Teacher Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 italic text-slate-400 space-y-4">
                    <Loader2 size={40} className="animate-spin text-cyan-500" />
                    <p>正在努力调取档案信息...</p>
                </div>
            ) : filteredTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 text-slate-400 space-y-3">
                    <ElmIcon name="user" size={16} />
                    <p className="font-bold text-slate-600">暂无相关教师档案</p>
                    <p className="text-sm">尝试调整搜索词或切换部门分类</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map(teacher => (
                        <div key={teacher.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-cyan-100 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-center gap-4 relative">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 text-2xl font-black shrink-0 shadow-inner">
                                    {teacher.name.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors truncate">{teacher.name}</h3>
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">在职</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{teacher.department || '教务部'}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <Phone size={14} className="text-slate-300" />
                                    <span className="font-medium">{teacher.phone || '未备案'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <ElmIcon name="house" size={16} />
                                    <span className="font-medium truncate">{teacher.campus || (isCampusAdmin ? myCampus : '未分配')}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between relative">
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" title="编辑档案">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="移除档案">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleViewClasses(teacher)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:gap-2 transition-all"
                                >
                                    查看任教班级
                                    <ElmIcon name="arrow-right" size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
