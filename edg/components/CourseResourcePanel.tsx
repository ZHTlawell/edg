import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus, Trash2, Edit3, ChevronRight, ChevronDown, BookOpen,
    Upload, Video, FileText, Music, File, X, Download, Eye,
    Send, RotateCcw, Link2, Tag
} from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Resource {
    id: string;
    title: string;
    type: 'VIDEO' | 'PPT' | 'PDF' | 'AUDIO' | 'OTHER';
    url: string;
    file_name?: string;
    file_size?: number;
    description?: string;
    status: string;
    standard_id?: string;
    createdAt: string;
}

interface LessonResource { id: string; sort_order: number; resource: Resource; }
interface Lesson { id: string; title: string; sort_order: number; duration?: number; resources: LessonResource[]; }
interface Chapter { id: string; title: string; sort_order: number; lessons: Lesson[]; }

// 仅保留两大类：文档资源（PDF/PPT）与 视频资源（VIDEO/AUDIO/其他）
export const TYPE_CONFIG = {
    DOCUMENT: { label: '文档资源', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    VIDEO: { label: '视频资源', icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    // 兼容旧 type 值
    PPT: { label: '文档资源', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    PDF: { label: '文档资源', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    AUDIO: { label: '视频资源', icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    OTHER: { label: '视频资源', icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
};

// 将后端 type 映射到两大宏分类
export const macroType = (t: string): 'DOCUMENT' | 'VIDEO' => {
    if (t === 'PDF' || t === 'PPT' || t === 'DOC' || t === 'DOCX' || t === 'DOCUMENT') return 'DOCUMENT';
    return 'VIDEO';
};

export const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    return bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
};

// ─── Resource Preview Modal ───────────────────────────────────────────────────
export const PreviewModal: React.FC<{ resource: Resource; onClose: () => void }> = ({ resource, onClose }) => {
    const base = 'http://localhost:3001';
    const url = resource.url.startsWith('/') ? `${base}${resource.url}` : resource.url;
    return (
        <div className="fixed inset-0 z-[500] bg-black/75 flex items-center justify-center p-6" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
                    <div>
                        <p className="font-bold text-slate-800">{resource.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{resource.file_name} · {formatSize(resource.file_size)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><ElmIcon name="close" size={16} /></button>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-900 flex items-center justify-center min-h-[300px]">
                    {resource.type === 'VIDEO' && <video controls className="max-h-full max-w-full" src={url} />}
                    {resource.type === 'PDF' && <iframe src={url} className="w-full h-full" title={resource.title} style={{ minHeight: '60vh' }} />}
                    {resource.type === 'AUDIO' && (
                        <div className="flex flex-col items-center gap-6 p-10">
                            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center"><Music size={40} className="text-purple-500" /></div>
                            <audio controls src={url} className="w-72" />
                        </div>
                    )}
                    {(resource.type === 'PPT' || resource.type === 'OTHER') && (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <ElmIcon name="document" size={16} />
                            <p className="text-white font-bold">{resource.type === 'PPT' ? 'PPT 无法直接预览，请下载后打开' : '附件文件'}</p>
                            <a href={url} download={resource.file_name} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl">
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
export const ResourceUploadModal: React.FC<{
    standardId: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ standardId, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [urlValue, setUrlValue] = useState('');
    const [urlType, setUrlType] = useState('VIDEO');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { addToast } = useStore();
    const fileRef = useRef<HTMLInputElement>(null);

    const onFile = (f: File) => { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); };

    const submit = async () => {
        if (!title.trim()) { addToast('请填写资源标题', 'error'); return; }
        setUploading(true);
        try {
            if (mode === 'url') {
                await api.post('/api/course-resource/url', { title, description, type: urlType, url: urlValue, standard_id: standardId });
            } else {
                if (!file) { addToast('请选择文件', 'error'); return; }
                const fd = new FormData();
                fd.append('file', file); fd.append('title', title);
                if (description) fd.append('description', description);
                fd.append('standard_id', standardId);
                const token = localStorage.getItem('token');
                await api.post('/api/course-resource/upload', fd, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    },
                    onUploadProgress: p => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                });
            }
            addToast('上传成功', 'success'); onSuccess(); onClose();
        } catch (e: any) { addToast(e.response?.data?.message || '上传失败', 'error'); }
        finally { setUploading(false); setProgress(0); }
    };

    return (
        <div className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-5 border-b">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Upload size={16} className="text-indigo-500" />上传资源</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><ElmIcon name="close" size={16} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-fit">
                        {[['file', '文件上传'], ['url', '外链地址']].map(([k, l]) => (
                            <button key={k} onClick={() => setMode(k as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{l}</button>
                        ))}
                    </div>
                    {mode === 'file' ? (
                        <div onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }} onDragOver={e => e.preventDefault()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${file ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                            onClick={() => fileRef.current?.click()}>
                            <input ref={fileRef} type="file" className="hidden"
                                accept=".mp4,.avi,.mov,.webm,.pptx,.ppt,.pdf,.mp3,.ogg,.wav,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                            {file ? (
                                <div className="space-y-1">
                                    <File size={28} className="mx-auto text-indigo-400" />
                                    <p className="font-bold text-slate-700 text-sm">{file.name}</p>
                                    <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Upload size={28} className="mx-auto text-slate-300" />
                                    <p className="text-slate-400 text-sm">点击选择 / 拖拽文件</p>
                                    <p className="text-xs text-slate-300">MP4 / PPTX / PDF / MP3 ···  最大500MB</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <select value={urlType} onChange={e => setUrlType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <input type="url" placeholder="https://..." value={urlValue} onChange={e => setUrlValue(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                        </div>
                    )}
                    <input type="text" placeholder="资源标题 *" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    <input type="text" placeholder="说明（可选）" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    {uploading && (
                        <div className="space-y-1">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 text-center">{progress < 100 ? `${progress}%` : '处理中...'}</p>
                        </div>
                    )}
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button onClick={submit} disabled={uploading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                        {uploading ? '上传中...' : '确认上传'}
                    </button>
                    <button onClick={onClose} disabled={uploading} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm">取消</button>
                </div>
            </div>
        </div>
    );
};

// ─── Chapter Tree ─────────────────────────────────────────────────────────────
export const CourseChapterTree: React.FC<{ standardId: string }> = ({ standardId }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [newChTitle, setNewChTitle] = useState('');
    const [editCh, setEditCh] = useState<{ id: string; title: string } | null>(null);
    const [newLsn, setNewLsn] = useState<{ chapterId: string; title: string } | null>(null);
    const [editLsn, setEditLsn] = useState<{ id: string; title: string } | null>(null);
    const [picking, setPicking] = useState<string | null>(null); // lessonId
    const [preview, setPreview] = useState<Resource | null>(null);
    const [openTypeGroups, setOpenTypeGroups] = useState<Set<string>>(new Set());
    const toggleTypeGroup = (t: string) => setOpenTypeGroups(prev => {
        const n = new Set(prev);
        n.has(t) ? n.delete(t) : n.add(t);
        return n;
    });
    const [showUpload, setShowUpload] = useState(false);
    const { addToast } = useStore();

    const load = useCallback(async () => {
        const [ch, rs] = await Promise.all([
            api.get(`/api/course-resource/chapters?standard_id=${standardId}`),
            api.get(`/api/course-resource/resources?standard_id=${standardId}`),
        ]);
        setChapters(ch.data);
        setResources(rs.data);
    }, [standardId]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const addCh = async () => {
        if (!newChTitle.trim()) return;
        await api.post('/api/course-resource/chapters', { standard_id: standardId, title: newChTitle, sort_order: chapters.length });
        setNewChTitle(''); load();
    };
    const delCh = async (id: string) => {
        if (!window.confirm('确认删除章节及所有课时？')) return;
        await api.delete(`/api/course-resource/chapters/${id}`); load();
    };
    const addLsn = async () => {
        if (!newLsn?.title.trim()) return;
        const ch = chapters.find(c => c.id === newLsn.chapterId);
        await api.post('/api/course-resource/lessons', { chapter_id: newLsn.chapterId, title: newLsn.title, sort_order: ch?.lessons?.length || 0 });
        setNewLsn(null); load();
    };
    const delLsn = async (id: string) => { await api.delete(`/api/course-resource/lessons/${id}`); load(); };
    const linkRes = async (lesson_id: string, resource_id: string) => {
        try { await api.post(`/api/course-resource/lessons/${lesson_id}/resources`, { resource_id }); addToast('已关联', 'success'); }
        catch { addToast('已关联过此资源', 'error'); }
        setPicking(null); load();
    };
    const unlinkRes = async (lesson_id: string, resource_id: string) => {
        await api.delete(`/api/course-resource/lessons/${lesson_id}/resources/${resource_id}`); load();
    };

    return (
        <div className="space-y-4">
            {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}
            {showUpload && <ResourceUploadModal standardId={standardId} onClose={() => setShowUpload(false)} onSuccess={load} />}

            {/* Resource list */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-600">资源文件 <span className="text-slate-400 font-normal">({resources.length})</span></p>
                <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all">
                    <ElmIcon name="plus" size={16} />上传资源
                </button>
            </div>
            {resources.length > 0 && (
                <div className="space-y-2">
                    {(() => {
                        // 仅展示两类宏分组：文档资源 / 视频资源
                        const order: ('DOCUMENT' | 'VIDEO')[] = ['DOCUMENT', 'VIDEO'];
                        const grouped = resources.reduce((acc: Record<string, Resource[]>, r) => {
                            const key = macroType(r.type);
                            (acc[key] = acc[key] || []).push(r);
                            return acc;
                        }, {});
                        const statusCls: Record<string, string> = { DRAFT: 'bg-slate-100 text-slate-500', PUBLISHED: 'bg-emerald-50 text-emerald-600', WITHDRAWN: 'bg-red-50 text-red-400' };
                        const statusLabel: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', WITHDRAWN: '已下架' };
                        return order.filter(t => grouped[t]?.length).map(type => {
                            const tc = (TYPE_CONFIG as any)[type];
                            const Icon = tc.icon;
                            const list = grouped[type];
                            const isOpen = openTypeGroups.has(type);
                            return (
                                <div key={type} className={`rounded-xl border ${tc.border} overflow-hidden`}>
                                    <button
                                        onClick={() => toggleTypeGroup(type)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 ${tc.bg} hover:brightness-95 transition-all`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0"><Icon size={16} className={tc.color} /></div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-bold ${tc.color}`}>{tc.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{list.length} 个资源</p>
                                        </div>
                                        <ElmIcon name={isOpen ? 'arrow-down' : 'arrow-right'} size={16} className="text-slate-400" />
                                    </button>
                                    {isOpen && (
                                        <div className="divide-y divide-slate-50 bg-white">
                                            {list.map(r => (
                                                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0"><Icon size={14} className={tc.color} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-700 truncate">{r.title}</p>
                                                        <p className="text-[10px] text-slate-400">{formatSize(r.file_size)}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${statusCls[r.status] || statusCls.DRAFT}`}>{statusLabel[r.status] || '草稿'}</span>
                                                    <button onClick={() => setPreview(r)} className="p-1.5 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Eye size={14} className="text-slate-400" /></button>
                                                    {r.status === 'DRAFT' && (
                                                        <button onClick={() => api.post(`/api/course-resource/resources/${r.id}/publish`).then(load)} className="p-1.5 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                            <Send size={14} className="text-emerald-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}
            {resources.length === 0 && (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Upload size={28} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-sm text-slate-300">暂无资源，点击上方「上传资源」添加</p>
                </div>
            )}

            <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-600 mb-3">章节结构</p>
                <div className="space-y-3">
                    {chapters.map(ch => (
                        <div key={ch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors group/ch"
                                onClick={() => toggle(ch.id)}>
                                {expanded.has(ch.id) ? <ElmIcon name="arrow-down" size={16} /> : <ElmIcon name="arrow-right" size={16} />}
                                <ElmIcon name="reading" size={16} />
                                {editCh?.id === ch.id ? (
                                    <input autoFocus value={editCh.title} onClick={e => e.stopPropagation()}
                                        onChange={e => setEditCh({ id: ch.id, title: e.target.value })}
                                        onBlur={async () => { await api.put(`/api/course-resource/chapters/${ch.id}`, { title: editCh.title }); setEditCh(null); load(); }}
                                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                        className="flex-1 bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-sm outline-none" />
                                ) : (
                                    <span className="flex-1 font-bold text-slate-700 text-sm">{ch.title}</span>
                                )}
                                <span className="text-xs text-slate-400">{ch.lessons.length}节</span>
                                <div className="flex gap-1 opacity-0 group-hover/ch:opacity-100" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setEditCh({ id: ch.id, title: ch.title })} className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={12} /></button>
                                    <button onClick={() => delCh(ch.id)} className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                            </div>
                            {expanded.has(ch.id) && (
                                <div className="divide-y divide-slate-50">
                                    {ch.lessons.map((ls, i) => (
                                        <div key={ls.id} className="group/ls px-4 py-3 hover:bg-slate-50/50">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                                {editLsn?.id === ls.id ? (
                                                    <input autoFocus value={editLsn.title}
                                                        onChange={e => setEditLsn({ id: ls.id, title: e.target.value })}
                                                        onBlur={async () => { await api.put(`/api/course-resource/lessons/${ls.id}`, { title: editLsn.title }); setEditLsn(null); load(); }}
                                                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                                        className="flex-1 bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-sm outline-none" />
                                                ) : (
                                                    <span className="flex-1 text-sm font-bold text-slate-700">{ls.title}</span>
                                                )}
                                                <div className="flex gap-1 opacity-0 group-hover/ls:opacity-100 transition-opacity">
                                                    <button onClick={() => setPicking(ls.id)} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg"><Link2 size={10} />关联</button>
                                                    <button onClick={() => setEditLsn({ id: ls.id, title: ls.title })} className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={12} /></button>
                                                    <button onClick={() => delLsn(ls.id)} className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                            {ls.resources.length > 0 && (
                                                <div className="ml-7 mt-1.5 space-y-1">
                                                    {ls.resources.map(lr => {
                                                        const tc = (TYPE_CONFIG as any)[lr.resource.type] || TYPE_CONFIG.OTHER;
                                                        const Icon = tc.icon;
                                                        return (
                                                            <div key={lr.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${tc.bg} ${tc.border} group/res`}>
                                                                <Icon size={11} className={tc.color} />
                                                                <span className="text-[11px] font-medium text-slate-600 flex-1 truncate">{lr.resource.title}</span>
                                                                <button onClick={() => setPreview(lr.resource)} className="opacity-0 group-hover/res:opacity-100 p-0.5 hover:text-indigo-500"><Eye size={10} className="text-slate-300" /></button>
                                                                <button onClick={() => unlinkRes(ls.id, lr.resource.id)} className="opacity-0 group-hover/res:opacity-100 p-0.5 hover:text-red-500"><ElmIcon name="close" size={16} /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {newLsn?.chapterId === ch.id ? (
                                        <div className="px-4 py-2.5 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 text-[10px] flex items-center justify-center flex-shrink-0">+</span>
                                            <input autoFocus value={newLsn.title} onChange={e => setNewLsn({ ...newLsn, title: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') addLsn(); if (e.key === 'Escape') setNewLsn(null); }}
                                                placeholder="课时名称，Enter 确认" className="flex-1 bg-slate-50 border border-indigo-200 rounded-lg px-2 py-1 text-sm outline-none" />
                                            <button onClick={addLsn} className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">确认</button>
                                            <button onClick={() => setNewLsn(null)} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">取消</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setNewLsn({ chapterId: ch.id, title: '' })} className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 text-sm transition-all">
                                            <ElmIcon name="plus" size={16} />添加课时
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <input type="text" value={newChTitle} onChange={e => setNewChTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCh()}
                            placeholder="新章节名称..." className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                        <button onClick={addCh} disabled={!newChTitle.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-40">
                            <ElmIcon name="plus" size={16} />添加章节
                        </button>
                    </div>
                </div>
            </div>

            {/* Resource picker */}
            {picking && (
                <div className="fixed inset-0 z-[450] bg-black/40 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[60vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <p className="font-bold text-slate-700 text-sm">选择资源关联到此课时</p>
                            <button onClick={() => setPicking(null)} className="p-1.5 hover:bg-slate-100 rounded-xl"><ElmIcon name="close" size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2">
                            {resources.map(r => {
                                const tc = (TYPE_CONFIG as any)[r.type] || TYPE_CONFIG.OTHER;
                                const Icon = tc.icon;
                                return (
                                    <button key={r.id} onClick={() => linkRes(picking, r.id)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors rounded-xl text-left">
                                        <div className={`w-8 h-8 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}><Icon size={16} className={tc.color} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{r.title}</p>
                                            <p className="text-xs text-slate-400">{tc.label}</p>
                                        </div>
                                    </button>
                                );
                            })}
                            {resources.length === 0 && <p className="text-center text-slate-300 py-6 text-sm">请先上传资源</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
