/**
 * TeacherHomeworkMgmt.tsx - 教师端作业分发与批改
 *
 * 所在模块：教师端 -> 作业管理
 * 功能：
 *   - 发布作业到指定班级（含附件上传、截止时间）
 *   - 列出作业已交/已批进度，支持编辑、删除作业
 *   - 批改抽屉：按学员逐条评分/退回，带附件在线预览
 * 使用方：教师端侧边栏"作业分发与批改"入口
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { API_BASE } from '../utils/config';
import { PlusCircle, Search, Calendar, FileText, CheckCircle2, Clock, Users, UploadCloud, X, Download, Eye } from 'lucide-react';

/* ─── 文件预览工具 ─── */
/** 预览文件类型枚举 */
type PreviewKind = 'video' | 'audio' | 'pdf' | 'image' | 'office' | 'other';
/** 根据文件扩展名判断预览类型 */
const detectKind = (filename: string): PreviewKind => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
    return 'other';
};
/** 判断 URL 是否为内网地址（Office 在线预览需要公网） */
const isLocalhostUrl = (url: string) =>
    /^https?:\/\/(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01]))/i.test(url);

/** 预览文件描述 */
interface PreviewFile { url: string; name: string; }

/** FilePreviewModal - 通用附件预览弹窗（video/audio/pdf/image/office/其它） */
const FilePreviewModal: React.FC<{ file: PreviewFile; onClose: () => void }> = ({ file, onClose }) => {
    const kind = detectKind(file.name);
    const absUrl = file.url.startsWith('http') ? file.url : `${API_BASE}${file.url}`;
    const isLocal = isLocalhostUrl(absUrl);
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[80%]">{file.name}</span>
                    <div className="flex items-center gap-2">
                        <a href={absUrl} download={file.name} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg">
                            <Download size={12} /> 下载
                        </a>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
                    {kind === 'video' && <video src={absUrl} controls className="max-w-full max-h-[70vh] rounded" />}
                    {kind === 'audio' && <audio src={absUrl} controls className="w-full max-w-lg" />}
                    {kind === 'pdf' && <iframe src={absUrl} className="w-full h-[70vh] border-0" title={file.name} />}
                    {kind === 'image' && <img src={absUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded" />}
                    {kind === 'office' && !isLocal && (
                        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absUrl)}`} className="w-full h-[70vh] border-0" title={file.name} />
                    )}
                    {kind === 'office' && isLocal && (
                        <div className="text-center p-10 space-y-4">
                            <FileText size={48} className="mx-auto text-slate-300" />
                            <p className="text-slate-500 font-medium">Office 文档在线预览需要公网地址</p>
                            <a href={absUrl} download={file.name} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                                <Download size={14} /> 下载查看
                            </a>
                        </div>
                    )}
                    {kind === 'other' && (
                        <div className="text-center p-10 space-y-4">
                            <FileText size={48} className="mx-auto text-slate-300" />
                            <p className="text-slate-500 font-medium">该文件类型不支持在线预览</p>
                            <a href={absUrl} download={file.name} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                                <Download size={14} /> 下载文件
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * TeacherHomeworkMgmt 主组件
 * - myClasses/myHomeworks：筛选当前教师的班级与作业
 * - handlePublish 发布新作业，startEditHw/handleEditHw 编辑
 * - 批改抽屉内 handleGrade 评分，handleReturn 退回
 */
export const TeacherHomeworkMgmt: React.FC = () => {
    const { currentUser, homeworks, homeworkSubmissions, classes, publishHomework, editHomework, deleteHomework, students, gradeHomework, returnSubmission, addToast, fetchTeacherHomeworks } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
    // Edit homework state
    const [editingHw, setEditingHw] = useState<any>(null);
    const [editForm, setEditForm] = useState<{ title: string; content: string; deadline: string }>({ title: '', content: '', deadline: '' });
    const [editFile, setEditFile] = useState<File | null>(null);
    const editFileRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTeacherHomeworks?.();
    }, []);
    const [newHomework, setNewHomework] = useState<{ title: string; content: string; classId: string; assignmentId: string; deadline: string; attachment: File | null }>({ title: '', content: '', classId: '', assignmentId: '', deadline: '', attachment: null });
    const fileRef = React.useRef<HTMLInputElement>(null);

    // 批改抽屉状态
    const [gradingHomeworkId, setGradingHomeworkId] = useState<string | null>(null);
    const [gradingScores, setGradingScores] = useState<Record<string, { score: string; feedback: string }>>({});

    const gradingHomework = useMemo(
        () => (homeworks || []).find(h => h.id === gradingHomeworkId),
        [homeworks, gradingHomeworkId]
    );
    const gradingSubmissions = useMemo(
        () => (homeworkSubmissions || []).filter(s => s.homework_id === gradingHomeworkId),
        [homeworkSubmissions, gradingHomeworkId]
    );

    /** 更新某份提交的评分表单值 */
    const setSubValue = (subId: string, key: 'score' | 'feedback', val: string) => {
        setGradingScores(prev => ({ ...prev, [subId]: { ...(prev[subId] || { score: '', feedback: '' }), [key]: val } }));
    };

    /** 提交评分：校验 0-100 后调用 store.gradeHomework */
    const handleGrade = async (subId: string) => {
        const state = gradingScores[subId];
        const score = parseFloat(state?.score || '0');
        if (isNaN(score) || score < 0 || score > 100) {
            addToast?.('请输入 0-100 的分数', 'warning');
            return;
        }
        await gradeHomework(subId, score, state?.feedback || '', (currentUser as any)?.teacherId || currentUser?.id || '');
    };

    /** 退回修改：必须填写反馈意见 */
    const handleReturn = async (subId: string) => {
        const state = gradingScores[subId];
        if (!state?.feedback) {
            addToast?.('退回需要填写反馈意见', 'warning');
            return;
        }
        try {
            await returnSubmission(subId, state.feedback);
        } catch { /* handled */ }
    };

    const teacherId = (currentUser as any)?.teacherId || currentUser?.id;
    const myClasses = useMemo(() => {
        return (classes || []).filter((c: any) => {
            const isMine = c.teacher_id === teacherId || c.teacher?.id === teacherId ||
                c.assignments?.some((a: any) => a.teacher_id === teacherId || a.teacher?.id === teacherId);
            return isMine;
        });
    }, [classes, teacherId]);

    // Only show homeworks published by this teacher
    const myHomeworks = useMemo(() => {
        return (homeworks || [])
            .filter(h => !h.teacher_id || h.teacher_id === teacherId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [homeworks, teacherId]);

    /** 进入编辑作业：回填现有表单字段 */
    const startEditHw = (hw: any) => {
        setEditingHw(hw);
        setEditForm({
            title: hw.title || '',
            content: hw.content || '',
            deadline: hw.deadline ? new Date(hw.deadline).toISOString().slice(0, 16) : '',
        });
        setEditFile(null);
    };

    /** 保存作业编辑（含可选的新附件） */
    const handleEditHw = async () => {
        if (!editingHw) return;
        try {
            await editHomework(editingHw.id, {
                title: editForm.title,
                content: editForm.content,
                deadline: editForm.deadline,
            }, editFile || undefined);
            setEditingHw(null);
        } catch { /* handled by toast */ }
    };

    /** 删除作业（含所有提交记录），二次确认 */
    const handleDeleteHw = async (hwId: string, title: string) => {
        if (!confirm(`确定删除作业「${title}」？所有学员的提交记录也会被删除，此操作不可撤销。`)) return;
        try {
            await deleteHomework(hwId);
        } catch { /* handled */ }
    };

    /** 发布新作业：校验必填后调用 store.publishHomework */
    const handlePublish = async () => {
        if (!newHomework.title || !newHomework.classId || !newHomework.deadline) {
            addToast?.('请填写完整信息', 'warning');
            return;
        }

        try {
            await publishHomework({
                title: newHomework.title,
                content: newHomework.content,
                class_id: newHomework.assignmentId || newHomework.classId,
                teacher_id: (currentUser as any)?.teacherId || currentUser?.id || '',
                deadline: newHomework.deadline,
            }, newHomework.attachment || undefined);
            setShowModal(false);
            setNewHomework({ title: '', content: '', classId: '', assignmentId: '', deadline: '', attachment: null });
        } catch (error) {
            // Error is handled by addToast in store
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
        {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
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
                            <ElmIcon name="search" size={16} />
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
                                <th className="p-4 font-bold">截止时间</th>·
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
                                                    <ElmIcon name="document" size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{hw.title}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{hw.content}</p>
                                                    {hw.attachmentName && (
                                                        <button
                                                            onClick={() => setPreviewFile({ url: hw.attachmentUrl!, name: hw.attachmentName! })}
                                                            className="flex items-center gap-1.5 mt-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 w-fit px-2 py-0.5 rounded-md font-medium transition-colors"
                                                        >
                                                            <Eye size={11} /> {hw.attachmentName}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                <ElmIcon name="user" size={16} /> {targetClass?.name || '未知班级'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <ElmIcon name="clock" size={16} /> {hw.deadline}
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
                                        <td className="p-4 text-right space-x-1">
                                            <button
                                                onClick={() => startEditHw(hw)}
                                                className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                编辑
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHw(hw.id, hw.title)}
                                                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                删除
                                            </button>
                                            <button
                                                onClick={() => setGradingHomeworkId(hw.id)}
                                                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
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
                    <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 pt-20">
                        <div className="bg-white w-full max-w-lg max-h-[calc(100vh-6rem)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <h3 className="font-bold text-slate-800">发布新作业</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                                        onChange={e => {
                                            const cls = myClasses.find((c: any) => c.id === e.target.value) as any;
                                            setNewHomework({ ...newHomework, classId: e.target.value, assignmentId: cls?.assignment_id || '' });
                                        }}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                    >
                                        <option value="">请选择要分发的班级...</option>
                                        {myClasses.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.courseName || c.course?.name || ''})</option>
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
                                                    <ElmIcon name="document" size={16} />
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
                                                <ElmIcon name="close" size={16} />
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
                            <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100 shrink-0">
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
                                    <ElmIcon name="circle-check" size={16} /> 确认发布
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 编辑作业弹窗 */}
            {editingHw && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">编辑作业</h3>
                            <button onClick={() => setEditingHw(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">作业标题</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">作业内容</label>
                                <textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">截止时间</label>
                                <input type="datetime-local" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                    附件 {editingHw.attachmentName && <span className="text-slate-400 font-normal">（当前: {editingHw.attachmentName}）</span>}
                                </label>
                                <input ref={editFileRef} type="file" className="hidden" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                                {editFile ? (
                                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-indigo-600" />
                                            <span className="text-xs font-bold text-slate-700">{editFile.name}</span>
                                        </div>
                                        <button onClick={() => setEditFile(null)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => editFileRef.current?.click()}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl text-xs text-slate-500 font-medium hover:text-indigo-600 transition-all">
                                        <UploadCloud size={16} className="inline mr-1" /> 点击更换附件
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
                            <button onClick={() => setEditingHw(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold">取消</button>
                            <button onClick={handleEditHw} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all">保存修改</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 批改抽屉 */}
            {gradingHomework && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-800">批改作业：{gradingHomework.title}</h3>
                                <p className="text-xs text-slate-400 mt-1">共 {gradingSubmissions.length} 份提交</p>
                            </div>
                            <button
                                onClick={() => { setGradingHomeworkId(null); setGradingScores({}); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                            {gradingSubmissions.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 text-sm">暂无学员提交</div>
                            ) : gradingSubmissions.map(sub => {
                                const student = (students || []).find(s => s.id === sub.student_id);
                                const state = gradingScores[sub.id] || { score: sub.score?.toString() || '', feedback: sub.feedback || '' };
                                const statusLabel = {
                                    SUBMITTED: { text: '待批改', style: 'bg-blue-50 text-blue-600' },
                                    submitted: { text: '待批改', style: 'bg-blue-50 text-blue-600' },
                                    LATE: { text: '逾期提交', style: 'bg-amber-50 text-amber-700' },
                                    GRADED: { text: '已批改', style: 'bg-emerald-50 text-emerald-600' },
                                    graded: { text: '已批改', style: 'bg-emerald-50 text-emerald-600' },
                                    RETURNED: { text: '已退回', style: 'bg-rose-50 text-rose-600' },
                                }[sub.status] || { text: sub.status, style: 'bg-slate-50 text-slate-500' };

                                return (
                                    <div key={sub.id} className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <ElmIcon name="user" size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{student?.name || '未知学员'}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(sub.submittedAt || Date.now()).toLocaleString('zh-CN')}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusLabel.style}`}>{statusLabel.text}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap space-y-2">
                                            {(sub as any).attachmentUrl && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setPreviewFile({ url: (sub as any).attachmentUrl, name: (sub as any).attachmentName || '附件' })}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-bold"
                                                    >
                                                        <Eye size={14} /> {(sub as any).attachmentName || '预览附件'}
                                                    </button>
                                                    <a
                                                        href={`${API_BASE}${(sub as any).attachmentUrl}`}
                                                        download={(sub as any).attachmentName}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors font-bold"
                                                    >
                                                        <Download size={14} /> 下载
                                                    </a>
                                                </div>
                                            )}
                                            {sub.content && !(sub.content as string).startsWith('[文件提交]') && (
                                                <span>{sub.content}</span>
                                            )}
                                            {!sub.content && !(sub as any).attachmentUrl && (
                                                <span className="text-slate-400">（无内容）</span>
                                            )}
                                        </div>
                                        {sub.status === 'RETURNED' ? (
                                            <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">已退回，等待学员重新提交</div>
                                        ) : sub.status === 'GRADED' || sub.status === 'graded' ? (
                                            <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg space-y-1">
                                                <p>得分：<span className="font-mono font-bold">{sub.score}</span></p>
                                                {sub.feedback && <p className="text-slate-600">反馈：{sub.feedback}</p>}
                                            </div>
                                        ) : (
                                            <div className="flex items-end gap-3">
                                                <div className="w-24">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">分数 (0-100)</label>
                                                    <input
                                                        type="number" min="0" max="100"
                                                        value={state.score}
                                                        onChange={e => setSubValue(sub.id, 'score', e.target.value)}
                                                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">反馈 / 退回原因</label>
                                                    <input
                                                        type="text"
                                                        value={state.feedback}
                                                        onChange={e => setSubValue(sub.id, 'feedback', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                        placeholder="评语或要求重做的原因"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleReturn(sub.id)}
                                                    className="px-3 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50"
                                                >
                                                    退回修改
                                                </button>
                                                <button
                                                    onClick={() => handleGrade(sub.id)}
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95"
                                                >
                                                    评分
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
