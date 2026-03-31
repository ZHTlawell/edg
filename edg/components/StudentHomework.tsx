import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { UploadCloud, Link2, FileText, ChevronDown, ChevronUp, Paperclip, X } from 'lucide-react';

type FilterTab = 'all' | 'pending' | 'submitted' | 'graded';
type SubmitMode = 'text' | 'link' | 'file';

export const StudentHomework: React.FC = () => {
    const { currentUser, homeworks, homeworkSubmissions, submitHomework, addToast } = useStore();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [expandedHw, setExpandedHw] = useState<string | null>(null);
    const [submitMode, setSubmitMode] = useState<SubmitMode>('text');
    const [submissionContent, setSubmissionContent] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSubmit = (hwId: string) => {
        if (typeof submitHomework !== 'function') {
            alert('检测到系统内核热更新缓存，请按 F5 或 Cmd+R 强制刷新页面后重试！');
            return;
        }

        let content = '';
        if (submitMode === 'text') {
            content = submissionContent.trim();
            if (!content) { addToast?.('请填写作业内容', 'warning'); return; }
        } else if (submitMode === 'link') {
            content = linkInput.trim();
            if (!content) { addToast?.('请输入提交链接', 'warning'); return; }
            if (!/^https?:\/\//i.test(content)) { addToast?.('请输入有效的 URL（以 http:// 或 https:// 开头）', 'warning'); return; }
            content = `[链接提交] ${content}`;
        } else if (submitMode === 'file') {
            if (!selectedFile) { addToast?.('请选择要上传的文件', 'warning'); return; }
            content = `[文件提交] ${selectedFile.name}`;
        }

        submitHomework({
            homework_id: hwId,
            student_id: currentUser?.bindStudentId || 'S10001',
            content,
        });
        setSubmissionContent('');
        setLinkInput('');
        setSelectedFile(null);
        setExpandedHw(null);
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
                    const isGraded = mySubmission?.status === 'graded';
                    const isSubmitted = !!mySubmission;
                    const isExpanded = expandedHw === hw.id;

                    const statusBadge = isGraded
                        ? { label: '已批改', cls: 'bg-indigo-50 text-indigo-600 border border-indigo-100' }
                        : isSubmitted
                        ? { label: '待批改', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }
                        : { label: '待提交', cls: 'bg-orange-50 text-orange-600 border border-orange-100' };

                    return (
                        <div key={hw.id} className={`bg-white rounded-[1.75rem] border shadow-sm transition-all overflow-hidden ${isExpanded ? 'border-orange-200 shadow-orange-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                            {/* Card Header */}
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => !isSubmitted && handleToggleExpand(hw.id)}
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
                                    {mySubmission.content && (
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">我的提交</p>
                                            <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap break-all">{mySubmission.content}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded: Submitted pending grade */}
                            {isSubmitted && !isGraded && (
                                <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-3">
                                        <ElmIcon name="circle-check" size={16} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-emerald-700">作业已提交，等待老师批改</p>
                                            {mySubmission.content && (
                                                <p className="text-xs text-emerald-600 mt-1 break-all line-clamp-2">{mySubmission.content}</p>
                                            )}
                                        </div>
                                    </div>
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
                            <p className="text-xs uppercase tracking-widest opacity-60 font-bold">You are all caught up</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
