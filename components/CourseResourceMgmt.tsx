import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Upload, Video, FileText, Music, File, Plus, Search, Filter,
    Eye, Trash2, CheckCircle2, XCircle, Link2, Play, ArrowLeft,
    BookOpen, ChevronRight, ChevronDown, Edit3, Layers, Tag,
    Download, Globe, Building2, Clock, HardDrive, X, Send, RotateCcw
} from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Resource {
    id: string;
    title: string;
    type: 'VIDEO' | 'PPT' | 'PDF' | 'AUDIO' | 'OTHER';
    url: string;
    file_name?: string;
    file_size?: number;
    description?: string;
    status: string;
    standard_id?: string;
    standard?: { id: string; name: string; code: string };
    creator_id: string;
    createdAt: string;
}

interface LessonResource {
    id: string;
    sort_order: number;
    resource: Resource;
}

interface Lesson {
    id: string;
    title: string;
    sort_order: number;
    duration?: number;
    resources: LessonResource[];
}

interface Chapter {
    id: string;
    title: string;
    sort_order: number;
    standard_id: string;
    lessons: Lesson[];
}

interface Standard {
    id: string;
    name: string;
    code: string;
    status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    VIDEO: { label: '视频', icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    PPT: { label: 'PPT', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    PDF: { label: 'PDF', icon: FileText, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    AUDIO: { label: '音频', icon: Music, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    OTHER: { label: '其他', icon: File, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
};

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; cls: string }> = {
        DRAFT: { label: '草稿', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
        PUBLISHED: { label: '已发布', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        WITHDRAWN: { label: '已下架', cls: 'bg-red-50 text-red-500 border-red-200' },
    };
    const c = map[status] || map.DRAFT;
    return <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${c.cls}`}>{c.label}</span>;
};

const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ─── Resource Preview Modal ───────────────────────────────────────────────────
const PreviewModal: React.FC<{ resource: Resource; onClose: () => void }> = ({ resource, onClose }) => {
    const backendBase = 'http://localhost:3001';
    const fullUrl = resource.url.startsWith('/') ? `${backendBase}${resource.url}` : resource.url;

    return (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <p className="font-bold text-slate-800">{resource.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{resource.file_name} · {formatSize(resource.file_size)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><ElmIcon name="close" size={16} /></button>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-900 flex items-center justify-center">
                    {resource.type === 'VIDEO' && (
                        <video controls className="max-h-full max-w-full" src={fullUrl}>
                            您的浏览器不支持视频播放
                        </video>
                    )}
                    {resource.type === 'PDF' && (
                        <iframe src={fullUrl} className="w-full h-full" title={resource.title} style={{ minHeight: '60vh' }} />
                    )}
                    {resource.type === 'AUDIO' && (
                        <div className="flex flex-col items-center gap-6 p-10">
                            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                                <Music size={40} className="text-purple-500" />
                            </div>
                            <audio controls src={fullUrl} className="w-72" />
                        </div>
                    )}
                    {resource.type === 'PPT' && (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center">
                                <ElmIcon name="document" size={16} />
                            </div>
                            <p className="text-white font-bold text-lg">PPT 文件无法在浏览器中直接预览</p>
                            <p className="text-slate-300 text-sm">请点击下载后使用 PowerPoint 或 WPS 打开</p>
                            <a href={fullUrl} download={resource.file_name}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
                                <ElmIcon name="download" size={16} /> 下载课件
                            </a>
                        </div>
                    )}
                    {resource.type === 'OTHER' && (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <File size={48} className="text-slate-400" />
                            <p className="text-white font-bold">附件文件</p>
                            <a href={fullUrl} download={resource.file_name}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                                <ElmIcon name="download" size={16} /> 下载文件
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Upload Modal ─────────────────────────────────────────────────────────────
const UploadModal: React.FC<{
    standards: Standard[];
    onClose: () => void;
    onSuccess: () => void;
}> = ({ standards, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [standardId, setStandardId] = useState('');
    const [urlValue, setUrlValue] = useState('');
    const [urlType, setUrlType] = useState('VIDEO');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { addToast } = useStore();
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
    };

    const handleSubmit = async () => {
        if (!title.trim()) { addToast('请填写资源标题', 'error'); return; }
        setUploading(true);
        try {
            if (mode === 'url') {
                if (!urlValue.trim()) { addToast('请填写外链地址', 'error'); return; }
                await api.post('/api/course-resource/url', {
                    title, description, type: urlType,
                    url: urlValue, standard_id: standardId || undefined,
                });
            } else {
                if (!file) { addToast('请选择文件', 'error'); return; }
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', title);
                if (description) formData.append('description', description);
                if (standardId) formData.append('standard_id', standardId);

                const token = localStorage.getItem('token');
                await api.post('/api/course-resource/upload', formData, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    },
                    onUploadProgress: (e: any) => {
                        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
                    },
                });
            }
            addToast('资源上传成功', 'success');
            onSuccess();
            onClose();
        } catch (e: any) {
            addToast(e.response?.data?.message || '上传失败', 'error');
        } finally {
            setUploading(false); setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Upload size={18} className="text-indigo-500" />上传资源</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><ElmIcon name="close" size={16} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Mode switch */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 w-fit">
                        {[['file', '文件上传'], ['url', '外链地址']].map(([k, l]) => (
                            <button key={k} onClick={() => setMode(k as 'file' | 'url')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{l}
                            </button>
                        ))}
                    </div>

                    {mode === 'file' ? (
                        <div
                            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${file ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                            onClick={() => fileRef.current?.click()}
                        >
                            <input ref={fileRef} type="file" className="hidden"
                                accept=".mp4,.avi,.mov,.webm,.pptx,.ppt,.pdf,.mp3,.ogg,.wav,.doc,.docx,.jpg,.jpeg,.png,.jdg,.heic"
                                onChange={handleFileChange} />
                            {file ? (
                                <div className="space-y-2">
                                    <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <File size={24} className="text-indigo-600" />
                                    </div>
                                    <p className="font-bold text-slate-700">{file.name}</p>
                                    <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload size={32} className="mx-auto text-slate-300" />
                                    <p className="text-slate-500 font-medium text-sm">点击选择文件或拖拽到此处</p>
                                    <p className="text-xs text-slate-300">支持 MP4 / PPTX / PDF / MP3 / DOCX 等，最大 500MB</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <select value={urlType} onChange={e => setUrlType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <input type="url" placeholder="https://..." value={urlValue} onChange={e => setUrlValue(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                    )}

                    <div className="space-y-3">
                        <input type="text" placeholder="资源标题 *" value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                        <input type="text" placeholder="说明（可选）" value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                        <select value={standardId} onChange={e => setStandardId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                            <option value="">关联课程标准（可选）</option>
                            {standards.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                        </select>
                    </div>

                    {uploading && (
                        <div className="space-y-1.5">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 text-center">{progress < 100 ? `上传中 ${progress}%` : '处理中...'}</p>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={handleSubmit} disabled={uploading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <Upload size={16} />{uploading ? '上传中...' : '确认上传'}
                    </button>
                    <button onClick={onClose} disabled={uploading}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">取消</button>
                </div>
            </div>
        </div>
    );
};

// ─── Chapter Tree ─────────────────────────────────────────────────────────────
const ChapterTree: React.FC<{
    standardId: string;
    allResources: Resource[];
    onRefresh: () => void;
}> = ({ standardId, allResources, onRefresh }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [editingChapter, setEditingChapter] = useState<{ id: string; title: string } | null>(null);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [editingLesson, setEditingLesson] = useState<{ id: string; title: string } | null>(null);
    const [newLessonState, setNewLessonState] = useState<{ chapterId: string; title: string } | null>(null);
    const [pickingResource, setPickingResource] = useState<{ lessonId: string } | null>(null);
    const { addToast } = useStore();

    const load = useCallback(async () => {
        if (!standardId) return;
        const r = await api.get(`/api/course-resource/chapters?standard_id=${standardId}`);
        setChapters(r.data);
    }, [standardId]);

    useEffect(() => { load(); }, [load]);

    const addChapter = async () => {
        if (!newChapterTitle.trim()) return;
        await api.post('/api/course-resource/chapters', { standard_id: standardId, title: newChapterTitle, sort_order: chapters.length });
        setNewChapterTitle('');
        load();
    };

    const deleteChapter = async (id: string) => {
        if (!window.confirm('确认删除这个章节及其所有课时？')) return;
        await api.delete(`/api/course-resource/chapters/${id}`);
        load();
    };

    const addLesson = async () => {
        if (!newLessonState?.title.trim()) return;
        const ch = chapters.find(c => c.id === newLessonState.chapterId);
        await api.post('/api/course-resource/lessons', {
            chapter_id: newLessonState.chapterId,
            title: newLessonState.title,
            sort_order: ch?.lessons?.length || 0,
        });
        setNewLessonState(null);
        load();
    };

    const deleteLesson = async (id: string) => {
        await api.delete(`/api/course-resource/lessons/${id}`);
        load();
    };

    const addResourceToLesson = async (lesson_id: string, resource_id: string) => {
        try {
            await api.post(`/api/course-resource/lessons/${lesson_id}/resources`, { resource_id });
            addToast('已关联资源', 'success');
        } catch { addToast('该资源已关联', 'error'); }
        setPickingResource(null);
        load();
    };

    const removeResourceFromLesson = async (lesson_id: string, resource_id: string) => {
        await api.delete(`/api/course-resource/lessons/${lesson_id}/resources/${resource_id}`);
        load();
    };

    const publishedResources = allResources.filter(r => r.status === 'PUBLISHED' || r.status === 'DRAFT');

    return (
        <div className="space-y-4">
            {chapters.map(ch => (
                <div key={ch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Chapter header */}
                    <div
                        className="flex items-center gap-3 px-5 py-4 bg-slate-50/80 border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                        onClick={() => {
                            const next = new Set(expandedChapters);
                            next.has(ch.id) ? next.delete(ch.id) : next.add(ch.id);
                            setExpandedChapters(next);
                        }}
                    >
                        {expandedChapters.has(ch.id) ? <ElmIcon name="arrow-down" size={16} /> : <ElmIcon name="arrow-right" size={16} />}
                        <ElmIcon name="reading" size={16} />
                        {editingChapter?.id === ch.id ? (
                            <input autoFocus value={editingChapter.title}
                                onChange={e => setEditingChapter({ id: ch.id, title: e.target.value })}
                                onBlur={async () => { await api.put(`/api/course-resource/chapters/${ch.id}`, { title: editingChapter.title }); setEditingChapter(null); load(); }}
                                onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1 text-sm outline-none"
                                onClick={e => e.stopPropagation()} />
                        ) : (
                            <span className="flex-1 font-bold text-slate-700">{ch.title}</span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">{ch.lessons.length} 课时</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setEditingChapter({ id: ch.id, title: ch.title })}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                                <Edit3 size={13} />
                            </button>
                            <button onClick={() => deleteChapter(ch.id)}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Lessons */}
                    {expandedChapters.has(ch.id) && (
                        <div className="divide-y divide-slate-50">
                            {ch.lessons.map((lesson, li) => (
                                <div key={lesson.id} className="group px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0">{li + 1}</span>
                                        {editingLesson?.id === lesson.id ? (
                                            <input autoFocus value={editingLesson.title}
                                                onChange={e => setEditingLesson({ id: lesson.id, title: e.target.value })}
                                                onBlur={async () => { await api.put(`/api/course-resource/lessons/${lesson.id}`, { title: editingLesson.title }); setEditingLesson(null); load(); }}
                                                onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                                className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1 text-sm outline-none" />
                                        ) : (
                                            <span className="flex-1 text-sm font-bold text-slate-700">{lesson.title}</span>
                                        )}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setPickingResource({ lessonId: lesson.id })}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-all">
                                                <ElmIcon name="plus" size={16} />关联资源
                                            </button>
                                            <button onClick={() => setEditingLesson({ id: lesson.id, title: lesson.title })}
                                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Edit3 size={13} /></button>
                                            <button onClick={() => deleteLesson(lesson.id)}
                                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                                        </div>
                                    </div>

                                    {/* Attached resources */}
                                    {lesson.resources.length > 0 && (
                                        <div className="ml-9 mt-2 space-y-1.5">
                                            {lesson.resources.map(lr => {
                                                const tc = TYPE_CONFIG[lr.resource.type];
                                                const Icon = tc.icon;
                                                return (
                                                    <div key={lr.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${tc.bg} ${tc.border} group/res`}>
                                                        <Icon size={13} className={tc.color} />
                                                        <span className="text-xs font-medium text-slate-600 flex-1 truncate">{lr.resource.title}</span>
                                                        <span className={`text-[10px] font-bold ${tc.color}`}>{tc.label}</span>
                                                        <button onClick={() => removeResourceFromLesson(lesson.id, lr.resource.id)}
                                                            className="p-0.5 opacity-0 group-hover/res:opacity-100 hover:text-red-500 text-slate-300 transition-all">
                                                            <ElmIcon name="close" size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add lesson */}
                            {newLessonState?.chapterId === ch.id ? (
                                <div className="px-5 py-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center"><ElmIcon name="plus" size={16} /></span>
                                    <input autoFocus value={newLessonState.title}
                                        onChange={e => setNewLessonState({ ...newLessonState, title: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') addLesson(); if (e.key === 'Escape') setNewLessonState(null); }}
                                        placeholder="课时名称，按 Enter 确认"
                                        className="flex-1 bg-slate-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm outline-none" />
                                    <button onClick={addLesson} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">确认</button>
                                    <button onClick={() => setNewLessonState(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">取消</button>
                                </div>
                            ) : (
                                <button onClick={() => setNewLessonState({ chapterId: ch.id, title: '' })}
                                    className="w-full flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all text-sm">
                                    <ElmIcon name="plus" size={16} /> 添加课时
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Add chapter */}
            <div className="flex items-center gap-3">
                <input type="text" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addChapter()}
                    placeholder="输入章节名称..."
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                <button onClick={addChapter} disabled={!newChapterTitle.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40">
                    <ElmIcon name="plus" size={16} />添加章节
                </button>
            </div>

            {/* Resource picker modal */}
            {pickingResource && (
                <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <p className="font-bold text-slate-700">选择要关联的资源</p>
                            <button onClick={() => setPickingResource(null)} className="p-2 hover:bg-slate-100 rounded-xl"><ElmIcon name="close" size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2">
                            {publishedResources.map(r => {
                                const tc = TYPE_CONFIG[r.type];
                                const Icon = tc.icon;
                                return (
                                    <button key={r.id} onClick={() => addResourceToLesson(pickingResource.lessonId, r.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors rounded-xl text-left">
                                        <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={18} className={tc.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{r.title}</p>
                                            <p className="text-xs text-slate-400">{tc.label} · {formatSize(r.file_size)}</p>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </button>
                                );
                            })}
                            {publishedResources.length === 0 && (
                                <p className="text-center text-slate-300 py-8 text-sm">暂无可用资源，请先上传</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CourseResourceMgmt: React.FC = () => {
    const { addToast } = useStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [activeTab, setActiveTab] = useState<'library' | 'chapters'>('library');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedStdId, setSelectedStdId] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [preview, setPreview] = useState<Resource | null>(null);

    const loadResources = async () => {
        const r = await api.get('/api/course-resource/resources');
        setResources(r.data);
    };

    const loadStandards = async () => {
        const r = await api.get('/api/course-standards/standards?status=ENABLED');
        setStandards(r.data);
    };

    useEffect(() => {
        loadResources();
        loadStandards();
    }, []);

    const handlePublish = async (id: string) => {
        try { await api.post(`/api/course-resource/resources/${id}/publish`); addToast('已发布', 'success'); loadResources(); }
        catch (e: any) { addToast(e.response?.data?.message || '操作失败', 'error'); }
    };
    const handleWithdraw = async (id: string) => {
        try { await api.post(`/api/course-resource/resources/${id}/withdraw`); addToast('已下架', 'success'); loadResources(); }
        catch { /**/ }
    };
    const handleDelete = async (id: string) => {
        if (!window.confirm('确认删除此资源？')) return;
        try { await api.delete(`/api/course-resource/resources/${id}`); addToast('已删除', 'success'); loadResources(); }
        catch (e: any) { addToast(e.response?.data?.message || '删除失败', 'error'); }
    };

    const filtered = resources.filter(r => {
        const matchType = filterType === 'ALL' || r.type === filterType;
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
        return matchType && matchStatus && matchSearch;
    });

    const stats = {
        total: resources.length,
        published: resources.filter(r => r.status === 'PUBLISHED').length,
        video: resources.filter(r => r.type === 'VIDEO').length,
        ppt: resources.filter(r => r.type === 'PPT').length,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {showUpload && <UploadModal standards={standards} onClose={() => setShowUpload(false)} onSuccess={loadResources} />}
            {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="text-indigo-600" />课程资源库
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">上传课件、视频、PDF 等教学资源，统一下发到各校区</p>
                </div>
                <button onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <ElmIcon name="plus" size={16} />上传资源
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: '总资源数', value: stats.total, color: 'text-slate-800', bg: 'bg-white' },
                    { label: '已发布', value: stats.published, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: '视频课件', value: stats.video, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'PPT课件', value: stats.ppt, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(item => (
                    <div key={item.label} className={`${item.bg} rounded-2xl border border-slate-100 p-5 shadow-sm`}>
                        <p className="text-xs font-medium text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[['library', '资源库'], ['chapters', '课程章节']].map(([k, l]) => (
                    <button key={k} onClick={() => setActiveTab(k as 'library' | 'chapters')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                ))}
            </div>

            {/* Library Tab */}
            {activeTab === 'library' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[180px]">
                            <ElmIcon name="search" size={16} />
                            <input type="text" placeholder="搜索资源名称..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer">
                            <option value="ALL">所有类型</option>
                            {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer">
                            <option value="all">所有状态</option>
                            <option value="DRAFT">草稿</option>
                            <option value="PUBLISHED">已发布</option>
                            <option value="WITHDRAWN">已下架</option>
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {['资源', '类型', '大小', '关联课程', '状态', '上传时间', '操作'].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(r => {
                                    const tc = TYPE_CONFIG[r.type];
                                    const Icon = tc.icon;
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                                                        <Icon size={18} className={tc.color} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{r.title}</p>
                                                        {r.file_name && <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.file_name}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-bold ${tc.color}`}>{tc.label}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-400">{formatSize(r.file_size)}</td>
                                            <td className="px-5 py-4">
                                                {r.standard ? (
                                                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                                        <Tag size={10} />{r.standard.name}
                                                    </div>
                                                ) : <span className="text-xs text-slate-300">—</span>}
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                                            <td className="px-5 py-4 text-xs text-slate-400">
                                                {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setPreview(r)}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" title="预览">
                                                        <Eye size={15} />
                                                    </button>
                                                    {r.status === 'DRAFT' && (
                                                        <button onClick={() => handlePublish(r.id)}
                                                            className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="发布">
                                                            <Send size={15} />
                                                        </button>
                                                    )}
                                                    {r.status === 'PUBLISHED' && (
                                                        <button onClick={() => handleWithdraw(r.id)}
                                                            className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-all" title="下架">
                                                            <ElmIcon name="refresh" size={16} />
                                                        </button>
                                                    )}
                                                    {r.status !== 'PUBLISHED' && (
                                                        <button onClick={() => handleDelete(r.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all" title="删除">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="py-20 text-center space-y-3">
                                <Layers size={40} className="mx-auto text-slate-200" />
                                <p className="text-slate-400 font-bold">暂无资源</p>
                                <p className="text-xs text-slate-300">点击右上角「上传资源」开始添加</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <ElmIcon name="reading" size={16} />
                        <select value={selectedStdId} onChange={e => setSelectedStdId(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer">
                            <option value="">选择课程标准查看章节结构</option>
                            {standards.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                        </select>
                    </div>

                    {selectedStdId ? (
                        <ChapterTree standardId={selectedStdId} allResources={resources} onRefresh={loadResources} />
                    ) : (
                        <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <ElmIcon name="reading" size={16} />
                            <p className="text-slate-400 font-bold">请先选择一个课程标准</p>
                            <p className="text-xs text-slate-300">章节结构按课程标准分开管理</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
