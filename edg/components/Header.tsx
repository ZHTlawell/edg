/**
 * Header.tsx
 * ---------------------------------------------------------------
 * 顶部导航栏（后台页面通用）。
 * 包含侧边栏折叠按钮、帮助中心入口、退出登录按钮。
 * 使用位置：App 根组件内的管理员/教师/学生布局。
 * ---------------------------------------------------------------
 */
import React from 'react';
import { ElmIcon } from './ElmIcon';

// props：
//   onLogout           退出登录回调（有值才渲染按钮）
//   onNavigate         路由跳转（用于帮助中心）
//   onToggleSidebar    切换侧边栏显隐（有值才渲染折叠按钮）
//   userRole           当前用户角色（目前仅保留扩展位）
interface HeaderProps {
  onLogout?: () => void;
  onNavigate?: (id: string) => void;
  onToggleSidebar?: () => void;
  userRole?: string;
}

/**
 * Header —— 顶部通用导航条
 * 纯展示组件，不含业务状态；所有动作由 props 回调向上抛出
 */
export const Header: React.FC<HeaderProps> = ({ onLogout, onNavigate, onToggleSidebar, userRole }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="切换侧边栏"
          >
            <ElmIcon name="expand" size={20} />
          </button>
        )}
      </div>

      <div className="flex-1"></div>

      <div className="flex items-center gap-4">


        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>


        <button
          onClick={() => onNavigate?.('help-center')}
          className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          帮助中心
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
          >
            退出登录
          </button>
        )}
      </div>
    </header>
  );
};
