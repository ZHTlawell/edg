/**
 * LeaveApproval.tsx
 * ---------------------------------------------------------------
 * 学员请假审批页（教师/教务）。
 * 列表展示待审批请假申请，点击「通过」或「驳回」并可填写备注。
 * 使用位置：教师端「请假审批」菜单。
 * ---------------------------------------------------------------
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ElmIcon } from './ElmIcon';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';

// 请假记录结构（含学员/课次关联信息）
interface LeaveRecord {
    id: string;
    student_id: string;
    lesson_id: string;
    reason: string;
    status: string;
    createdAt: string;
    reviewedAt?: string;
    review_note?: string;
    student?: { name: string; phone?: string };
    lesson?: {
        start_time: string;
        end_time: string;
        assignment?: { class?: { name: string }; course?: { name: string } };
    };
}

/**
 * LeaveApproval —— 请假审批主组件
 * 关键状态：pendingLeaves 待审批列表、loading 列表加载中、
 *           actionLoading 单行操作中（记录 id，按钮防重复点击）
 */
export const LeaveApproval: React.FC = () => {
    const { addToast } = useStore();
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/teaching/leave/pending');
            setPendingLeaves(res.data || []);
        } catch {
            setPendingLeaves([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleReview = async (leaveId: string, isApproved: boolean) => {
        setActionLoading(leaveId);
        try {
            await api.post('/api/teaching/leave/review', {
                leaveRequestId: leaveId,
                isApproved,
                reviewNote: isApproved ? '同意请假' : '不批准',
            });
            addToast(isApproved ? '已批准请假' : '已驳回请假', 'success');
            setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
        } catch (e: any) {
            addToast(e?.message || '操作失败', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">请假审批</h1>
                <p className="text-sm text-slate-500">查看并处理学员提交的请假申请</p>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" size={24} /> 加载中...</div>
            ) : pendingLeaves.length === 0 ? (
                <div className="py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-300 mb-3" />
                    <p className="text-sm font-bold text-slate-400">暂无待审批的请假申请</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-bold">{pendingLeaves.length} 条待审批</p>
                    {pendingLeaves.map(leave => {
                        const lessonTime = leave.lesson?.start_time
                            ? new Date(leave.lesson.start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—';
                        const className = leave.lesson?.assignment?.class?.name || '—';
                        const courseName = leave.lesson?.assignment?.course?.name || '—';
                        const isActioning = actionLoading === leave.id;

                        return (
                            <div key={leave.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-5">
                                {/* Student info */}
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {leave.student?.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-sm font-bold text-slate-800">{leave.student?.name || '未知学员'}</p>
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">待审批</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                                        <span className="flex items-center gap-1"><ElmIcon name="calendar" size={14} /> {lessonTime}</span>
                                        <span className="flex items-center gap-1"><ElmIcon name="reading" size={14} /> {courseName}</span>
                                        <span className="flex items-center gap-1"><ElmIcon name="user" size={14} /> {className}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                                        <span className="text-slate-400 font-bold">请假原因：</span>{leave.reason || '未填写'}
                                    </div>
                                    <p className="text-[10px] text-slate-300">申请时间：{new Date(leave.createdAt).toLocaleString('zh-CN')}</p>
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleReview(leave.id, true)}
                                        disabled={isActioning}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {isActioning ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 批准
                                    </button>
                                    <button
                                        onClick={() => handleReview(leave.id, false)}
                                        disabled={isActioning}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        <XCircle size={14} /> 驳回
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
