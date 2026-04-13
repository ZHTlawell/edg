import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    BookOpen, Plus, Search, Edit3, Eye, CheckCircle2, XCircle,
    ChevronRight, Building2, Globe, Tag, Clock, Users2, ArrowLeft,
    Upload, Image, X, BookMarked, Layers, Settings, RotateCcw,
    AlertTriangle, Shield, History, Folder
} from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';
import { CourseChapterTree } from './CourseResourcePanel';
import { QuizPaperManager } from './QuizPaperManager';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; description?: string; sort_order: number; status: string; _count?: { standards: number }; }
interface Campus { id: string; name: string; address?: string; }
interface CampusLink { campus_id: string; }
interface Template { teaching_goal?: string; stage_desc?: string; default_fee_ref?: number; notes?: string; }
interface Version { id: string; version: number; change_note?: string; createdAt: string; snapshot: string; }
interface Standard {
    id: string; code: string; name: string; category_id: string;
    category: Category;
    age_min?: number; age_max?: number; description?: string;
    total_lessons: number; lesson_duration: number;
    suggested_cycle?: string; suggested_capacity: number;
    cover_url?: string; status: string; version: number;
    campuses: CampusLink[]; templates: Template[]; versions?: Version[];
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: '草稿', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    ENABLED: { label: '已启用', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    DISABLED: { label: '已停用', cls: 'bg-red-50 text-red-400 border-red-200' },
};
const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
    return <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>;
};

const CAT_GRADIENTS = [
    'from-indigo-400 to-purple-500', 'from-orange-400 to-red-500', 'from-emerald-400 to-teal-500',
    'from-blue-400 to-cyan-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500',
];

const DEFAULT_FORM = {
    code: '', name: '', category_id: '', age_min: '', age_max: '',
    description: '', total_lessons: '', lesson_duration: '45',
    suggested_cycle: '', suggested_capacity: '20', campus_ids: [] as string[],
    cover_url: '',
};

// ─── Cover Image Uploader ─────────────────────────────────────────────────────
const CoverUploader: React.FC<{
    value: string;
    onChange: (url: string) => void;
    gradient: string;
}> = ({ value, onChange, gradient }) => {
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const { addToast } = useStore();

    const upload = async (file: File) => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('title', 'cover-' + file.name);
            fd.append('type', 'OTHER');
            const token = localStorage.getItem('token');
            const res = await api.post('/api/course-resource/upload', fd, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });
            onChange(res.data.url);
        } catch (err: any) {
            console.error('Upload Error:', err);
            addToast(`上传失败: ${err.message || '未知错误'}`, 'error');
        } finally { setLoading(false); }
    };

    return (
        <div
            onClick={() => ref.current?.click()}
            className={`relative w-full h-36 rounded-2xl overflow-hidden cursor-pointer group border-2 border-dashed transition-all ${value ? 'border-transparent' : 'border-slate-200 hover:border-indigo-200'}`}
        >
            <input ref={ref} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.gif,.jdg,.heic"
                onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            {value ? (
                <>
                    <img src={`http://localhost:3001${value}`} alt="封面" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white font-bold text-sm"><Image size={16} />更换封面</div>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ElmIcon name="close" size={16} />
                    </button>
                </>
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Image size={20} className="text-white" /></div>
                            <p className="text-white/90 text-xs font-bold">点击上传课程封面</p>
                            <p className="text-white/60 text-[10px]">JPG / PNG / WEBP</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Category Manager ─────────────────────────────────────────────────────────
const CategoryManager: React.FC<{ categories: Category[]; onRefresh: () => void }> = ({ categories, onRefresh }) => {
    const [form, setForm] = useState({ name: '', description: '' });
    const [editing, setEditing] = useState<Category | null>(null);
    const { addToast } = useStore();

    const DEFAULT_CATS = [
        { name: '美术类', description: '绘画、书法、陶艺等', status: 'ENABLED' },
        { name: '舞蹈类', description: '中国舞、芭蕾、街舞等', status: 'ENABLED' },
        { name: '音乐类', description: '声乐、钢琴、吉他等', status: 'ENABLED' },
        { name: '体育类', description: '篮球、游泳、武术等', status: 'ENABLED' },
        { name: '编程类', description: '少儿编程、机器人等', status: 'ENABLED' },
        { name: '语言类', description: '英语、普通话等语言课', status: 'ENABLED' },
        { name: '其他', description: '不属于以上分类的课程', status: 'ENABLED' },
    ];

    const save = async () => {
        if (!form.name.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: token ? `Bearer ${token}` : '' };
            if (editing) {
                await api.put(`/api/course-standards/categories/${editing.id}`, form, { headers });
                addToast('已更新', 'success');
            } else {
                await api.post('/api/course-standards/categories', { ...form, sort_order: categories.length }, { headers });
                addToast('已创建', 'success');
            }
            setForm({ name: '', description: '' }); setEditing(null); onRefresh();
        } catch (e: any) { addToast(e.response?.data?.message || '操作失败', 'error'); }
    };

    const seedDefaults = async () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: token ? `Bearer ${token}` : '' };
        for (let i = 0; i < DEFAULT_CATS.length; i++) {
            try { await api.post('/api/course-standards/categories', { ...DEFAULT_CATS[i], sort_order: i }, { headers }); } catch { /**/ }
        }
        onRefresh(); addToast('默认分类已创建', 'success');
    };

    return (
        <div className="space-y-4">
            {categories.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <ElmIcon name="warning" size={16} />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-700">暂无分类</p>
                        <p className="text-xs text-amber-500">点击右侧按钮初始化默认分类</p>
                    </div>
                    <button onClick={seedDefaults} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">一键初始化</button>
                </div>
            )}
            <div className="space-y-2">
                {categories.map((cat, i) => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${CAT_GRADIENTS[i % CAT_GRADIENTS.length]} flex items-center justify-center`}>
                            <Folder size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-700 text-sm">{cat.name}</p>
                            {cat.description && <p className="text-xs text-slate-400 truncate">{cat.description}</p>}
                        </div>
                        <span className="text-xs text-slate-300">{cat._count?.standards || 0}个标准</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '' }); }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={13} /></button>
                            <button onClick={() => api.put(`/api/course-standards/categories/${cat.id}`, { status: cat.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' }).then(onRefresh)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500">
                                {cat.status === 'ENABLED' ? <XCircle size={13} /> : <ElmIcon name="circle-check" size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-600">{editing ? '编辑分类' : '新增分类'}</p>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="分类名称 *" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="说明（可选）" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                <div className="flex gap-2">
                    <button onClick={save} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl">{editing ? '保存修改' : '添加分类'}</button>
                    {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); }} className="px-4 py-2 bg-slate-200 text-slate-600 font-bold text-sm rounded-xl">取消</button>}
                </div>
            </div>
        </div>
    );
};

// ─── Standard Form ────────────────────────────────────────────────────────────
const StandardForm: React.FC<{
    categories: Category[]; campuses: Campus[];
    editing: Standard | null;
    onBack: () => void; onSuccess: () => void;
}> = ({ categories, campuses, editing, onBack, onSuccess }) => {
    const [form, setForm] = useState(editing ? {
        code: editing.code, name: editing.name, category_id: editing.category_id,
        age_min: String(editing.age_min || ''), age_max: String(editing.age_max || ''),
        description: editing.description || '', total_lessons: String(editing.total_lessons),
        lesson_duration: String(editing.lesson_duration), suggested_cycle: editing.suggested_cycle || '',
        suggested_capacity: String(editing.suggested_capacity), cover_url: editing.cover_url || '',
        campus_ids: (editing.campuses || []).map(c => c.campus_id),
    } : { ...DEFAULT_FORM });
    const [saving, setSaving] = useState(false);
    const { addToast } = useStore();

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const toggleCampus = (id: string) => {
        if (id === 'ALL') {
            set('campus_ids', form.campus_ids.includes('ALL') ? [] : ['ALL']);
        } else {
            if (form.campus_ids.includes('ALL')) return;
            set('campus_ids', form.campus_ids.includes(id) ? form.campus_ids.filter(x => x !== id) : [...form.campus_ids, id]);
        }
    };

    const submit = async () => {
        // More specific validation to help the user identify the missing field
        if (!form.code) { addToast('请输入课程编号', 'warning'); return; }
        if (!form.name) { addToast('请输入课程名称', 'warning'); return; }
        if (!form.category_id) { addToast('请选择课程分类', 'warning'); return; }
        if (!form.total_lessons || Number(form.total_lessons) <= 0) { addToast('请输入有效的总学时', 'warning'); return; }

        setSaving(true);
        const payload = {
            code: form.code, name: form.name, category_id: form.category_id,
            age_min: form.age_min ? Number(form.age_min) : undefined,
            age_max: form.age_max ? Number(form.age_max) : undefined,
            description: form.description || undefined,
            total_lessons: Number(form.total_lessons),
            lesson_duration: Number(form.lesson_duration) || 45,
            suggested_cycle: form.suggested_cycle || undefined,
            suggested_capacity: Number(form.suggested_capacity) || 20,
            cover_url: form.cover_url || undefined,
            campus_ids: form.campus_ids,
        };
        try {
            if (editing) { await api.put(`/api/course-standards/standards/${editing.id}`, payload); addToast('课程标准已更新', 'success'); }
            else { await api.post('/api/course-standards/standards', payload); addToast('课程标准已创建', 'success'); }
            onSuccess(); onBack();
        } catch (e: any) { addToast(e.response?.data?.message || '保存失败', 'error'); }
        finally { setSaving(false); }
    };

    const catIdx = categories.findIndex(c => c.id === form.category_id);
    const gradient = CAT_GRADIENTS[catIdx >= 0 ? catIdx % CAT_GRADIENTS.length : 0];

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ArrowLeft size={20} className="text-slate-500" /></button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{editing ? '编辑课程标准' : '新建课程标准'}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">填写课程基本信息，设置课时规则和封面，并配置适用校区</p>
                </div>
            </div>

            {/* Cover */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Image size={15} className="text-indigo-500" />课程封面</p>
                <CoverUploader value={form.cover_url} onChange={v => set('cover_url', v)} gradient={gradient} />
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Tag size={15} className="text-indigo-500" />基本信息</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">课程编号 *</label>
                        <input value={form.code} onChange={e => set('code', e.target.value)} disabled={!!editing}
                            placeholder="如: ART-001" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">课程名称 *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="如: 儿童素描基础班" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">课程分类 *</label>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.filter(c => c.status === 'ENABLED').length > 0 ? categories.filter(c => c.status === 'ENABLED').map((cat, i) => (
                            <div key={cat.id} onClick={() => set('category_id', cat.id)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all select-none ${form.category_id === cat.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-100'}`}>
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${CAT_GRADIENTS[i % CAT_GRADIENTS.length]} flex items-center justify-center flex-shrink-0`}>
                                    <Folder size={11} className="text-white" />
                                </div>
                                <span className={`text-xs font-bold truncate ${form.category_id === cat.id ? 'text-indigo-600' : 'text-slate-600'}`}>{cat.name}</span>
                            </div>
                        )) : (
                            <div className="col-span-3 py-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center gap-1">
                                <ElmIcon name="warning" size={16} />
                                无可用分类，请前往「分类管理」启用或新建
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">适龄范围</label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={form.age_min} onChange={e => set('age_min', e.target.value)} placeholder="最小" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                            <span className="text-slate-300 text-sm">—</span>
                            <input type="number" value={form.age_max} onChange={e => set('age_max', e.target.value)} placeholder="最大" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">建议上课周期</label>
                        <input value={form.suggested_cycle} onChange={e => set('suggested_cycle', e.target.value)} placeholder="如：每周2次" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">课程简介</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                        placeholder="描述课程目标、特色、适合人群..." className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none" />
                </div>
            </div>

            {/* Lesson Rules */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><ElmIcon name="clock" size={16} />课时规则</p>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: '总学时 *', key: 'total_lessons', placeholder: '如: 24', unit: '课时' },
                        { label: '单课时长', key: 'lesson_duration', placeholder: '45', unit: '分钟' },
                        { label: '建议班容', key: 'suggested_capacity', placeholder: '20', unit: '人' },
                    ].map(({ label, key, placeholder, unit }) => (
                        <div key={key}>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
                            <div className="relative">
                                <input type="number" value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none pr-10" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300">{unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Campus */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><ElmIcon name="house" size={16} />适用校区</p>
                    <p className="text-xs text-slate-400 mt-0.5">选择后，对应校区才能看到并引用此课程标准</p>
                </div>
                <div onClick={() => toggleCampus('ALL')}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${form.campus_ids.includes('ALL') ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.campus_ids.includes('ALL') ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {form.campus_ids.includes('ALL') && <ElmIcon name="circle-check" size={16} />}
                    </div>
                    <ElmIcon name="location" size={16} />
                    <span className={`text-xs font-bold ${form.campus_ids.includes('ALL') ? 'text-indigo-600' : 'text-slate-500'}`}>全部校区（通用）</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {(campuses || []).map(c => {
                        const all = form.campus_ids.includes('ALL');
                        const sel = form.campus_ids.includes(c.id);
                        return (
                            <div key={c.id} onClick={() => { if (!all) toggleCampus(c.id); }}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all select-none ${all ? 'opacity-40 cursor-not-allowed bg-white border-slate-100' : sel ? 'bg-indigo-50 border-indigo-200 cursor-pointer' : 'bg-white border-slate-100 hover:border-indigo-100 cursor-pointer'}`}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${(all || sel) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {(all || sel) && <ElmIcon name="circle-check" size={16} />}
                                </div>
                                <span className={`text-xs font-bold ${(all || sel) ? 'text-indigo-600' : 'text-slate-500'}`}>{c.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-3 pb-6">
                <button onClick={submit} disabled={saving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all">
                    {saving ? '保存中...' : (editing ? '保存修改' : '创建课程标准')}
                </button>
                <button onClick={onBack} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">取消</button>
            </div>
        </div>
    );
};

// ─── Standard Detail ──────────────────────────────────────────────────────────
const StandardDetail: React.FC<{
    standard: Standard; categories: Category[];
    onBack: () => void; onEdit: () => void; onRefresh: () => void;
}> = ({ standard, categories, onBack, onEdit, onRefresh }) => {
    const [tab, setTab] = useState<'info' | 'resources' | 'quizzes' | 'campus' | 'versions'>('info');
    const [versions, setVersions] = useState<Version[]>([]);
    const { addToast } = useStore();

    useEffect(() => {
        if (tab === 'versions') api.get(`/api/course-standards/standards/${standard.id}/versions`).then(r => setVersions(r.data));
    }, [tab, standard.id]);

    const enable = async () => {
        try { await api.post(`/api/course-standards/standards/${standard.id}/enable`); addToast('已启用', 'success'); onRefresh(); }
        catch (e: any) { addToast(e.response?.data?.message || '操作失败', 'error'); }
    };
    const disable = async () => {
        if (!window.confirm('停用后校区将无法引用此标准，确认继续？')) return;
        await api.post(`/api/course-standards/standards/${standard.id}/disable`); onRefresh();
    };

    const catIdx = categories.findIndex(c => c.id === standard.category_id);
    const gradient = CAT_GRADIENTS[catIdx >= 0 ? catIdx % CAT_GRADIENTS.length : 0];

    const TABS = [
        { id: 'info', label: '基本信息', icon: Tag },
        { id: 'resources', label: '课程资源', icon: Layers },
        { id: 'quizzes', label: '测验题库', icon: BookMarked },
        { id: 'campus', label: '适用校区', icon: Building2 },
        { id: 'versions', label: '版本历史', icon: History },
    ];

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Header card with cover */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
                    {standard.cover_url && (
                        <img src={`http://localhost:3001${standard.cover_url}`} alt={standard.name}
                            className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-all">
                        <ArrowLeft size={14} />返回列表
                    </button>
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white/70 text-xs font-mono">{standard.code}</span>
                                <StatusBadge status={standard.status} />
                                <span className="text-white/60 text-[10px] bg-white/10 px-1.5 py-0.5 rounded">v{standard.version}</span>
                            </div>
                            <h1 className="text-xl font-extrabold text-white">{standard.name}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-all">
                                <Edit3 size={13} />编辑
                            </button>
                            {standard.status !== 'ENABLED' ? (
                                <button onClick={enable} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/80 backdrop-blur text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all">
                                    <ElmIcon name="circle-check" size={16} />启用
                                </button>
                            ) : (
                                <button onClick={disable} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur text-white text-xs font-bold rounded-xl hover:bg-black/40 transition-all">
                                    <XCircle size={13} />停用
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-slate-100 px-2">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-bold transition-all border-b-2 -mb-px ${tab === t.id ? 'text-indigo-600 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                            <t.icon size={15} />{t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                {tab === 'info' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: '总学时', value: `${standard.total_lessons} 课时`, icon: BookOpen, color: 'text-indigo-600' },
                                { label: '单次课时', value: `${standard.lesson_duration} 分钟`, icon: Clock, color: 'text-orange-600' },
                                { label: '建议班容', value: `${standard.suggested_capacity} 人`, icon: Users2, color: 'text-emerald-600' },
                                { label: '适龄范围', value: standard.age_min ? `${standard.age_min}~${standard.age_max}岁` : '不限', icon: Shield, color: 'text-purple-600' },
                            ].map(item => (
                                <div key={item.label} className="bg-slate-50 rounded-2xl p-4">
                                    <item.icon size={18} className={`${item.color} mb-2`} />
                                    <p className="text-2xl font-extrabold text-slate-800">{item.value}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        {standard.description && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">课程简介</p>
                                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4">{standard.description}</p>
                            </div>
                        )}
                        {standard.suggested_cycle && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <ElmIcon name="clock" size={16} />
                                <span className="font-medium">建议上课周期：</span><span>{standard.suggested_cycle}</span>
                            </div>
                        )}
                        {standard.templates?.[0] && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">教学目标</p>
                                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4">{standard.templates[0].teaching_goal}</p>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'resources' && <CourseChapterTree standardId={standard.id} />}
                {tab === 'quizzes' && <QuizPaperManager standardId={standard.id} />}

                {tab === 'campus' && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-400 mb-4">以下校区已获授权，可引用此课程标准开设课程</p>
                        {standard.campuses.length === 0 ? (
                            <div className="py-10 text-center text-slate-300 space-y-2">
                                <ElmIcon name="house" size={16} />
                                <p>尚未配置适用校区，请点击「编辑」进行设置</p>
                            </div>
                        ) : standard.campuses.some(c => c.campus_id === 'ALL') ? (
                            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <ElmIcon name="location" size={16} />
                                <div>
                                    <p className="font-bold text-indigo-700">全部校区通用</p>
                                    <p className="text-xs text-indigo-400">所有已注册校区均可使用此标准</p>
                                </div>
                            </div>
                        ) : (
                            (standard.campuses || []).map(c => (
                                <div key={c.campus_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><ElmIcon name="house" size={16} /></div>
                                    <span className="text-sm font-bold text-slate-700">{c.campus_id}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {tab === 'versions' && (
                    <div className="space-y-3">
                        {versions.map(v => (
                            <div key={v.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 font-extrabold text-slate-600">v{v.version}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700 text-sm">{v.change_note || '规则变更'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(v.createdAt).toLocaleString('zh-CN')}</p>
                                </div>
                            </div>
                        ))}
                        {versions.length === 0 && <p className="text-center text-slate-300 py-6 text-sm">暂无版本记录</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CourseStandardMgmt: React.FC = () => {
    const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
    const [standards, setStandards] = useState<Standard[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [selected, setSelected] = useState<Standard | null>(null);
    const [editing, setEditing] = useState<Standard | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [showCatMgr, setShowCatMgr] = useState(false);
    const { addToast } = useStore();

    const load = useCallback(async () => {
        const [sRes, cRes, campRes] = await Promise.all([
            api.get('/api/course-standards/standards'),
            api.get('/api/course-standards/categories'),
            api.get('/api/users/campuses').catch(() => ({ data: [] })),
        ]);
        setStandards(sRes.data);
        const cats: Category[] = cRes.data;
        setCategories(cats);
        setCampuses(campRes.data);

        if (cats.length === 0) {
            // Remove automatic background seeding to prevent race conditions and 401 cascades.
            // Users can now use the "One-click Init" button in the Category Manager.
        }
    }, [addToast]);

    useEffect(() => { load(); }, [load]);

    const refreshSelected = async () => {
        if (selected) {
            const r = await api.get(`/api/course-standards/standards/${selected.id}`);
            setSelected(r.data);
        }
        load();
    };

    const filtered = useMemo(() => standards.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchCat = filterCat === 'all' || s.category_id === filterCat;
        return matchSearch && matchStatus && matchCat;
    }), [standards, search, filterStatus, filterCat]);

    const stats = { total: standards.length, enabled: standards.filter(s => s.status === 'ENABLED').length, draft: standards.filter(s => s.status === 'DRAFT').length };

    if (view === 'form') {
        return <div className="animate-in fade-in duration-300">
            <StandardForm categories={categories} campuses={campuses} editing={editing}
                onBack={() => { setView('list'); setEditing(null); }} onSuccess={load} />
        </div>;
    }

    if (view === 'detail' && selected) {
        return <StandardDetail standard={selected} categories={categories}
            onBack={() => { setView('list'); setSelected(null); }}
            onEdit={() => { setEditing(selected); setView('form'); }}
            onRefresh={refreshSelected} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Category Manager Drawer */}
            {showCatMgr && (
                <div className="fixed inset-0 z-[300] bg-black/30" onClick={() => setShowCatMgr(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Folder size={18} className="text-indigo-500" />分类管理</h3>
                            <button onClick={() => setShowCatMgr(false)} className="p-2 hover:bg-slate-100 rounded-xl"><ElmIcon name="close" size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <CategoryManager categories={categories} onRefresh={load} />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BookMarked className="text-indigo-600" />课程中心</h1>
                    <p className="text-slate-400 text-sm mt-1">制定课程标准、上传教学资源、统一下发各校区</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowCatMgr(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-all shadow-sm">
                        <Settings size={16} />分类管理
                    </button>
                    <button onClick={() => { setEditing(null); setView('form'); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
                        <ElmIcon name="plus" size={16} />新建课程
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: '全部课程', value: stats.total, color: 'text-slate-800', bg: 'bg-white' },
                    { label: '已启用', value: stats.enabled, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: '草稿中', value: stats.draft, color: 'text-slate-500', bg: 'bg-slate-50' },
                ].map(item => (
                    <div key={item.label} className={`${item.bg} rounded-2xl border border-slate-100 p-5 shadow-sm`}>
                        <p className="text-xs font-medium text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <ElmIcon name="search" size={16} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索课程名称/编号..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer">
                    <option value="all">全部状态</option>
                    <option value="DRAFT">草稿</option>
                    <option value="ENABLED">已启用</option>
                    <option value="DISABLED">已停用</option>
                </select>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer">
                    <option value="all">所有分类</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((std, i) => {
                    const catIdx = categories.findIndex(c => c.id === std.category_id);
                    const grad = CAT_GRADIENTS[catIdx >= 0 ? catIdx % CAT_GRADIENTS.length : i % CAT_GRADIENTS.length];
                    return (
                        <div key={std.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                            onClick={() => { setSelected(std); setView('detail'); }}>
                            <div className={`relative h-28 bg-gradient-to-br ${grad}`}>
                                {std.cover_url && (
                                    <img src={`http://localhost:3001${std.cover_url}`} alt={std.name}
                                        className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <div className="absolute top-3 right-3 flex gap-1.5">
                                    <StatusBadge status={std.status} />
                                </div>
                                <div className="absolute bottom-3 left-3">
                                    <span className="text-white/70 text-[10px] font-mono">{std.code}</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{std.name}</h3>
                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{std.category?.name}</span>
                                </div>
                                {std.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{std.description}</p>}
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><ElmIcon name="reading" size={16} />{std.total_lessons}课时</span>
                                    <span className="flex items-center gap-1"><ElmIcon name="clock" size={16} />{std.lesson_duration}分钟/节</span>
                                    <span className="flex items-center gap-1"><Users2 size={11} />{std.suggested_capacity}人</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <BookMarked size={44} className="mx-auto text-slate-200" />
                    <p className="text-slate-400 font-bold">暂无课程标准</p>
                    <button onClick={() => { setEditing(null); setView('form'); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm">
                        <ElmIcon name="plus" size={16} />新建第一个课程
                    </button>
                </div>
            )}
        </div>
    );
};
