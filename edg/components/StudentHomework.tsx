import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { API_BASE } from '../utils/config';
import { UploadCloud, Link2, FileText, ChevronDown, ChevronUp, Paperclip, X, Edit3, Download, Eye } from 'lucide-react';

/* ─── 文件预览工具 ─── */
type PreviewKind = 'video' | 'audio' | 'pdf' | 'image' | 'office' | 'other';
const detectKind = (filename: string): PreviewKind => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
    return 'other';
};
const isLocalhostUrl = (url: string) =>
    /^https?:\/\/(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01]))/i.test(url);

interface PreviewFile { url: string; name: string; }

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
                    {kind === 'video' && (
                        <video src={absUrl} controls className="max-w-full max-h-[70vh] rounded" />
                    )}
                    {kind === 'audio' && (
                        <audio src={absUrl} controls className="w-full max-w-lg" />
                    )}
                    {kind === 'pdf' && (
                        <iframe src={absUrl} className="w-full h-[70vh] border-0" title={file.name} />
                    )}
                    {kind === 'image' && (
                        <img src={absUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded" />
                    )}
                    {kind === 'office' && !isLocal && (
                        <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absUrl)}`}
                            className="w-full h-[70vh] border-0"
                            title={file.name}
                        />
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

type FilterTab = 'all' | 'pending' | 'submitted' | 'graded';
type SubmitMode = 'text' | 'link' | 'file';

export const StudentHomework: React.FC = () => {
    const { currentUser, homeworks, homeworkSubmissions, submitHomework, editSubmission, fetchMyHomeworks, addToast } = useStore();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

    useEffect(() => {
        if (currentUser?.role === 'student') {
            fetchMyHomeworks?.();
        }
    }, [currentUser]);
    const [expandedHw, setExpandedHw] = useState<string | null>(null);
    const [submitMode, setSubmitMode] = useState<SubmitMode>('text');
    const [submissionContent, setSubmissionContent] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Editing state
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editMode, setEditMode] = useState<SubmitMode>('text');
    const editFileRef = useRef<HTMLInputElement>(null);

    const myHomeworks = useMemo(() => {
        return (homeworks || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [homeworks]);

    const getSubmission = (hwId: string) =>
        (homeworkSubmissions || []).find(s =>
            s.homework_id === hwId &&
            (s.student_id === currentUser?.bindStudentId || (s as any).user_id === currentUser?.id)
        );

    const stats = useMemo(() => {
        const pending = myHomeworks.filter(hw => !getSubmission(hw.id)).length;
        const submitted = myHomeworks.filter(hw => {
            const s = getSubmission(hw.id);
            return s && s.status !== 'graded';
        }).length;
        const graded = myHomeworks.filter(hw => getSubmission(hw.id)?.status === 'graded').length;
        return { pending, submitted, graded, total: myHomeworks.length };
    }, [myHomeworks, homeworkSubmissions]);

    const filteredHomeworks = useMemo(() => {
        return myHomeworks.filter(hw => {
            const sub = getSubmission(hw.id);
            if (activeFilter === 'pending') return !sub;
            if (activeFilter === 'submitted') return !!sub && sub.status !== 'graded';
            if (activeFilter === 'graded') return sub?.status === 'graded';
            return true;
        });
    }, [myHomeworks, homeworkSubmissions, activeFilter]);

    const handleToggleExpand = (hwId: string) => {
        if (expandedHw === hwId) {
            setExpandedHw(null);
        } else {
            setExpandedHw(hwId);
            setSubmitMode('text');
            setSubmissionContent('');
            setLinkInput('');
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (hwId: string) => {
        if (typeof submitHomework !== 'function') {
            alert('检测到系统内核热更新缓存，请按 F5 或 Cmd+R 强制刷新页面后重试！');
            return;
        }

        try {
            if (submitMode === 'file') {
                if (!selectedFile) { addToast?.('请选择要上传的文件', 'warning'); return; }
                // 真实文件上传
                const fd = new FormData();
                fd.append('file', selectedFile);
                fd.append('homeworkId', hwId);
                const { default: api } = await import('../utils/api');
                await api.post('/api/teaching/homeworks/submit-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                addToast?.('作业文件已提交', 'success');
            } else {
                let content = '';
                if (submitMode === 'text') {
                    content = submissionContent.trim();
                    if (!content) { addToast?.('请填写作业内容', 'warning'); return; }
                } else if (submitMode === 'link') {
                    content = linkInput.trim();
                    if (!content) { addToast?.('请输入提交链接', 'warning'); return; }
                    if (!/^https?:\/\//i.test(content)) { addToast?.('请输入有效的 URL（以 http:// 或 https:// 开头）', 'warning'); return; }
                    content = `[链接提交] ${content}`;
                }
                await submitHomework({
                    homework_id: hwId,
                    student_id: currentUser?.bindStudentId || 'S10001',
                    content,
                });
            }
            fetchMyHomeworks?.();
        } catch { /* handled by toast */ }

        setSubmissionContent('');
        setLinkInput('');
        setSelectedFile(null);
        setExpandedHw(null);
    };

    const startEdit = (sub: any) => {
        setEditingSubId(sub.id);
        setEditContent(sub.content || '');
        setEditFile(null);
        setEditMode(sub.attachmentUrl ? 'file' : 'text');
    };

    const handleEdit = async (subId: string) => {
        try {
            if (editMode === 'file' && editFile) {
                await editSubmission(subId, `[文件提交] ${editFile.name}`, editFile);
            } else {
                if (!editContent.trim()) { addToast?.('请填写内容', 'warning'); return; }
                await editSubmission(subId, editContent);
            }
            setEditingSubId(null);
        } catch { /* handled */ }
    };

    const filterTabs: { key: FilterTab; label: string; count: number; color: string }[] = [
        { key: 'all', label: '全部', count: stats.total, color: 'slate' },
        { key: 'pending', label: '待提交', count: stats.pending, color: 'orange' },
        { key: 'submitted', label: '待批改', count: stats.submitted, color: 'emerald' },
        { key: 'graded', label: '已批改', count: stats.graded, color: 'indigo' },
    ];

    const tabActiveClass: Record<string, string> = {
        all: 'bg-slate-900 text-white shadow-lg',
        orange: 'bg-orange-500 text-white shadow-lg shadow-orange-200',
        emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200',
        indigo: 'bg-indigo-500 text-white shadow-lg shadow-indigo-200',
    };

    return (
        <div className="max-w-[900px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
        {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
            {/* Header */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                        <ElmIcon name="reading" size={16} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的作业</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">查看教师布置的课后作业并在线提交，巩固学习成果。</p>
                    </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mt-0.5">待提交</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                        <p className="text-2xl font-bold text-emerald-600">{stats.submitted}</p>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-0.5">待批改</p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
                        <p className="text-2xl font-bold text-indigo-600">{stats.graded}</p>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-0.5">已批改</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                {filterTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeFilter === tab.key
                                ? (tabActiveClass[tab.key] || tabActiveClass[tab.color])
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeFilter === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                        }`}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Homework List */}
            <div className="space-y-4">
                {filteredHomeworks.map(hw => {
                    const mySubmission = getSubmission(hw.id);
                    const rawStatus = (mySubmission?.status || '').toUpperCase();
                    const isGraded = rawStatus === 'GRADED';
                    const isReturned = rawStatus === 'RETURNED';
                    const isLate = rawStatus === 'LATE';
                    const isSubmitted = !!mySubmission && !isReturned;
                    // 退回状态允许重新编辑提交
                    const canResubmit = isReturned;
                    const isExpanded = expandedHw === hw.id || (canResubmit && expandedHw === hw.id);

                    const statusBadge = isGraded
                        ? { label: '已批改', cls: 'bg-indigo-50 text-indigo-600 border border-indigo-100' }
                        : isReturned
                        ? { label: '已退回 · 待重交', cls: 'bg-rose-50 text-rose-600 border border-rose-100' }
                        : isLate
                        ? { label: '逾期提交 · 待批改', cls: 'bg-amber-50 text-amber-700 border border-amber-100' }
                        : isSubmitted
                        ? { label: '待批改', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }
                        : { label: '待提交', cls: 'bg-orange-50 text-orange-600 border border-orange-100' };

                    return (
                        <div key={hw.id} className={`bg-white rounded-[1.75rem] border shadow-sm transition-all overflow-hidden ${isExpanded ? 'border-orange-200 shadow-orange-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                            {isReturned && mySubmission?.feedback && (
                                <div className="px-6 pt-4 pb-0">
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                                        <span className="font-bold">教师反馈：</span>{mySubmission.feedback}
                                    </div>
                                </div>
                            )}
                            {/* Card Header */}
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => (!isSubmitted || canResubmit) && handleToggleExpand(hw.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusBadge.cls}`}>
                                                {statusBadge.label}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-800 truncate">{hw.title}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{hw.content}</p>
                                        {hw.attachmentName && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setPreviewFile({ url: hw.attachmentUrl!, name: hw.attachmentName! }); }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Eye size={12} /> {hw.attachmentName}
                                                </button>
                                                <a
                                                    href={`${API_BASE}${hw.attachmentUrl}`}
                                                    download={hw.attachmentName}
                                                    onClick={e => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    <Download size={11} />
                                                </a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-5 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <ElmIcon name="clock" size={14} />
                                                截止：{hw.deadline}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <ElmIcon name="document" size={14} />
                                                满分 100 分
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right side */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {isGraded && (
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-indigo-700 font-mono">{mySubmission.score}</span>
                                                <span className="text-xs text-indigo-400 font-bold"> / 100</span>
                                            </div>
                                        )}
                                        {isSubmitted ? (
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${isGraded ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <ElmIcon name="circle-check" size={14} />
                                                {isGraded ? '查看批改' : '已提交'}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={e => { e.stopPropagation(); handleToggleExpand(hw.id); }}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    isExpanded
                                                        ? 'bg-slate-100 text-slate-500'
                                                        : 'bg-slate-900 text-white hover:bg-orange-500 shadow-md'
                                                }`}
                                            >
                                                {isExpanded ? <><X size={12} /> 收起</> : <>去完成作业 <ChevronDown size={12} /></>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded: Graded view */}
                            {isGraded && (
                                <div className="px-6 pb-6 space-y-3 border-t border-slate-100 pt-4">
                                    {mySubmission.feedback && (
                                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">老师点评</p>
                                            <p className="text-sm text-indigo-700 font-medium">{mySubmission.feedback}</p>
                                        </div>
                                    )}
                                    {(mySubmission.content || (mySubmission as any).attachmentUrl) && (
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">我的提交</p>
                                            {(mySubmission as any).attachmentUrl ? (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setPreviewFile({ url: (mySubmission as any).attachmentUrl, name: (mySubmission as any).attachmentName || '附件' })}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                                                    >
                                                        <Eye size={12} /> {(mySubmission as any).attachmentName || '预览附件'}
                                                    </button>
                                                    <a href={`${API_BASE}${(mySubmission as any).attachmentUrl}`} download={(mySubmission as any).attachmentName}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                                                        <Download size={11} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap break-all">{mySubmission.content}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded: Submitted pending grade — with edit capability */}
                            {isSubmitted && !isGraded && (
                                <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-3">
                                    {editingSubId === mySubmission.id ? (
                                        /* ── Edit form ── */
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                {([
                                                    { key: 'text' as SubmitMode, icon: <FileText size={13} />, label: '文字' },
                                                    { key: 'file' as SubmitMode, icon: <Paperclip size={13} />, label: '文件' },
                                                ]).map(m => (
                                                    <button key={m.key} onClick={() => setEditMode(m.key)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editMode === m.key ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {m.icon}{m.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {editMode === 'text' ? (
                                                <textarea rows={4} value={editContent} onChange={e => setEditContent(e.target.value)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 resize-none" placeholder="修改作业内容..." />
                                            ) : (
                                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 transition-all"
                                                    onClick={() => editFileRef.current?.click()}>
                                                    <input ref={editFileRef} type="file" className="hidden"
                                                        accept=".pdf,.doc,.docx,.zip,.rar,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java"
                                                        onChange={e => setEditFile(e.target.files?.[0] || null)} />
                                                    {editFile ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Paperclip size={14} className="text-blue-500" />
                                                            <span className="text-sm font-bold text-slate-700">{editFile.name}</span>
                                                            <button onClick={e => { e.stopPropagation(); setEditFile(null); }} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400">点击选择新文件</p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingSubId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg">取消</button>
                                                <button onClick={() => handleEdit(mySubmission.id)} className="flex-1 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all">保存修改</button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── Normal submitted view ── */
                                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-3">
                                            <ElmIcon name="circle-check" size={16} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-emerald-700">作业已提交，等待老师批改</p>
                                                {(mySubmission as any).attachmentUrl ? (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <button
                                                            onClick={() => setPreviewFile({ url: (mySubmission as any).attachmentUrl, name: (mySubmission as any).attachmentName || '附件' })}
                                                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                        >
                                                            <Eye size={12} /> {(mySubmission as any).attachmentName || '预览附件'}
                                                        </button>
                                                        <a href={`${API_BASE}${(mySubmission as any).attachmentUrl}`} download={(mySubmission as any).attachmentName}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors">
                                                            <Download size={11} />
                                                        </a>
                                                    </div>
                                                ) : mySubmission.content && (
                                                    <p className="text-xs text-emerald-600 mt-1 break-all line-clamp-2">{mySubmission.content}</p>
                                                )}
                                            </div>
                                            <button onClick={() => startEdit(mySubmission)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0">
                                                <Edit3 size={12} /> 编辑
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded: Submission Form */}
                            {!isSubmitted && isExpanded && (
                                <div className="px-6 pb-6 border-t border-orange-100 pt-5 space-y-4">
                                    {/* Mode Switcher */}
                                    <div className="flex gap-2">
                                        {([
                                            { key: 'text' as SubmitMode, icon: <FileText size={13} />, label: '文字作答' },
                                            { key: 'link' as SubmitMode, icon: <Link2 size={13} />, label: '链接提交' },
                                            { key: 'file' as SubmitMode, icon: <Paperclip size={13} />, label: '文件上传' },
                                        ]).map(m => (
                                            <button
                                                key={m.key}
                                                onClick={() => setSubmitMode(m.key)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    submitMode === m.key
                                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {m.icon}{m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Input Area */}
                                    {submitMode === 'text' && (
                                        <textarea
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all resize-none font-medium text-slate-700 placeholder:text-slate-400"
                                            rows={5}
                                            placeholder="在此输入你的作业解答..."
                                            value={submissionContent}
                                            onChange={e => setSubmissionContent(e.target.value)}
                                        />
                                    )}

                                    {submitMode === 'link' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/30 transition-all">
                                                <Link2 size={16} className="text-slate-400 shrink-0" />
                                                <input
                                                    type="url"
                                                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                                                    placeholder="粘贴 GitHub、Gitee 或其他代码仓库链接..."
                                                    value={linkInput}
                                                    onChange={e => setLinkInput(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 pl-1">支持 GitHub、Gitee、CodeSandbox 等各类代码平台链接</p>
                                        </div>
                                    )}

                                    {submitMode === 'file' && (
                                        <div
                                            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.zip,.rar,.txt,.md,.js,.ts,.jsx,.tsx,.py,.java"
                                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            {selectedFile ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
                                                        <Paperclip size={16} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-700">{selectedFile.name}</p>
                                                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <button
                                                        className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                                                        <UploadCloud size={20} />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600">点击选择文件</p>
                                                    <p className="text-xs text-slate-400">支持 PDF、Word、ZIP、代码文件等，最大 50MB</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setExpandedHw(null)}
                                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={() => handleSubmit(hw.id)}
                                            className="flex-1 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={15} /> 确认提交
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredHomeworks.length === 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-200 py-16 flex flex-col items-center justify-center text-slate-400 gap-4 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                            <ElmIcon name="circle-check" size={16} />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold text-slate-600 mb-1">
                                {activeFilter === 'pending' ? '暂无待提交作业' :
                                 activeFilter === 'submitted' ? '暂无待批改作业' :
                                 activeFilter === 'graded' ? '暂无已批改作业' : '太棒了，暂无作业！'}
                            </p>
                            <p className="text-xs tracking-widest opacity-60 font-bold">全部完成</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
