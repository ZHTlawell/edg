
import React from 'react';
import { ElmIcon } from './ElmIcon';

interface HeaderProps {
  onLogout?: () => void;
  onNavigate?: (id: string) => void;
  onToggleSidebar?: () => void;
  userRole?: string;
}

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
