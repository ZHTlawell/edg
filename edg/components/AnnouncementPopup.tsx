
import React from 'react';
import { ElmIcon } from './ElmIcon';
import { Announcement } from '../types';

interface AnnouncementPopupProps {
    announcements: Announcement[];
    onClose: () => void;
}

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ announcements, onClose }) => {
    // Only show the latest (first) announcement
    const ann = announcements[0];
    if (!ann) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <ElmIcon name="notification" size={16} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">系统公告</p>
                            <p className="text-[11px] text-slate-400 font-medium">来自教学资源管理总部</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <ElmIcon name="close" size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-3 max-h-[50vh] overflow-y-auto">
                    <h3 className="text-base font-bold text-slate-800 leading-snug">{ann.title}</h3>

                    <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-300 font-medium">
                        {ann.publishTime && (
                            <span className="flex items-center gap-1">
                                <ElmIcon name="calendar" size={10} />
                                {new Date(ann.publishTime).toLocaleDateString('zh-CN')}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            {ann.scope === 'ALL' ? <ElmIcon name="location" size={10} /> : <ElmIcon name="house" size={10} />}
                            {ann.scope === 'ALL' ? '全校区' : '定向通知'}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <ElmIcon name="circle-check" size={16} />
                        我已知晓
                    </button>
                </div>
            </div>
        </div>
    );
};
