/**
 * ScheduleGenerationModal.tsx - 课表草稿生成弹窗
 *
 * 所在模块：课表管理 -> 生成课表
 * 功能：
 *   - 为指定教学任务（assignment）批量生成课次草稿
 *   - 支持自定义上课星期与时间，或使用默认模式
 * 使用方：ScheduleManagement 中的"生成课表"按钮触发
 */

import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

/**
 * 课表生成弹窗 Props
 * - isOpen: 是否显示
 * - onClose: 关闭回调
 * - assignmentId: 要生成课表的教学任务 ID（必需，否则无法提交）
 * - assignmentName: 任务名称，用于展示标题
 */
interface ScheduleGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId?: string;
    assignmentName?: string;
}

/**
 * ScheduleGenerationModal 组件
 * - 内部维护 formData：起始日期、课次数量、单课时长、是否自定义模式、上课日、时间
 * - 提交时调用 store.generateDraft
 */
export const ScheduleGenerationModal: React.FC<ScheduleGenerationModalProps> = ({
    isOpen, 
    onClose, 
    assignmentId,
    assignmentName 
}) => {
    const { generateDraft, addToast } = useStore();
    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        lessonsCount: 10,
        durationMinutes: 45,
        useCustomPattern: false,
        weekdays: [1] as number[],    // 默认周一
        timeOfDay: '09:00',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    /** 切换周几勾选状态（0-6 对应周日-周六） */
    const toggleWeekday = (day: number) => {
        setFormData(prev => ({
            ...prev,
            weekdays: prev.weekdays.includes(day)
                ? prev.weekdays.filter(d => d !== day)
                : [...prev.weekdays, day].sort()
        }));
    };

    /** 提交：校验后调用 generateDraft 生成课表草稿 */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentId) {
            addToast('未选中有效的教学任务', 'error');
            return;
        }
        if (formData.useCustomPattern && formData.weekdays.length === 0) {
            addToast('请至少选择一个上课日', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await generateDraft(
                assignmentId,
                formData.startDate,
                formData.lessonsCount,
                formData.durationMinutes,
                formData.useCustomPattern
                    ? { weekdays: formData.weekdays, timeOfDay: formData.timeOfDay }
                    : undefined
            );
            addToast('课表草稿生成成功', 'success');
            onClose();
        } catch (error: any) {
            addToast(error.message || '生成失败', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white/20">
                            <ElmIcon name="calendar" size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-bold text-slate-900">生成课表草稿</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">智能排课助手</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-200 text-slate-400 rounded-xl transition-all">
                        <ElmIcon name="close" size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Selected Assignment Info */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                            <ElmIcon name="reading" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">当前选择任务</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{assignmentName || '未命名任务'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">首课开始日期 <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <ElmIcon name="calendar" size={16} />
                                <input
                                    type="date" required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Lessons Count */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">生成课次数量</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">数量</span>
                                <input
                                    type="number" required min="1" max="50"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-16 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900"
                                    value={formData.lessonsCount}
                                    onChange={e => setFormData({ ...formData, lessonsCount: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">单节课时时长 (分钟)</label>
                            <div className="relative">
                                <ElmIcon name="clock" size={16} />
                                <input
                                    type="number" required step="5" min="5"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900"
                                    value={formData.durationMinutes}
                                    onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[10px]">分钟</span>
                            </div>
                        </div>
                    </div>

                    {/* 自定义排课模式 */}
                    <div className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.useCustomPattern}
                                onChange={e => setFormData({ ...formData, useCustomPattern: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">自定义上课日与时间</span>
                        </label>
                        {formData.useCustomPattern && (
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">上课日（可多选）</label>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {WEEKDAY_LABELS.map((label, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleWeekday(idx)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    formData.weekdays.includes(idx)
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">上课时间</label>
                                    <input
                                        type="time"
                                        value={formData.timeOfDay}
                                        onChange={e => setFormData({ ...formData, timeOfDay: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hint */}
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl text-amber-700 text-[10px] font-bold border border-amber-100/50 leading-relaxed">
                        <ElmIcon name="warning" size={16} />
                        <span>
                            {formData.useCustomPattern
                                ? `将按所选上课日（${formData.weekdays.map(d => WEEKDAY_LABELS[d]).join('/') || '未选'}）于 ${formData.timeOfDay} 生成课表。`
                                : '默认按"每周一次"频率生成草稿。勾选上方选项可自定义上课日与时间。'}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? '正在处理...' : '确认生成'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
