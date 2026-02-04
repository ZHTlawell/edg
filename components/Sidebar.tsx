
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  CreditCard, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  School 
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  activeId: string;
  onNavigate: (id: string) => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={20} />, path: '/' },
  { 
    id: 'student-group', 
    label: '学员管理', 
    icon: <Users size={20} />, 
    path: '/students',
    children: [
      { id: 'students', label: '学员列表', icon: null, path: '/students/list' },
      { id: 'attendance-module', label: '考勤中心', icon: null, path: '/students/attendance' },
    ]
  },
  { id: 'courses', label: '课程管理', icon: <BookOpen size={20} />, path: '/courses' },
  { id: 'classes', label: '班级管理', icon: <Layers size={20} />, path: '/classes' },
  { id: 'payments', label: '报名缴费', icon: <CreditCard size={20} />, path: '/payments' },
  { id: 'teaching', label: '教学管理', icon: <GraduationCap size={20} />, path: '/teaching' },
  { id: 'stats', label: '统计分析', icon: <BarChart3 size={20} />, path: '/stats' },
];

const systemItems: NavItem[] = [
  { id: 'campus', label: '校区设置', icon: null, path: '/settings/campus' },
  { id: 'roles', label: '角色权限', icon: null, path: '/settings/roles' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeId, onNavigate }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(true);

  // Helper to check if current activeId is part of students group (including detail view)
  const isStudentActive = ['students', 'student-detail', 'attendance-module'].includes(activeId);

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col flex-shrink-0 z-20 h-screen overflow-hidden`}>
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-100">
          <School size={24} />
        </div>
        {isOpen && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-lg leading-tight tracking-tight">EduAdmin</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Portal</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => setIsStudentsOpen(!isStudentsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isStudentActive ? 'bg-blue-50/50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isStudentActive ? 'text-blue-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="font-semibold">{item.label}</span>}
                  </div>
                  {isOpen && (isStudentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </button>
                
                {isOpen && isStudentsOpen && (
                  <div className="ml-4 pl-5 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                          // If in student-detail, highlight 'students' list as the parent context
                          activeId === child.id || (activeId === 'student-detail' && child.id === 'students')
                            ? 'text-blue-600 bg-blue-50/50' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeId === item.id 
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={activeId === item.id ? 'text-blue-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* System Settings Group */}
        <div className="mt-4 pt-4 border-t border-slate-50">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-slate-400 group-hover:text-slate-600" />
              {isOpen && <span className="font-medium text-sm text-slate-500">系统配置</span>}
            </div>
            {isOpen && (isSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>
          
          {isOpen && isSettingsOpen && (
            <div className="ml-4 pl-5 border-l border-slate-100 space-y-1 mt-1">
              {systemItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                    activeId === item.id 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white cursor-pointer group">
          <div className="relative flex-shrink-0">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Profile" 
              className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">教务中心 · 王主管</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Head of Education</p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </aside>
  );
};
