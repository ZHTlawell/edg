import React, { useState, useEffect, useCallback } from 'react';
import { ElmIcon } from './ElmIcon';
import { Plus, Trash2, FileText, X, ChevronDown, ChevronRight as ChevRight } from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';

interface Chapter {
    id: string;
    title: string;
    sort_order: number;
}

interface QuizPaper {
    id: string;
    title: string;
    chapter_id: string;
    standard_id: string;
    time_limit: number;
    pass_score: number;
    status: string;
    createdAt: string;
    _count?: { questions: number; submissions: number };
}

interface QuestionDraft {
    type: 'single' | 'multiple';
    text: string;
    options: { id: string; label: string; text: string }[];
    answer: string[];
    score: number;
}

const blankQuestion = (): QuestionDraft => ({
    type: 'single',
    text: '',
    options: [
        { id: 'A', label: 'A', text: '' },
        { id: 'B', label: 'B', text: '' },
        { id: 'C', label: 'C', text: '' },
        { id: 'D', label: 'D', text: '' },
    ],
    answer: [],
    score: 10,
});

// ───── 出题表单 Modal ─────────────────────────────────────────────
const QuizEditorModal: React.FC<{
    chapter: Chapter;
    standardId: string;
    onClose: () => void;
    onSaved: () => void;
}> = ({ chapter, standardId, onClose, onSaved }) => {
    const { addToast } = useStore();
    const [title, setTitle] = useState(`${chapter.title} · 章节测验`);
    const [timeLimit, setTimeLimit] = useState(20);
    const [passScore, setPassScore] = useState(60);
    const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion()]);
    const [saving, setSaving] = useState(false);

    const updateQ = (idx: number, patch: Partial<QuestionDraft>) => {
        setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    };
    const updateOption = (qIdx: number, oIdx: number, text: string) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, text } : o)) } : q
            )
        );
    };
    const toggleAnswer = (qIdx: number, optId: string) => {
        const q = questions[qIdx];
        let newAnswer: string[];
        if (q.type === 'single') {
            newAnswer = [optId];
        } else {
            newAnswer = q.answer.includes(optId) ? q.answer.filter(a => a !== optId) : [...q.answer, optId];
        }
        updateQ(qIdx, { answer: newAnswer });
    };

    const handleSave = async () => {
        // 校验
        if (!title.trim()) {
            addToast('请填写试卷标题', 'warning');
            return;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                addToast(`第 ${i + 1} 题题干为空`, 'warning');
                return;
            }
            if (q.options.some(o => !o.text.trim())) {
                addToast(`第 ${i + 1} 题存在空选项`, 'warning');
                return;
            }
            if (q.answer.length === 0) {
                addToast(`第 ${i + 1} 题未指定正确答案`, 'warning');
                return;
            }
        }

        setSaving(true);
        try {
            await api.post('/api/quiz/papers', {
                title,
                chapterId: chapter.id,
                standardId,
                timeLimit: timeLimit * 60,
                passScore,
                questions,
            });
            addToast('试卷已保存并发布', 'success');
            onSaved();
            onClose();
        } catch (e: any) {
            addToast(e?.response?.data?.message || '保存失败', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">为「{chapter.title}」出题</h3>
                        <p className="text-xs text-slate-400 mt-1">所有引用此课程标准的实例课程都会用上这套题</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* 试卷元信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl">
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">试卷标题</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">限时（分钟）</label>
                            <input type="number" min={1} value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 20)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-mono font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">及格分</label>
                            <input type="number" min={0} max={100} value={passScore} onChange={e => setPassScore(parseInt(e.target.value) || 60)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-mono font-bold outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">题目数</label>
                            <div className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-mono font-bold text-indigo-600">{questions.length} 题</div>
                        </div>
                    </div>

                    {/* 题目列表 */}
                    <div className="space-y-4">
                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">第 {qIdx + 1} 题</span>
                                        <select value={q.type}
                                            onChange={e => updateQ(qIdx, { type: e.target.value as any, answer: [] })}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                                            <option value="single">单选</option>
                                            <option value="multiple">多选</option>
                                        </select>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            分值
                                            <input type="number" min={1} value={q.score}
                                                onChange={e => updateQ(qIdx, { score: parseInt(e.target.value) || 10 })}
                                                className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none" />
                                        </div>
                                    </div>
                                    {questions.length > 1 && (
                                        <button onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <textarea value={q.text} onChange={e => updateQ(qIdx, { text: e.target.value })}
                                    rows={2} placeholder="请输入题干..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-indigo-500 resize-none" />

                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => {
                                        const isCorrect = q.answer.includes(opt.id);
                                        return (
                                            <div key={opt.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                <button onClick={() => toggleAnswer(qIdx, opt.id)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                    title={isCorrect ? '正确答案' : '点击设为正确答案'}>
                                                    {opt.label}
                                                </button>
                                                <input type="text" value={opt.text}
                                                    onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                    placeholder={`选项 ${opt.label}`}
                                                    className="flex-1 bg-transparent text-sm outline-none" />
                                                {isCorrect && <span className="text-[10px] font-bold text-emerald-600">✓ 答案</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setQuestions(prev => [...prev, blankQuestion()])}
                            className="w-full py-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-500 transition-all flex items-center justify-center gap-2">
                            <Plus size={16} /> 添加一道题
                        </button>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl">取消</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50">
                        {saving ? '保存中...' : '保存并发布'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ───── 主 Manager 组件 ─────────────────────────────────────────────
export const QuizPaperManager: React.FC<{ standardId: string }> = ({ standardId }) => {
    const { addToast } = useStore();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [papersByChapter, setPapersByChapter] = useState<Record<string, QuizPaper[]>>({});
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        try {
            const chRes = await api.get(`/api/course-resource/chapters?standard_id=${standardId}`);
            const chs: Chapter[] = chRes.data || [];
            setChapters(chs);
            // 默认全部展开
            setExpanded(new Set(chs.map(c => c.id)));

            const map: Record<string, QuizPaper[]> = {};
            await Promise.all(
                chs.map(async ch => {
                    const r = await api.get(`/api/quiz/papers/by-chapter/${ch.id}`);
                    map[ch.id] = r.data || [];
                })
            );
            setPapersByChapter(map);
        } catch (e: any) {
            addToast('加载试卷数据失败', 'error');
        }
    }, [standardId, addToast]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (paperId: string, title: string) => {
        if (!window.confirm(`确认删除试卷「${title}」？该操作不可恢复，且会清除已有提交记录。`)) return;
        try {
            await api.delete(`/api/quiz/papers/${paperId}`);
            addToast('试卷已删除', 'success');
            load();
        } catch (e: any) {
            addToast(e?.response?.data?.message || '删除失败', 'error');
        }
    };

    const toggle = (chId: string) => setExpanded(prev => {
        const n = new Set(prev);
        n.has(chId) ? n.delete(chId) : n.add(chId);
        return n;
    });

    return (
        <div className="space-y-3">
            {editingChapter && (
                <QuizEditorModal
                    chapter={editingChapter}
                    standardId={standardId}
                    onClose={() => setEditingChapter(null)}
                    onSaved={load}
                />
            )}

            {chapters.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">该标准尚无章节，请先到「课程资源」中创建章节</p>
                </div>
            ) : chapters.map(ch => {
                const papers = papersByChapter[ch.id] || [];
                const isOpen = expanded.has(ch.id);
                return (
                    <div key={ch.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                            <button onClick={() => toggle(ch.id)} className="flex items-center gap-3 flex-1 text-left">
                                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevRight size={16} className="text-slate-400" />}
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{ch.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{papers.length} 套试卷</p>
                                </div>
                            </button>
                            <button onClick={() => setEditingChapter(ch)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">
                                <Plus size={14} /> 出题
                            </button>
                        </div>
                        {isOpen && (
                            <div className="px-4 pb-4 space-y-2">
                                {papers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">本章节暂无试卷</p>
                                ) : papers.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/40 group">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText size={16} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{p.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {p._count?.questions || 0} 题 · 限时 {Math.round(p.time_limit / 60)} 分钟 · 及格 {p.pass_score} 分
                                                {(p._count?.submissions || 0) > 0 && ` · 已有 ${p._count?.submissions} 次提交`}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已发布</span>
                                        <button onClick={() => handleDelete(p.id, p.title)}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
