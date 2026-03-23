import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
   ArrowLeft, BookOpen, Clock, Users2, CheckCircle2, Lock,
   Play, FileText, Music, File, Download, ChevronRight, ChevronDown,
   CircleDot, Circle, Award, X
} from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LessonResource {
   id: string; title: string; type: string; url: string;
   file_name?: string; file_size?: number; sort_order: number;
}
interface Lesson {
   id: string; title: string; duration?: number; sort_order: number;
   resources: LessonResource[];
   progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
   unlocked: boolean;
   started_at?: string;
   completed_at?: string;
}
interface Chapter {
   id: string; title: string; sort_order: number; lessons: Lesson[];
}
interface CatalogData {
   course: {
      id: string; name: string; description?: string; cover_url?: string;
      total_lessons: number; lesson_duration: number;
      age_min?: number; age_max?: number;
   };
   progress: { total: number; completed: number };
   chapters: Chapter[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_MAP: Record<string, { icon: any; label: string; color: string; bg: string }> = {
   VIDEO: { icon: Play, label: '视频', color: 'text-blue-600', bg: 'bg-blue-50' },
   PPT: { icon: FileText, label: 'PPT', color: 'text-orange-600', bg: 'bg-orange-50' },
   PDF: { icon: FileText, label: 'PDF', color: 'text-red-600', bg: 'bg-red-50' },
   AUDIO: { icon: Music, label: '音频', color: 'text-purple-600', bg: 'bg-purple-50' },
   OTHER: { icon: File, label: '附件', color: 'text-slate-600', bg: 'bg-slate-50' },
};

const formatSize = (b?: number) => !b ? '' : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`;
const BASE = 'http://localhost:3001';

// ─── Resource Viewer ──────────────────────────────────────────────────────────
const ResourceViewer: React.FC<{ resource: LessonResource; onClose: () => void }> = ({ resource, onClose }) => {
   const url = resource.url.startsWith('/') ? `${BASE}${resource.url}` : resource.url;
   const cfg = TYPE_MAP[resource.type] || TYPE_MAP.OTHER;
   return (
      <div className="fixed inset-0 z-[500] bg-black/80 flex flex-col" onClick={onClose}>
         <div className="flex items-center justify-between px-6 py-3 bg-black/60 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
               <cfg.icon size={18} className="text-white/70" />
               <span className="text-white font-bold truncate">{resource.title}</span>
               <span className="text-white/40 text-xs">{cfg.label} {formatSize(resource.file_size) && `· ${formatSize(resource.file_size)}`}</span>
            </div>
            <div className="flex items-center gap-3">
               <a href={url} download={resource.file_name} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all">
                  <ElmIcon name="download" size={16} />下载
               </a>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><ElmIcon name="close" size={16} /></button>
            </div>
         </div>
         <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
            {resource.type === 'VIDEO' && (
               <video controls autoPlay className="max-h-full max-w-full" src={url}>不支持视频播放</video>
            )}
            {resource.type === 'PDF' && (
               <iframe src={url} className="w-full h-full bg-white" title={resource.title} />
            )}
            {resource.type === 'AUDIO' && (
               <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center">
                     <Music size={40} className="text-purple-300" />
                  </div>
                  <audio controls autoPlay src={url} className="w-80" />
                  <p className="text-white/70 text-sm">{resource.title}</p>
               </div>
            )}
            {(resource.type === 'PPT' || resource.type === 'OTHER') && (
               <div className="flex flex-col items-center gap-5 text-center p-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center"><cfg.icon size={36} className="text-white/60" /></div>
                  <p className="text-white font-bold text-lg">{resource.title}</p>
                  <p className="text-white/50 text-sm">{resource.type === 'PPT' ? 'PPT 文件需要下载后使用 PowerPoint / WPS 打开' : '点击下方按钮下载此文件'}</p>
                  <a href={url} download={resource.file_name}
                     className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">
                     <ElmIcon name="download" size={16} />下载 {resource.type}
                  </a>
               </div>
            )}
         </div>
      </div>
   );
};

// ─── Lesson Row ───────────────────────────────────────────────────────────────
const LessonRow: React.FC<{
   lesson: Lesson;
   globalIndex: number;
   isActive: boolean;
   onClick: () => void;
}> = ({ lesson, globalIndex, isActive, onClick }) => {
   const progressIcon = () => {
      if (!lesson.unlocked) return <Lock size={15} className="text-slate-300 flex-shrink-0" />;
      if (lesson.progress === 'COMPLETED') return <ElmIcon name="circle-check" size={16} />;
      if (lesson.progress === 'IN_PROGRESS') return <CircleDot size={15} className="text-indigo-500 flex-shrink-0" />;
      return <Circle size={15} className="text-slate-300 flex-shrink-0" />;
   };
   const resCount = lesson.resources.length;
   return (
      <div
         onClick={() => lesson.unlocked && onClick()}
         className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all select-none border ${!lesson.unlocked
               ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-50'
               : isActive
                  ? 'bg-indigo-50 border-indigo-200 cursor-pointer'
                  : 'bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-200 cursor-pointer'
            }`}
      >
         <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {globalIndex + 1}
         </div>
         <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${isActive ? 'text-indigo-700' : !lesson.unlocked ? 'text-slate-400' : 'text-slate-700'}`}>
               {lesson.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
               {lesson.duration && <span className="text-xs text-slate-400 flex items-center gap-1"><ElmIcon name="clock" size={16} />{lesson.duration}分钟</span>}
               {resCount > 0 && <span className="text-xs text-slate-400">{resCount}个资源</span>}
            </div>
         </div>
         {progressIcon()}
      </div>
   );
};

// ─── Main: CourseStudyView ─────────────────────────────────────────────────────
interface Props {
   courseId: string;
   onBack: () => void;
}

export const CourseStudyView: React.FC<Props> = ({ courseId, onBack }) => {
   const [catalog, setCatalog] = useState<CatalogData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
   const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
   const [activeResource, setActiveResource] = useState<LessonResource | null>(null);
   const [completing, setCompleting] = useState(false);
   const { addToast } = useStore();

   const load = useCallback(async () => {
      try {
         setLoading(true);
         const r = await api.get(`/api/course-catalog/${courseId}`);
         setCatalog(r.data);
         // Auto-expand all chapters and select first unlocked lesson
         const allChapterIds = new Set(r.data.chapters.map((c: Chapter) => c.id));
         setExpandedChapters(allChapterIds);
         for (const ch of r.data.chapters) {
            const first = ch.lessons.find((l: Lesson) => l.unlocked && l.progress !== 'COMPLETED');
            if (first) { setActiveLessonId(first.id); break; }
         }
      } catch (e: any) {
         setError(e.response?.data?.message || '加载失败');
      } finally { setLoading(false); }
   }, [courseId]);

   useEffect(() => { load(); }, [load]);

   const activeLesson = catalog?.chapters.flatMap(c => c.lessons).find(l => l.id === activeLessonId) || null;

   const startLesson = async (lessonId: string) => {
      setActiveLessonId(lessonId);
      const lesson = catalog?.chapters.flatMap(c => c.lessons).find(l => l.id === lessonId);
      if (!lesson || lesson.progress !== 'NOT_STARTED') return;
      try {
         await api.post('/api/course-catalog/progress', { course_id: courseId, lesson_id: lessonId, action: 'start' });
         load();
      } catch { /**/ }
   };

   const completeLesson = async () => {
      if (!activeLessonId || !activeLesson || completing) return;
      setCompleting(true);
      try {
         await api.post('/api/course-catalog/progress', { course_id: courseId, lesson_id: activeLessonId, action: 'complete' });
         addToast('课时已完成！', 'success');
         await load();
         // Auto-advance to next lesson
         const all = catalog!.chapters.flatMap(c => c.lessons);
         const idx = all.findIndex(l => l.id === activeLessonId);
         const next = all.slice(idx + 1).find(l => l.unlocked);
         if (next) setActiveLessonId(next.id);
      } catch (e: any) {
         addToast(e.response?.data?.message || '操作失败', 'error');
      } finally { setCompleting(false); }
   };

   if (loading) return (
      <div className="flex items-center justify-center h-64">
         <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
   );

   if (error) return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
         <p className="text-red-500 font-bold">{error}</p>
         <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">
            <ArrowLeft size={16} />返回
         </button>
      </div>
   );

   if (!catalog) return null;

   const { course, progress, chapters } = catalog;
   const allLessons = chapters.flatMap(c => c.lessons);
   const progressPct = progress.total > 0 ? Math.round(progress.completed / progress.total * 100) : 0;
   const allCompleted = progress.completed === progress.total && progress.total > 0;

   return (
      <div className="flex h-[calc(100vh-80px)] gap-4 animate-in fade-in duration-500">
         {activeResource && <ResourceViewer resource={activeResource} onClose={() => setActiveResource(null)} />}

         {/* ── Left Sidebar: Catalog ─────────────────────────────────────── */}
         <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Course info */}
            <div className="relative flex-shrink-0">
               <div className="h-28 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                  {course.cover_url && (
                     <img src={`${BASE}${course.cover_url}`} alt={course.name} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50" />
                  <button onClick={onBack} className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-all">
                     <ArrowLeft size={12} />返回
                  </button>
               </div>
               <div className="px-4 pb-3 pt-2 border-b border-slate-100">
                  <h2 className="font-extrabold text-slate-800 text-sm leading-tight line-clamp-2">{course.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                     <span className="text-xs text-slate-400 flex items-center gap-1"><ElmIcon name="reading" size={16} />{course.total_lessons}课时</span>
                     <span className="text-xs text-slate-400 flex items-center gap-1"><ElmIcon name="clock" size={16} />{course.lesson_duration}分钟/节</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2.5">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">学习进度</span>
                        <span className="text-[10px] font-bold text-indigo-600">{progress.completed}/{progress.total}</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
               {allCompleted && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                     <Award size={18} className="text-emerald-500" />
                     <div>
                        <p className="text-xs font-extrabold text-emerald-700">全部完成！</p>
                        <p className="text-[10px] text-emerald-400">恭喜你学完了本课程</p>
                     </div>
                  </div>
               )}
               {chapters.map(ch => {
                  const chCompleted = ch.lessons.every(l => l.progress === 'COMPLETED');
                  const chInProgress = ch.lessons.some(l => l.progress === 'IN_PROGRESS');
                  const expanded = expandedChapters.has(ch.id);
                  const globalStart = allLessons.findIndex(l => l.id === ch.lessons[0]?.id);
                  return (
                     <div key={ch.id}>
                        <button
                           onClick={() => setExpandedChapters(p => { const n = new Set(p); n.has(ch.id) ? n.delete(ch.id) : n.add(ch.id); return n; })}
                           className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                        >
                           {expanded ? <ElmIcon name="arrow-down" size={16} /> : <ElmIcon name="arrow-right" size={16} />}
                           <span className="flex-1 text-sm font-extrabold text-slate-700 truncate">{ch.title}</span>
                           <span className="text-[10px] text-slate-400">{ch.lessons.length}节</span>
                           {chCompleted && <ElmIcon name="circle-check" size={16} />}
                           {chInProgress && !chCompleted && <CircleDot size={13} className="text-indigo-400 flex-shrink-0" />}
                        </button>
                        {expanded && (
                           <div className="pl-2 pr-1 space-y-1.5 mb-1">
                              {ch.lessons.map((ls, i) => (
                                 <LessonRow key={ls.id} lesson={ls} globalIndex={globalStart + i}
                                    isActive={activeLessonId === ls.id}
                                    onClick={() => startLesson(ls.id)} />
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* ── Right: Content Area ───────────────────────────────────────── */}
         <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {activeLesson ? (
               <>
                  {/* Lesson header */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start justify-between gap-4">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           {activeLesson.progress === 'COMPLETED' && <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><ElmIcon name="circle-check" size={16} />已完成</span>}
                           {activeLesson.progress === 'IN_PROGRESS' && <span className="flex items-center gap-1 text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100"><CircleDot size={11} />学习中</span>}
                           {activeLesson.progress === 'NOT_STARTED' && <span className="text-xs text-slate-400 font-medium">未开始</span>}
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-800">{activeLesson.title}</h2>
                        <div className="flex items-center gap-3 mt-1">
                           {activeLesson.duration && <span className="text-sm text-slate-400 flex items-center gap-1"><ElmIcon name="clock" size={16} />{activeLesson.duration}分钟</span>}
                           <span className="text-sm text-slate-400">{activeLesson.resources.length}个学习资源</span>
                        </div>
                     </div>
                     {activeLesson.progress !== 'COMPLETED' && (
                        <button onClick={completeLesson} disabled={completing}
                           className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0">
                           <ElmIcon name="circle-check" size={16} />
                           {completing ? '处理中...' : '完成此课时'}
                        </button>
                     )}
                  </div>

                  {/* Resources */}
                  <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                     {activeLesson.resources.length > 0 ? (
                        <div className="space-y-4">
                           <p className="text-sm font-extrabold text-slate-600 flex items-center gap-2"><ElmIcon name="reading" size={16} />课时资源</p>
                           <div className="space-y-3">
                              {activeLesson.resources.map(res => {
                                 const cfg = TYPE_MAP[res.type] || TYPE_MAP.OTHER;
                                 const Icon = cfg.icon;
                                 const url = res.url.startsWith('/') ? `${BASE}${res.url}` : res.url;
                                 return (
                                    <div key={res.id} className={`group flex items-center gap-4 p-4 rounded-2xl border ${cfg.bg} transition-all hover:shadow-sm`} style={{ borderColor: 'transparent' }}>
                                       <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                                          <Icon size={22} className={cfg.color} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <p className="font-extrabold text-slate-800 truncate">{res.title}</p>
                                          <p className="text-xs text-slate-400 mt-0.5">{cfg.label}{res.file_size ? ` · ${formatSize(res.file_size)}` : ''}</p>
                                       </div>
                                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {(res.type === 'VIDEO' || res.type === 'PDF' || res.type === 'AUDIO') && (
                                             <button onClick={() => setActiveResource(res)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 font-bold text-sm rounded-xl transition-all shadow-sm">
                                                <Play size={14} />在线学习
                                             </button>
                                          )}
                                          <a href={url} download={res.file_name}
                                             className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-all shadow-sm">
                                             <ElmIcon name="download" size={16} />下载
                                          </a>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 py-16">
                           <ElmIcon name="reading" size={16} />
                           <p className="font-bold text-slate-400">此课时暂无资源</p>
                           <p className="text-sm">点击左侧「完成此课时」继续下一节</p>
                        </div>
                     )}
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm gap-4 py-20">
                  <ElmIcon name="reading" size={16} />
                  <p className="text-xl font-bold text-slate-400">点击左侧课时开始学习</p>
                  <p className="text-sm text-slate-300">按顺序解锁，完成上一节才能进入下一节</p>
               </div>
            )}
         </div>
      </div>
   );
};
