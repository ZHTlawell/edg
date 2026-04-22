
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
import { X, Save, Users, BookOpen, User as UserIcon, Calendar, Clock, AlertCircle, ChevronDown, Layers } from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';

interface ClassFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser, addToast, courses, teachers, fetchCourses, fetchTeachers } = useStore();
    
    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        capacity: 20,
        assignment: {
            course_id: '',
            teacher_id: '',
            schedule: {
                startDate: new Date().toISOString().split('T')[0],
                lessonsCount: 10,
                durationMinutes: 45,
                classroom: '待分配'
            }
        }
    });

    useEffect(() => {
        if (isOpen) {
            fetchCourses(currentUser?.campus_id);
            fetchTeachers(currentUser?.campus_id);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation for advanced mode
        if (showAdvanced) {
            if (!formData.assignment.course_id || !formData.assignment.teacher_id) {
                addToast('启用高级创建模式时，必须选择课程和导师', 'warning');
                return;
            }
        }

        try {
            const payload = {
                name: formData.name,
                capacity: formData.capacity,
                campus_id: currentUser?.campus_id,
                ...(showAdvanced ? { assignment: formData.assignment } : {})
            };

            await api.post('/api/academic/classes', payload);
            addToast(showAdvanced ? '班级创建及自动排课成功' : '班级主体创建成功', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.message || '创建失败', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg ring-4 ring-blue-50">
                            <ElmIcon name="user" size={16} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">开设新班级</h2>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">校区教务中心</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><ElmIcon name="close" size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            基础信息档案
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">班级名称 <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                    placeholder="例如：2024级UI设计进阶1班"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">班级容量 (上限人数)</label>
                                <div className="relative">
                                    <ElmIcon name="user" size={16} />
                                    <input
                                        type="number" required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">所属校区</label>
                                <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-500 flex items-center gap-2 opacity-60">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    {currentUser?.campus || '当前校区'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <div className="pt-4">
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl transition-all ${showAdvanced ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">一键配置教学与排课</p>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">启用后可直接指定课程、导师并自动生成课表</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={showAdvanced}
                                onChange={e => setShowAdvanced(e.target.checked)}
                            />
                            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showAdvanced ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${showAdvanced ? 'left-7' : 'left-1'}`}></div>
                            </div>
                        </label>
                    </div>

                    {/* Advanced Section */}
                    {showAdvanced && (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                教学任务与排课配置
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">选择课程 <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <ElmIcon name="reading" size={16} />
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                            value={formData.assignment.course_id}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                assignment: { ...formData.assignment, course_id: e.target.value }
                                            })}
                                        >
                                            <option value="">-- 请选择课程方案 --</option>
                                            {(courses || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ElmIcon name="arrow-down" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">指定导师 <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <ElmIcon name="user" size={16} />
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                            value={formData.assignment.teacher_id}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                assignment: { ...formData.assignment, teacher_id: e.target.value }
                                            })}
                                        >
                                            <option value="">-- 请选择主讲讲师 --</option>
                                            {(teachers || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <ElmIcon name="arrow-down" size={16} />
                                    </div>
                                </div>

                                {/* Scheduling Standards */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">首课日期</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                            value={formData.assignment.schedule.startDate}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                assignment: { 
                                                    ...formData.assignment, 
                                                    schedule: { ...formData.assignment.schedule, startDate: e.target.value } 
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">排课数量</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                            value={formData.assignment.schedule.lessonsCount}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                assignment: { 
                                                    ...formData.assignment, 
                                                    schedule: { ...formData.assignment.schedule, lessonsCount: parseInt(e.target.value) || 0 } 
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">时长 (分钟)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                            value={formData.assignment.schedule.durationMinutes}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                assignment: { 
                                                    ...formData.assignment, 
                                                    schedule: { ...formData.assignment.schedule, durationMinutes: parseInt(e.target.value) || 0 } 
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!showAdvanced && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl text-blue-600 text-[10px] font-bold border border-blue-100/50 leading-relaxed">
                            <ElmIcon name="warning" size={16} />
                            <span>当前为普通创建模式。班级创建后，您需要手动在详情页分配教学任务并点击“生成课表”。</span>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-[2] py-4 rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${showAdvanced ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}
                    >
                        <Save size={18} />
                        {showAdvanced ? '确认创建并排课' : '确认创建班级'}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
        </div>
    );
};
