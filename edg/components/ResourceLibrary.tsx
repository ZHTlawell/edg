
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    FileText,
    Video,
    Music,
    File,
    Search,
    Eye,
    ChevronDown,
    ChevronRight as ChevRight,
    BookOpen,
    Inbox,
    UploadCloud,
    Clock,
    X,
    Trash2,
    FolderOpen,
} from 'lucide-react';
import { useStore } from '../store';
import api from '../utils/api';
import { macroType, TYPE_CONFIG, formatSize, PreviewModal } from './CourseResourcePanel';

interface Resource { id: string; title: string; type: string; url: string; file_name?: string; file_size?: number; status: string; scope?: string; class_id?: string; creator_id?: string; createdAt?: string; }
interface CourseWithStandard { courseId: string; courseName: string; standardId: string; standardName: string; }

type TabKey = 'class-materials' | 'standard-resources';

export const ResourceLibrary: React.FC = () => {
    const { currentUser, classes, addToast } = useStore();
    const teacherId = (currentUser as any)?.teacherId;

    const [activeTab, setActiveTab] = useState<TabKey>('class-materials');
    const [resources, setResources] = useState<Record<string, Resource[]>>({});
    const [classMaterials, setClassMaterials] = useState<Record<string, Resource[]>>({});
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [preview, setPreview] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Upload modal state
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadClassId, setUploadClassId] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // 教师所教班级
    const myCourses = useMemo<(CourseWithStandard & { classId: string; className: string })[]>(() => {
        const result: (CourseWithStandard & { classId: string; className: string })[] = [];
        const seenClass = new Set<string>();
        (classes || []).forEach((cls: any) => {
            const isMine = cls.teacher_id === teacherId || cls.teacher?.id === teacherId;
            if (isMine && cls.course && !seenClass.has(cls.id)) {
                seenClass.add(cls.id);
                result.push({
                    classId: cls.id,
                    className: cls.name || '未知班级',
                    courseId: cls.course.id,
                    courseName: cls.course.name || '未知课程',
                    standardId: cls.course.standard_id || '',
                    standardName: cls.course.standard?.name || cls.course.name || '',
                });
            }
            (cls.assignments || []).forEach((a: any) => {
                if (a.teacher_id !== teacherId && a.teacher?.id !== teacherId) return;
                const course = a.course;
                if (!course || seenClass.has(cls.id + a.id)) return;
                seenClass.add(cls.id + a.id);
                result.push({
                    classId: cls.id,
                    className: cls.name || '未知班级',
                    courseId: course.id,
                    courseName: course.name || '未知课程',
                    standardId: course.standard_id || '',
                    standardName: course.standard?.name || course.name || '',
                });
            });
        });
        return result;
    }, [classes, teacherId]);

    // Fetch class materials
    const fetchClassMaterials = async () => {
        if (myCourses.length === 0) return;
        const results = await Promise.all(
            myCourses.map(c =>
                api.get(`/api/course-resource/class-materials/${c.classId}`)
                    .then(r => ({ classId: c.classId, data: r.data || [] }))
                    .catch(() => ({ classId: c.classId, data: [] }))
            )
        );
        const map: Record<string, Resource[]> = {};
        results.forEach(({ classId, data }) => { map[classId] = data; });
        setClassMaterials(map);
    };

    // Fetch standard resources
    useEffect(() => {
        if (myCourses.length === 0) { setLoading(false); return; }
        setLoading(true);

        const standardIds = [...new Set(myCourses.map(c => c.standardId).filter(Boolean))];
        if (standardIds.length === 0) { setLoading(false); return; }

        Promise.all(
            standardIds.map(sid =>
                api.get(`/api/course-resource/resources?standard_id=${sid}`)
                    .then(r => ({ sid, data: (r.data || []).filter((res: any) => res.status === 'PUBLISHED') }))
                    .catch(() => ({ sid, data: [] }))
            )
        ).then(results => {
            const map: Record<string, Resource[]> = {};
            results.forEach(({ sid, data }) => { map[sid] = data; });
            setResources(map);
            if (myCourses.length > 0) setExpanded(new Set([myCourses[0].classId]));
        }).finally(() => setLoading(false));
    }, [myCourses]);

    useEffect(() => { fetchClassMaterials(); }, [myCourses]);

    const toggle = (sid: string) => setExpanded(prev => {
        const n = new Set(prev);
        n.has(sid) ? n.delete(sid) : n.add(sid);
        return n;
    });

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle || !uploadClassId) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', uploadFile);
            fd.append('title', uploadTitle);
            fd.append('description', uploadDesc);
            fd.append('class_id', uploadClassId);
            fd.append('scope', 'CLASS');
            await api.post('/api/course-resource/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowUpload(false);
            setUploadFile(null); setUploadTitle(''); setUploadClassId(''); setUploadDesc('');
            addToast('资料上传成功，学员可立即查看', 'success');
            await fetchClassMaterials();
        } catch (e: any) {
            addToast(e?.response?.data?.message || '上传失败', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/api/course-resource/class-materials/${id}`);
            addToast('资料已删除', 'success');
            await fetchClassMaterials();
        } catch (e: any) {
            addToast(e?.response?.data?.message || '删除失败', 'error');
        }
    };

    const renderResourceItem = (r: Resource, showDelete = false) => {
        const tc = (TYPE_CONFIG as any)[r.type] || (TYPE_CONFIG as any)[macroType(r.type)] || (TYPE_CONFIG as any).VIDEO;
        const Icon = tc.icon;
        return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group rounded-xl transition-all">
                <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0`}><Icon size={16} className={tc.color} /></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-400">{tc.label} · {formatSize(r.file_size)}{r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('zh-CN')}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreview(r)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Eye size={14} className="text-slate-400" /></button>
                    {showDelete && (
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">教学资源库</h1>
                    <p className="text-sm text-slate-500">管理班级资料和查看课程标准资源</p>
                </div>
                <button onClick={() => { setShowUpload(true); setUploadClassId(myCourses[0]?.classId || ''); }}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                    <UploadCloud size={16} /> 上传资料
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {([
                    { key: 'class-materials' as TabKey, label: '班级资料', desc: '直传免审' },
                    { key: 'standard-resources' as TabKey, label: '课程标准资源', desc: '教务审核' },
                ]).map(tab => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.label}
                        <span className="ml-1 text-[10px] font-normal text-slate-400">{tab.desc}</span>
                    </button>
                ))}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">上传班级资料</h3>
                            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                <p className="text-xs text-emerald-700 font-medium">上传后学员可立即查看，无需审批。</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">资料标题 <span className="text-red-500">*</span></label>
                                <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                                    placeholder="例如：第三课 组件生命周期 笔记" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">所属班级 <span className="text-red-500">*</span></label>
                                <select value={uploadClassId} onChange={e => setUploadClassId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 font-bold text-slate-700">
                                    <option value="">请选择班级...</option>
                                    {myCourses.map(c => (
                                        <option key={c.classId} value={c.classId}>{c.className}（{c.courseName}）</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">备注说明</label>
                                <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                                    placeholder="可选，补充说明" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">选择文件 <span className="text-red-500">*</span></label>
                                <input ref={fileRef} type="file" className="hidden"
                                    accept=".mp4,.avi,.mov,.webm,.pptx,.ppt,.pdf,.mp3,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={e => e.target.files?.[0] && setUploadFile(e.target.files[0])} />
                                {uploadFile ? (
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <File size={16} className="text-indigo-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{uploadFile.name}</p>
                                            <p className="text-[10px] text-slate-400">{formatSize(uploadFile.size)}</p>
                                        </div>
                                        <button onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                            className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => fileRef.current?.click()}
                                        className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-500 transition-all">
                                        <UploadCloud size={22} />
                                        <span className="text-xs font-medium">点击选择文件（PDF / PPT / 视频 / 图片）</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
                            <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle || !uploadClassId}
                                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-all">
                                {uploading ? '上传中...' : <><UploadCloud size={14} /> 上传</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center text-slate-400 text-sm">加载中...</div>
            ) : myCourses.length === 0 ? (
                <div className="py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <Inbox size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400 font-bold">暂无分配的课程</p>
                </div>
            ) : activeTab === 'class-materials' ? (
                /* ═══ 班级资料 Tab ═══ */
                <div className="space-y-3">
                    {myCourses.map(course => {
                        const materials = classMaterials[course.classId] || [];
                        const expandKey = 'cm-' + course.classId;
                        const isOpen = expanded.has(expandKey);

                        return (
                            <div key={course.classId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <button onClick={() => toggle(expandKey)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FolderOpen size={16} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{course.className}</p>
                                            <p className="text-[10px] text-slate-400">{course.courseName} · {materials.length} 份资料</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setUploadClassId(course.classId); setShowUpload(true); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all">
                                            <UploadCloud size={14} />
                                        </button>
                                        {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevRight size={16} className="text-slate-400" />}
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="border-t border-slate-50">
                                        {materials.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <p className="text-xs text-slate-400">暂无资料</p>
                                                <button onClick={() => { setUploadClassId(course.classId); setShowUpload(true); }}
                                                    className="mt-2 text-xs text-indigo-500 font-bold hover:underline">上传第一份资料</button>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {materials.map(r => renderResourceItem(r, true))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ═══ 课程标准资源 Tab ═══ */
                <>
                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" placeholder="搜索资源名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm shadow-sm" />
                    </div>
                    {(() => {
                        if (searchTerm) {
                            const kw = searchTerm.toLowerCase();
                            const filtered = Object.values(resources).flat().filter(r => r.title.toLowerCase().includes(kw));
                            return (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-3 border-b border-slate-50">
                                        <span className="text-xs text-slate-400 font-bold">搜索结果 ({filtered.length})</span>
                                    </div>
                                    {filtered.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 text-sm italic">无匹配资源</div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">{filtered.map(r => renderResourceItem(r))}</div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <div className="space-y-3">
                                {myCourses.filter(c => c.standardId).map(course => {
                                    const resList = resources[course.standardId] || [];
                                    const expandKey = 'std-' + course.classId;
                                    const isOpen = expanded.has(expandKey);

                                    return (
                                        <div key={course.classId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                            <button onClick={() => toggle(expandKey)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 text-left">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><BookOpen size={16} /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{course.className}</p>
                                                        <p className="text-[10px] text-slate-400">{course.courseName} · {resList.length} 个资源</p>
                                                    </div>
                                                </div>
                                                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevRight size={16} className="text-slate-400" />}
                                            </button>
                                            {isOpen && (
                                                <div className="border-t border-slate-50">
                                                    {resList.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic py-6 text-center">该课程标准暂无已发布资源</p>
                                                    ) : (
                                                        <div className="divide-y divide-slate-50">{resList.map(r => renderResourceItem(r))}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};
