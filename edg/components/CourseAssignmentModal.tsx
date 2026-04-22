/**
 * CourseAssignmentModal.tsx
 * ---------------------------------------------------------------
 * 为已有班级分配课程 + 教师 + 排课的弹窗。
 * 相当于 ClassFormModal 的「补齐」版本，针对尚未绑定课程的班级。
 * 使用位置：ClassManagement 中对某班点击「分配课程」。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, User as UserIcon, Calendar, Clock, MapPin, Search } from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';

// props：isOpen/onClose/onSuccess 常规弹窗三件套；classId/className 定位目标班级
interface CourseAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classId?: string;
    className?: string;
}

/**
 * CourseAssignmentModal —— 班级课程分配弹窗
 * 表单：课程、教师、首课日期、课次数、每节时长
 * 提交后调用后端接口将课程绑定到班级并生成课次
 */
export const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({ isOpen, onClose, onSuccess, classId, className }) => {
    const { courses, teachers, fetchCourses, fetchTeachers, currentUser, addToast } = useStore();

    const [formData, setFormData] = useState({
        course_id: '',
        teacher_id: '',
        startDate: '',
        lessonsCount: 10,
        durationMinutes: 45
    });

    useEffect(() => {
        if (isOpen) {
            fetchCourses(currentUser?.campus_id);
            fetchTeachers(currentUser?.campus_id);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.course_id || !formData.teacher_id || !classId) {
            addToast('请确保选择了课程和导师', 'warning');
            return;
        }

        try {
            // 1. Assign Course
            const assignmentRes = await api.post('/api/academic/classes/assign-course', {
                class_id: classId,
                course_id: formData.course_id,
                teacher_id: formData.teacher_id
            });

            const assignmentId = assignmentRes.data.id;

            // 2. Generate Draft Schedules (if startDate provided)
            if (formData.startDate) {
                await api.post('/api/academic/classes/schedule-draft', {
                    assignmentId,
                    startDate: formData.startDate,
                    lessonsCount: formData.lessonsCount,
                    durationMinutes: formData.durationMinutes
                });
            }

            addToast('教学任务分配及预排课成功', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.message || '操作失败', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl"><ElmIcon name="reading" size={16} /></div>
                        <h2 className="text-xl font-bold text-slate-900">分配教学课程 - {className}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><ElmIcon name="close" size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">选择教学课程 <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-bold text-slate-900 appearance-none"
                                value={formData.course_id}
                                onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                            >
                                <option value="">-- 请选择课程方案 --</option>
                                {(courses || []).map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.totalLessons}课时)</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">指定教学导师 <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-bold text-slate-900 appearance-none"
                                value={formData.teacher_id}
                                onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                            >
                                <option value="">-- 请选择主讲讲师 --</option>
                                {(teachers || []).map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ElmIcon name="calendar" size={16} /> 定制排课标准 (选填)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">开课日期</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">生成课次</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                                        value={formData.lessonsCount}
                                        onChange={e => setFormData({ ...formData, lessonsCount: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">单课时长 (分)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                                        value={formData.durationMinutes}
                                        onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        确认分配及排课
                    </button>
                </form>
            </div>
        </div>
    );
};
