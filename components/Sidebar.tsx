
import React, { useState, useMemo } from 'react';
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
  School,
  MonitorPlay,
  CalendarDays,
  ClipboardCheck,
  FileBadge,
  ShieldCheck,
  Wallet,
  MessageSquareText,
  Clock,
  Briefcase,
  ShoppingBag
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  activeId: string;
  onNavigate: (id: string) => void;
  userRole: string; // 'admin' | 'teacher' | 'student'
}

// Added MenuItem interface to fix property 'children' does not exist error
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeId, onNavigate, userRole }) => {
  const [openGroups, setOpenGroups] = useState<string[]>(['student-group', 'teaching-group']);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // --- Role Specific Menu Definitions ---

  // Explicitly typed as MenuItem[] to resolve property 'children' access issues
  const adminMenu: MenuItem[] = [
    { id: 'dashboard', label: '工作台概览', icon: <LayoutDashboard size={20} /> },
    {
      id: 'campus-group', label: '校区组织', icon: <School size={20} />, children: [
        { id: 'campus-list', label: '校区管理' },
        { id: 'admin-list', label: '人员分配' }
      ]
    },
    {
      id: 'student-group', label: '学员管理', icon: <Users size={20} />, children: [
        { id: 'students', label: '学员档案' },
        { id: 'attendance-module', label: '考勤中心' }
      ]
    },
    {
      id: 'course-group', label: '教研产品', icon: <BookOpen size={20} />, children: [
        { id: 'courses', label: '课程库' },
        { id: 'classes', label: '班级管理' }
      ]
    },
    { id: 'payments', label: '报名缴费', icon: <CreditCard size={20} /> },
    { id: 'teaching', label: '教学调度', icon: <GraduationCap size={20} /> },
    {
      id: 'stats-group', label: '统计报表', icon: <BarChart3 size={20} />, children: [
        { id: 'stats', label: '统计看板' },
        { id: 'report-details', label: '报表明细' }
      ]
    },
    {
      id: 'system-group', label: '系统设置', icon: <Settings size={20} />, children: [
        { id: 'roles', label: '权限配置' },
        { id: 'logs', label: '审计日志' }
      ]
    }
  ];

  const teacherMenu: MenuItem[] = [
    { id: 'teaching', label: '今日教学', icon: <LayoutDashboard size={20} /> },
    { id: 'schedule', label: '我的课表', icon: <CalendarDays size={20} /> },
    { id: 'classes', label: '班级学员', icon: <Users size={20} /> },
    { id: 'resources', label: '学习资源', icon: <BookOpen size={20} /> },
    { id: 'my-stats', label: '教学统计', icon: <BarChart3 size={20} /> }
  ];

  const studentMenu: MenuItem[] = [
    { id: 'student-dashboard', label: '学生首页', icon: <LayoutDashboard size={20} /> },
    { id: 'student-schedule', label: '我的课表', icon: <CalendarDays size={20} /> },
    { id: 'student-learning', label: '在线学习', icon: <MonitorPlay size={20} /> },
    { id: 'student-market', label: '精品市场', icon: <ShoppingBag size={20} /> },
    { id: 'student-orders', label: '订单与课时', icon: <Wallet size={20} /> },
    { id: 'student-notifications', label: '通知中心', icon: <MessageSquareText size={20} /> }
  ];

  const menuItems = useMemo(() => {
    if (userRole === 'admin') return adminMenu;
    if (userRole === 'campus_admin') {
      // For campus admin, remove 'campus-list' (校区管理) from 'campus-group'
      return adminMenu.map(item => {
        if (item.id === 'campus-group') {
          return {
            ...item,
            children: item.children?.filter(child => child.id !== 'campus-list')
          };
        }
        return item;
      });
    }
    return userRole === 'teacher' ? teacherMenu : studentMenu;
  }, [userRole]);
  const themeColor = userRole === 'admin' ? 'blue' : userRole === 'campus_admin' ? 'cyan' : (userRole === 'teacher' ? 'indigo' : 'emerald');
  const accentClasses = {
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  }[themeColor as 'blue' | 'cyan' | 'indigo' | 'emerald'];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col flex-shrink-0 z-20 h-screen overflow-hidden`}>
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className={`p-1.5 rounded-lg text-white shadow-lg ${userRole === 'admin' ? 'bg-blue-600 shadow-blue-100' : userRole === 'campus_admin' ? 'bg-cyan-600 shadow-cyan-100' : userRole === 'teacher' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
          <School size={24} />
        </div>
        {isOpen && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-lg leading-tight tracking-tight">EduAdmin</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-blue-500' : userRole === 'campus_admin' ? 'text-cyan-500' : userRole === 'teacher' ? 'text-indigo-500' : 'text-emerald-500'}`}>
              {userRole === 'admin' ? '总部管理端' : userRole === 'campus_admin' ? '教务分校端' : userRole === 'teacher' ? '教师办公端' : '学员服务中心'}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => item.children ? toggleGroup(item.id) : onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${activeId === item.id || (item.children && item.children.some(c => c.id === activeId)) ? accentClasses : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeId === item.id || (item.children && item.children.some(c => c.id === activeId)) ? '' : 'text-slate-400'}>{item.icon}</span>
                {isOpen && <span className="font-bold text-sm">{item.label}</span>}
              </div>
              {isOpen && item.children && (
                openGroups.includes(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </button>

            {isOpen && item.children && openGroups.includes(item.id) && (
              <div className="ml-4 pl-5 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onNavigate(child.id)}
                    className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-colors font-bold ${activeId === child.id ? `text-${themeColor}-600 bg-${themeColor}-50/50` : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white cursor-pointer group">
          <div className="relative flex-shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userRole === 'admin' ? 'Felix' : userRole === 'campus_admin' ? 'Aneka' : userRole === 'teacher' ? 'Milo' : 'Chloe'}`}
              alt="Profile"
              className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">
                {userRole === 'admin' ? '王主管' : userRole === 'campus_admin' ? '赵校长' : userRole === 'teacher' ? '李建国老师' : '张美玲 (学员)'}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase truncate tracking-wider">
                {userRole === 'admin' ? 'Head of Operations' : userRole === 'campus_admin' ? 'Campus Principal' : userRole === 'teacher' ? 'Lead Instructor' : 'Premium Student'}
              </p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </aside>
  );
};
