/**
 * AnnouncementMgmt.tsx
 * ---------------------------------------------------------------
 * 公告管理页面（管理员端）。
 * 提供公告的搜索、新增、编辑、发布、撤回、删除能力。
 * 超管可选「全平台」或「指定校区」范围；校区管理员仅能对本校区发布。
 * 使用位置：后台管理侧边栏「公告管理」菜单。
 * ---------------------------------------------------------------
 */

import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Filter,
    ChevronDown,
    Megaphone,
    Clock,
    Send,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Eye,
    Globe,
    Building2,
    Calendar,
    MoreHorizontal
} from 'lucide-react';
import { useStore } from '../store';
import { Announcement, AnnouncementStatus } from '../types';

/**
 * AnnouncementMgmt —— 公告管理主组件
 * 无 props；从全局 store 读取 announcements / campuses / currentUser。
 * 关键交互：
 *  - 顶部搜索 + 状态过滤（草稿/已发布/已撤回）
 *  - 新增/编辑弹窗：标题、正文、范围、校区多选
 *  - 列表行操作：发布、撤回、编辑、删除
 */
export const AnnouncementMgmt: React.FC = () => {
    const { announcements, campuses, currentUser, fetchCampuses, fetchAnnouncementsAdmin, createAnnouncement, updateAnnouncement, publishAnnouncement, withdrawAnnouncement, deleteAnnouncement } = useStore();
    const isCampusAdmin = currentUser?.role === 'campus_admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    // Form state — campus admin always uses SPECIFIC scope with their campus
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        scope: (isCampusAdmin ? 'SPECIFIC' : 'ALL') as 'ALL' | 'SPECIFIC',
        campusIds: (isCampusAdmin && currentUser?.campus_id ? [currentUser.campus_id] : []) as string[]
    });

    useEffect(() => {
        fetchCampuses();
        fetchAnnouncementsAdmin();
    }, [fetchCampuses, fetchAnnouncementsAdmin]);

    const filteredAnnouncements = useMemo(() => {
        return (announcements || []).filter(a => {
            const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, filterStatus, announcements]);

    const handleOpenModal = (ann?: Announcement) => {
        if (ann) {
            setEditingAnnouncement(ann);
            setFormData({
                title: ann.title,
                content: ann.content,
                scope: ann.scope,
                campusIds: ann.targets?.map(t => t.campus_id) || []
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                scope: isCampusAdmin ? 'SPECIFIC' : 'ALL',
                campusIds: isCampusAdmin && currentUser?.campus_id ? [currentUser.campus_id] : []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const publishAfterSave = (e.nativeEvent as any).submitter?.publishAfterSave || false;
        try {
            let resId;
            if (editingAnnouncement) {
                await updateAnnouncement(editingAnnouncement.id, formData);
                resId = editingAnnouncement.id;
            } else {
                resId = await createAnnouncement(formData);
            }

            if (publishAfterSave && resId) {
                await publishAnnouncement(resId);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status: AnnouncementStatus) => {
        switch (status) {
            case 'DRAFT':
                return <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full border border-slate-200 flex items-center gap-1 w-fit"><ElmIcon name="clock" size={16} /> 草稿</span>;
            case 'PUBLISHED':
                return <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1 w-fit"><Send size={12} /> 已发布</span>;
            case 'WITHDRAWN':
                return <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1 w-fit"><ElmIcon name="refresh" size={16} /> 已撤回</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ElmIcon name="notification" size={16} />
                        系统公告管理
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">发布全平台或特定校区的系统公告、活动通知</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    <ElmIcon name="plus" size={16} />
                    新建公告
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                    <ElmIcon name="search" size={16} />
                    <input
                        type="text"
                        placeholder="搜索公告标题或内容..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <ElmIcon name="operation" size={16} />
                    <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">所有状态</option>
                        <option value="DRAFT">草稿</option>
                        <option value="PUBLISHED">已发布</option>
                        <option value="WITHDRAWN">已撤回</option>
                    </select>
                </div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnnouncements.map((ann) => (
                    <div key={ann.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group overflow-hidden flex flex-col">
                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                {getStatusBadge(ann.status)}
                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                                    {ann.scope === 'ALL' ? <ElmIcon name="location" size={16} /> : <ElmIcon name="house" size={16} />}
                                    {ann.scope === 'ALL' ? '全校区' : `指定 ${ann.targets?.length || 0} 个校区`}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                    {ann.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                                    {ann.content}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-slate-50 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <ElmIcon name="calendar" size={16} />
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                                {ann.publishTime && (
                                    <span className="flex items-center gap-1">
                                        <Send size={12} />
                                        {new Date(ann.publishTime).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(ann.status === 'DRAFT' || ann.status === 'WITHDRAWN') && (
                                    <button onClick={() => handleOpenModal(ann)} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-all" title="编辑">
                                        <Edit3 size={18} />
                                    </button>
                                )}
                                {ann.status === 'PUBLISHED' && (
                                    <button onClick={() => withdrawAnnouncement(ann.id)} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-amber-600 transition-all" title="撤回">
                                        <ElmIcon name="refresh" size={16} />
                                    </button>
                                )}
                                {(ann.status === 'DRAFT' || ann.status === 'WITHDRAWN') && (
                                    <button onClick={() => { if (window.confirm('确定删除该公告？此操作不可恢复。')) deleteAnnouncement(ann.id); }} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-red-600 transition-all" title="删除">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-all" title="详情预览">
                                    <Eye size={18} />
                                </button>
                            </div>

                            {(ann.status === 'DRAFT' || ann.status === 'WITHDRAWN') && (
                                <button
                                    onClick={() => publishAnnouncement(ann.id)}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                >
                                    <Send size={14} />
                                    {ann.status === 'WITHDRAWN' ? '重新发布' : '发布'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredAnnouncements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-slate-300">
                        <ElmIcon name="notification" size={16} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">暂无公告</h3>
                    <p className="text-slate-400 text-sm mt-1">开始创建您的第一条系统公告吧</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600">
                            <div className="text-white">
                                <h2 className="text-xl font-bold">{editingAnnouncement ? '编辑公告' : '新建公告'}</h2>
                                <p className="text-indigo-100 text-xs mt-1">填写详细内容并选择发布范围</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">公告标题</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="请输入富有吸引力的标题"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold text-slate-800"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">正文内容</label>
                                    <textarea
                                        required
                                        rows={6}
                                        placeholder="公告详细说明..."
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white transition-all text-sm font-medium text-slate-600"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>

                                {/* Scope selector - hidden for campus admin (auto-set to SPECIFIC) */}
                                {!isCampusAdmin && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">发布范围</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, scope: 'ALL' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${formData.scope === 'ALL' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                                >
                                                    <ElmIcon name="location" size={16} /> 全校区
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, scope: 'SPECIFIC' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${formData.scope === 'SPECIFIC' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                                                >
                                                    <ElmIcon name="house" size={16} /> 指定校区
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isCampusAdmin && (
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                                            <Building2 size={14} /> 公告将发布至本校区：{currentUser?.campus || '本校区'}
                                        </p>
                                    </div>
                                )}

                                {formData.scope === 'SPECIFIC' && !isCampusAdmin && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">受众校区 ({formData.campusIds.length})</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {(campuses || []).map((c) => (
                                                <label key={c.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.campusIds.includes(c.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-indigo-600 rounded"
                                                        checked={formData.campusIds.includes(c.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({ ...formData, campusIds: [...formData.campusIds, c.id] });
                                                            } else {
                                                                setFormData({ ...formData, campusIds: formData.campusIds.filter(id => id !== c.id) });
                                                            }
                                                        }}
                                                    />
                                                    <span className={`text-xs font-bold ${formData.campusIds.includes(c.id) ? 'text-indigo-600' : 'text-slate-500'}`}>{c.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {formData.campusIds.length === 0 && (
                                            <p className="text-[10px] text-amber-500 font-bold ml-1 flex items-center gap-1">
                                                <XCircle size={10} /> 请至少选择一个校区
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    onClick={(e) => {
                                        (e.currentTarget as any).publishAfterSave = false;
                                    }}
                                    disabled={formData.scope === 'SPECIFIC' && formData.campusIds.length === 0}
                                    className="flex-1 px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all border border-slate-200"
                                >
                                    保存草稿
                                </button>
                                <button
                                    type="submit"
                                    onClick={(e) => {
                                        (e.currentTarget as any).publishAfterSave = true;
                                    }}
                                    disabled={formData.scope === 'SPECIFIC' && formData.campusIds.length === 0}
                                    className="flex-[2] px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Send size={18} />
                                    直接发布
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
