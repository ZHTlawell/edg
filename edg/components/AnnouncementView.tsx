/**
 * AnnouncementView.tsx
 * ---------------------------------------------------------------
 * 公告查看页（普通用户视角）。
 * 左侧为公告分组（全部 / 总部 / 校区），右侧展示选中公告正文。
 * 使用位置：侧边栏「系统通知」入口，面向校区管理员/教师/学生等。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useEffect, useState } from 'react';
import { Megaphone, Calendar, Send, ChevronRight, Inbox, Eye, Clock } from 'lucide-react';
import { useStore } from '../store';
import { Announcement } from '../types';

/**
 * AnnouncementView —— 公告查看主组件
 * 无 props；加载时自动拉取「当前活跃」公告列表。
 * 关键状态：selectedAnn 选中详情、activeGroup 分组筛选
 */
export const AnnouncementView: React.FC = () => {
    const { announcements, fetchAnnouncementsActive } = useStore();
    const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
    const [activeGroup, setActiveGroup] = useState<'all' | 'hq' | 'campus'>('all');

    useEffect(() => {
        fetchAnnouncementsActive();
    }, [fetchAnnouncementsActive]);

    const hqAnnouncements = announcements.filter(a => a.scope === 'ALL');
    const campusAnnouncements = announcements.filter(a => a.scope === 'SPECIFIC');
    const filteredAnnouncements = activeGroup === 'all' ? announcements : activeGroup === 'hq' ? hqAnnouncements : campusAnnouncements;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ElmIcon name="notification" size={16} />
                        系统通知与公告
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">查看总部发布的最新政策、通告及活动动态</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* List side */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Inbox size={14} /> 公告列表
                            </span>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                {([
                                    { id: 'all', label: '全部', count: announcements.length },
                                    { id: 'hq', label: '总部', count: hqAnnouncements.length },
                                    { id: 'campus', label: '校区', count: campusAnnouncements.length },
                                ] as const).map(tab => (
                                    <button key={tab.id} onClick={() => setActiveGroup(tab.id)}
                                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeGroup === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto divide-y divide-slate-50 flex-1 custom-scrollbar">
                            {filteredAnnouncements.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                    <ElmIcon name="clock" size={16} />
                                    <p className="text-xs text-slate-400 font-medium whitespace-nowrap">暂无公告</p>
                                </div>
                            ) : (
                                filteredAnnouncements.map((ann) => (
                                    <div
                                        key={ann.id}
                                        onClick={() => setSelectedAnn(ann)}
                                        className={`p-5 cursor-pointer transition-all hover:bg-emerald-50/30 group relative ${selectedAnn?.id === ann.id ? 'bg-emerald-50/50' : ''}`}
                                    >
                                        {selectedAnn?.id === ann.id && (
                                            <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ann.scope === 'ALL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {ann.scope === 'ALL' ? '总部' : '校区'}
                                                </span>
                                                <h4 className={`text-sm font-bold truncate transition-colors flex-1 ${selectedAnn?.id === ann.id ? 'text-emerald-700' : 'text-slate-700 group-hover:text-emerald-600'}`}>
                                                    {ann.title}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                                                {ann.content}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                                                <span className="flex items-center gap-1 uppercase tracking-tight">
                                                    <ElmIcon name="clock" size={16} />
                                                    {ann.publishTime ? new Date(ann.publishTime).toLocaleDateString() : '未发布'}
                                                </span>
                                                <ElmIcon name="arrow-right" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Detail side */}
                <div className="md:col-span-2">
                    {selectedAnn ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col min-h-[500px] animate-in slide-in-from-right-4 duration-500">
                            <div className="p-8 border-b border-slate-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-12 translate-x-12 opacity-50 blur-2xl" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-widest ${selectedAnn.scope === 'ALL' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                            {selectedAnn.scope === 'ALL' ? '总部公告' : '校区公告'}
                                        </span>
                                        <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                                            <ElmIcon name="calendar" size={16} />
                                            {selectedAnn.publishTime ? new Date(selectedAnn.publishTime).toLocaleString('zh-CN') : '—'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">
                                        {selectedAnn.title}
                                    </h2>
                                </div>
                            </div>
                            <div className="p-10 flex-1">
                                <div className="text-slate-600 text-lg leading-relaxed space-y-6 whitespace-pre-wrap font-medium font-serif">
                                    {selectedAnn.content}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 h-full flex flex-col items-center justify-center p-12 text-slate-300">
                            <Eye size={48} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-slate-400">请选择公告查看详情</h3>
                            <p className="text-xs mt-2 font-medium">点击左侧列表中的公告标题以展开完整内容</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
