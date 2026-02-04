
import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索学员、课程..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Branch Selector */}
        <button className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-600 transition-colors">
          <MapPin size={16} className="text-blue-500" />
          <span>总校区</span>
          <ChevronDown size={14} />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
            3
          </span>
        </button>

        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
};
