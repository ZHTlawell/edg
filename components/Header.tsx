
import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
  onNavigate?: (id: string) => void;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onNavigate, userRole }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索学员、课程、订单..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">


        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
            3
          </span>
        </button>

        <button
          onClick={() => onNavigate?.('help-center')}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
          title="帮助中心"
        >
          <HelpCircle size={20} />
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
};
