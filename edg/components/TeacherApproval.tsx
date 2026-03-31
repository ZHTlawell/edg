
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    User,
    Building2,
    Phone,
    Loader2
} from 'lucide-react';
import { useStore } from '../store';

interface TeacherApprovalProps {
    onBack: () => void;
}

interface PendingTeacher {
    id: string;
    username: string;
    campusName: string | null;
    campus_id: string | null;
    status: string;
    createdAt: string;
    teacherProfile?: { name: string } | null;
}

export const TeacherApproval: React.FC<TeacherApprovalProps> = ({ onBack }) => {
    const { fetchPendingUsers, approveUser, rejectUser } = useStore();
    const [pendingList, setPendingList] = useState<PendingTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await fetchPendingUsers('teachers');
        setPendingList(data);
        setLoading(false);
    }, [fetchPendingUsers]);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (id: string) => {
        setActionLoading(id + '-approve');
        try {
            await approveUser(id);
            setPendingList(prev => prev.filter(u => u.id !== id));
        } catch { }
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id + '-reject');
        try {
            await rejectUser(id);
            setPendingList(prev => prev.filter(u => u.id !== id));
        } catch { }
        setActionLoading(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">教师注册审核</h1>
                        <p className="text-sm text-slate-400 mt-0.5">审核教师自主注册申请，通过后教师方可登录系统</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
                >
                    <ElmIcon name="refresh" size={16} />
                    刷新
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: '待审核', value: pendingList.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: '今日已通过', value: 0, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: '今日已拒绝', value: 0, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                ].map((s, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${s.bg} ${s.border}`}>
                        <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <ElmIcon name="user" size={16} />
                    <h2 className="font-semibold text-slate-800">待审核申请列表</h2>
                    {pendingList.length > 0 && (
                        <span className="ml-auto bg-amber-100 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full">
                            {pendingList.length} 条
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="text-indigo-400 animate-spin" />
                    </div>
                ) : pendingList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <ElmIcon name="circle-check" size={16} />
                        <p className="font-semibold text-slate-500">暂无待审核的教师申请</p>
                        <p className="text-sm mt-1">所有申请均已处理完毕</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {pendingList.map(user => (
                            <div key={user.id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                                            <ElmIcon name="user" size={16} />
                                        </div>
                                        {/* Info */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">
                                                    {user.teacherProfile?.name || '—'}
                                                </span>
                                                <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                                    <ElmIcon name="clock" size={16} />
                                                    待审核
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={11} />
                                                    账号: {user.username}
                                                </span>
                                                {user.campusName && (
                                                    <span className="flex items-center gap-1">
                                                        <ElmIcon name="house" size={16} />
                                                        申请校区: {user.campusName}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-300">
                                                申请时间: {new Date(user.createdAt).toLocaleString('zh-CN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            disabled={!!actionLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === user.id + '-reject' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : <XCircle size={14} />}
                                            拒绝
                                        </button>
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            disabled={!!actionLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === user.id + '-approve' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : <ElmIcon name="circle-check" size={16} />}
                                            通过
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
