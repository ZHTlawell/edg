import React, { useState, useEffect } from 'react';
import { ElmIcon } from './ElmIcon';
import { Eye, ChevronDown, ChevronRight, FolderOpen, Inbox } from 'lucide-react';
import api from '../utils/api';
import { macroType, TYPE_CONFIG, formatSize, PreviewModal } from './CourseResourcePanel';

interface Resource { id: string; title: string; type: string; url: string; file_name?: string; file_size?: number; createdAt?: string; }
interface ClassGroup { classId: string; className: string; courseName: string; materials: Resource[]; }

export const StudentClassMaterials: React.FC = () => {
    const [groups, setGroups] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [preview, setPreview] = useState<Resource | null>(null);

    useEffect(() => {
        api.get('/api/course-resource/my-class-materials')
            .then(res => {
                const data: ClassGroup[] = res.data || [];
                setGroups(data);
                // 默认展开有资料的第一个班级
                const first = data.find(g => g.materials.length > 0);
                if (first) setExpanded(new Set([first.classId]));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const toggle = (id: string) => setExpanded(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    const totalMaterials = groups.reduce((s, g) => s + g.materials.length, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
            {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}

            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">班级资料</h1>
                <p className="text-sm text-slate-500">老师为你所在班级上传的学习资料，共 {totalMaterials} 份</p>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400 text-sm">加载中...</div>
            ) : groups.length === 0 ? (
                <div className="py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <Inbox size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400 font-bold">暂无班级资料</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map(group => {
                        const isOpen = expanded.has(group.classId);
                        return (
                            <div key={group.classId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <button onClick={() => toggle(group.classId)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <FolderOpen size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{group.className}</p>
                                            <p className="text-[10px] text-slate-400">{group.courseName} · {group.materials.length} 份资料</p>
                                        </div>
                                    </div>
                                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </button>
                                {isOpen && (
                                    <div className="border-t border-slate-50">
                                        {group.materials.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-slate-400">老师还没有上传资料</div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {group.materials.map(r => {
                                                    const tc = (TYPE_CONFIG as any)[r.type] || (TYPE_CONFIG as any)[macroType(r.type)] || (TYPE_CONFIG as any).VIDEO;
                                                    const Icon = tc.icon;
                                                    return (
                                                        <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group transition-all">
                                                            <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                                                                <Icon size={16} className={tc.color} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-700 truncate">{r.title}</p>
                                                                <p className="text-[10px] text-slate-400">
                                                                    {tc.label} · {formatSize(r.file_size)}
                                                                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('zh-CN')}` : ''}
                                                                </p>
                                                            </div>
                                                            <button onClick={() => setPreview(r)}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Eye size={14} className="text-slate-400" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
