
import React, { useState, useMemo } from 'react';
import { ElmIcon } from './ElmIcon';
import { School } from 'lucide-react';
import { useStore } from '../store';

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
  const { currentUser } = useStore();
  const [openGroups, setOpenGroups] = useState<string[]>(['student-group', 'teaching-group']);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // --- Role Specific Menu Definitions ---

  // Explicitly typed as MenuItem[] to resolve property 'children' access issues
  const adminMenu: MenuItem[] = [
    { id: 'dashboard', label: '工作台概览', icon: <ElmIcon name="odometer" size={20} /> },
    {
      id: 'campus-group', label: '校区组织', icon: <ElmIcon name="school" size={20} />, children: [
        { id: 'campus-list', label: '校区管理' }
      ]
    },
    {
      id: 'student-group', label: '学员管理', icon: <ElmIcon name="user" size={20} />, children: [
        { id: 'students', label: '学员档案' },
        { id: 'attendance-module', label: '考勤中心' }
      ]
    },
    {
      id: 'course-group', label: '教研产品', icon: <ElmIcon name="reading" size={20} />, children: [
        { id: 'courses', label: '课程库' },
        { id: 'classes', label: '班级管理' }
      ]
    },
    {
      id: 'finance-group', label: '财务中心', icon: <ElmIcon name="credit-card" size={20} />, children: [
        { id: 'payments', label: '报名缴费' },
        { id: 'refund-management', label: '退费管理' }
      ]
    },
    { id: 'teaching', label: '教学调度', icon: <ElmIcon name="reading-lamp" size={20} /> },
    {
      id: 'stats-group', label: '统计报表', icon: <ElmIcon name="histogram" size={20} />, children: [
        { id: 'stats', label: '统计看板' },
        { id: 'report-details', label: '报表明细' }
      ]
    },
    {
      id: 'system-group', label: '系统设置', icon: <ElmIcon name="setting" size={20} />, children: [
        { id: 'roles', label: '权限配置' },
        { id: 'logs', label: '审计日志' },
        { id: 'announcemnt-mgmt', label: '公告管理' }
      ]
    },
    { id: 'course-standard', label: '课程中心', icon: <ElmIcon name="collection" size={20} /> },
  ];

  const campusMenu: MenuItem[] = [
    {
      id: 'campus-group', label: '教务组织', icon: <ElmIcon name="school" size={20} />, children: [
        { id: 'teacher-registration', label: '教师档案' },
        { id: 'teacher-approval', label: '教师注册审核' }
      ]
    },
    {
      id: 'student-group', label: '学员管理', icon: <ElmIcon name="user" size={20} />, children: [
        { id: 'students', label: '学员档案' }
      ]
    },
    {
      id: 'course-group', label: '课程与班级管理', icon: <ElmIcon name="reading" size={20} />, children: [
        { id: 'courses', label: '课程库' },
        { id: 'classes', label: '班级管理' },
        { id: 'course-resource', label: '课程内容管理' }
      ]
    },
    { id: 'teaching', label: '教务排课', icon: <ElmIcon name="calendar" size={20} /> },
    { id: 'attendance-module', label: '考勤', icon: <ElmIcon name="finished" size={20} /> },
    {
      id: 'admission-group', label: '招生缴费', icon: <ElmIcon name="credit-card" size={20} />, children: [
        { id: 'payments', label: '报名缴费' },
        { id: 'refund-management', label: '退费管理' }
      ]
    },
    {
      id: 'stats-group', label: '统计报表', icon: <ElmIcon name="histogram" size={20} />, children: [
        { id: 'stats', label: '统计看板' },
        { id: 'report-details', label: '报表明细' },
        { id: 'finance-report', label: '财务报表' }
      ]
    },
    { id: 'announcement-view', label: '系统公告', icon: <ElmIcon name="notification" size={20} /> }
  ];

  const teacherMenu: MenuItem[] = [
    { id: 'teaching', label: '今日教学', icon: <ElmIcon name="odometer" size={20} /> },
    { id: 'schedule', label: '我的课表', icon: <ElmIcon name="calendar" size={20} /> },
    { id: 'classes', label: '班级学员', icon: <ElmIcon name="user" size={20} /> },
    { id: 'teacher-homework', label: '作业分发', icon: <ElmIcon name="finished" size={20} /> },
    { id: 'resources', label: '学习资源', icon: <ElmIcon name="reading" size={20} /> },
    { id: 'my-stats', label: '教学统计', icon: <ElmIcon name="histogram" size={20} /> }
  ];

  const studentMenu: MenuItem[] = [
    { id: 'student-dashboard', label: '学生首页', icon: <ElmIcon name="odometer" size={20} /> },
    { id: 'student-schedule', label: '我的课表', icon: <ElmIcon name="calendar" size={20} /> },
    { id: 'student-learning', label: '在线学习', icon: <ElmIcon name="video-play" size={20} /> },
    { id: 'student-homework', label: '我的作业', icon: <ElmIcon name="finished" size={20} /> },
    { id: 'student-market', label: '精品市场', icon: <ElmIcon name="shopping-bag" size={20} /> },
    { id: 'student-orders', label: '订单与课时', icon: <ElmIcon name="wallet" size={20} /> },
    { id: 'student-notifications', label: '通知中心', icon: <ElmIcon name="comment" size={20} /> }
  ];

  const menuItems = useMemo(() => {
    if (userRole === 'admin') return adminMenu;
    if (userRole === 'campus_admin') return campusMenu;
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
                openGroups.includes(item.id) ? <ElmIcon name="arrow-down" size={14} /> : <ElmIcon name="arrow-right" size={14} />
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
                {currentUser?.name || currentUser?.username || (userRole === 'admin' ? '管理员' : userRole === 'campus_admin' ? '校区管理员' : userRole === 'teacher' ? '授课老师' : '学员')}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase truncate tracking-wider">
                {userRole === 'admin' ? '总部管理' : userRole === 'campus_admin' ? '校区教务' : userRole === 'teacher' ? '授课教师' : '在读学员'}
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
