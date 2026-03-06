import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PlusCircle, Search, Calendar, FileText, CheckCircle2, Clock, Users, UploadCloud, X } from 'lucide-react';

export const TeacherHomeworkMgmt: React.FC = () => {
    const { currentUser, homeworks, homeworkSubmissions, classes, publishHomework, students, addToast } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [newHomework, setNewHomework] = useState<{ title: string; content: string; classId: string; deadline: string; attachment: File | null }>({ title: '', content: '', classId: '', deadline: '', attachment: null });
    const fileRef = React.useRef<HTMLInputElement>(null);

    const myClasses = useMemo(() => {
        // In a real app, match by teacher ID. For demo, match by instructor name or just show all for simplicity,
        // but let's filter classes where teacherName includes '李' or just show all active classes if few.
        return (classes || []).filter(c => c.status === 'ongoing');
    }, [classes]);

    const myHomeworks = useMemo(() => {
        return (homeworks || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [homeworks]);

    const handlePublish = async () => {
        if (!newHomework.title || !newHomework.classId || !newHomework.deadline) {
            addToast?.('请填写完整信息', 'warning');
            return;
        }

        try {
            await publishHomework({
                title: newHomework.title,
                content: newHomework.content,
                class_id: newHomework.classId,
                teacher_id: currentUser?.id || '',
                deadline: newHomework.deadline,
                attachmentName: newHomework.attachment ? newHomework.attachment.name : undefined,
                attachmentUrl: newHomework.attachment ? '/mock-files/' + newHomework.attachment.name : undefined,
            });
            setShowModal(false);
            setNewHomework({ title: '', content: '', classId: '', deadline: '', attachment: null });
        } catch (error) {
            // Error is handled by addToast in store
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">作业分发与批改</h1>
                    <p className="text-sm text-slate-500 font-medium">布置课后作业并跟踪学员完成进度，支持在线评分与反馈。</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <PlusCircle size={18} /> 发布新作业
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="搜索作业标题..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400">
                                <th className="p-4 font-bold">作业标题 / 内容</th>
                                <th className="p-4 font-bold">关联班级</th>
                                <th className="p-4 font-bold">截止时间</th>
                                <th className="p-4 font-bold">提交状态</th>
                                <th className="p-4 font-bold text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myHomeworks.map((hw, idx) => {
                                const targetClass = (classes || []).find(c => c.id === hw.class_id);
                                const submissions = (homeworkSubmissions || []).filter(sub => sub.homework_id === hw.id);
                                const gradedCount = submissions.filter(sub => sub.status === 'graded').length;
                                return (
                                    <tr key={hw.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{hw.title}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{hw.content}</p>
                                                    {hw.attachmentName && (
                                                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-md font-medium">
                                                            <FileText size={12} /> {hw.attachmentName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                <Users size={12} /> {targetClass?.name || '未知班级'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock size={14} /> {hw.deadline}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                    <span className="text-emerald-600">{submissions.length} 已交</span>
                                                    <span className="text-slate-300">/</span>
                                                    <span className="text-indigo-600">{gradedCount} 已批</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: Math.min(100, (submissions.length / (targetClass?.enrolled || 1)) * 100) + '%' }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                                去批改
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {myHomeworks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                                        暂无已发布的作业，点击右上角发布新作业
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Publish Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">发布新作业</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">作业标题 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={newHomework.title}
                                        onChange={e => setNewHomework({ ...newHomework, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="例如：第一阶段组件实战"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">关联班级 <span className="text-red-500">*</span></label>
                                    <select
                                        value={newHomework.classId}
                                        onChange={e => setNewHomework({ ...newHomework, classId: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                    >
                                        <option value="">请选择要分发的班级...</option>
                                        {myClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.courseName})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">作业内容要求</label>
                                    <textarea
                                        value={newHomework.content}
                                        onChange={e => setNewHomework({ ...newHomework, content: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="输入作业详细描述与要求..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">截止提交时间 <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={newHomework.deadline}
                                        onChange={e => setNewHomework({ ...newHomework, deadline: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">作业附件 (选填)</label>
                                    <input
                                        type="file"
                                        ref={fileRef}
                                        className="hidden"
                                        onChange={e => {
                                            if (e.target.files && e.target.files[0]) {
                                                setNewHomework({ ...newHomework, attachment: e.target.files[0] });
                                            }
                                        }}
                                    />
                                    {newHomework.attachment ? (
                                        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{newHomework.attachment.name}</p>
                                                    <p className="text-[10px] text-slate-400">{(newHomework.attachment.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setNewHomework({ ...newHomework, attachment: null });
                                                    if (fileRef.current) fileRef.current.value = '';
                                                }}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-all group"
                                        >
                                            <UploadCloud size={20} className="group-hover:text-indigo-500 transition-colors" />
                                            <span className="text-xs font-medium group-hover:text-indigo-600">点击上传文件 (如PDF、Word、图片)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> 确认发布
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
