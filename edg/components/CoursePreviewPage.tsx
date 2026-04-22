/**
 * CoursePreviewPage.tsx
 * ---------------------------------------------------------------
 * 课程预览页（未购买学员视角）。
 * 展示课程封面、介绍、章节/课次大纲，未解锁课次显示锁状态。
 * 右上按钮可购买课程；购买后会跳 onStartStudy 进入学习。
 * 使用位置：CourseMarketplace 点击课程卡片进入。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, BookOpen, Clock, ChevronDown, ChevronRight,
    Lock, PlayCircle, ShoppingCart, Star, Users2
} from 'lucide-react';
import api from '../utils/api';
import { useStore } from '../store';
import { PurchaseConfirmationModal } from './PurchaseConfirmationModal';

// 课次 / 章节 / 预览数据结构（接口响应模型）
interface PreviewLesson {
    id: string;
    title: string;
    sort_order: number;
    duration?: number;
}
interface PreviewChapter {
    id: string;
    title: string;
    sort_order: number;
    lessons: PreviewLesson[];
}
interface PreviewData {
    course: {
        id: string; name: string; description?: string; cover_url?: string;
        total_lessons: number; lesson_duration: number;
        age_min?: number; age_max?: number;
    };
    chapters: PreviewChapter[];
}

// props：courseId 当前课程；onBack 返回；onStartStudy 开始学习（已购买后进入）
interface Props {
    courseId: string;
    onBack: () => void;
    onStartStudy: (courseId: string) => void;
}

// 课程名 -> 卡片主题（与 CourseMarketplace 保持视觉一致）
const COURSE_THEMES: Record<string, { gradient: string; icon: string }> = {
    '高级UI/UX设计实战': { gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', icon: '🎨' },
    '全栈开发：React+Node': { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)', icon: '⚛️' },
    '零基础Python自动化': { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', icon: '🐍' },
    '数据分析与可视化': { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)', icon: '📊' },
    '人工智能基础与应用': { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #7c3aed 100%)', icon: '🤖' },
    '产品经理实战训练营': { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)', icon: '🚀' },
};

/**
 * CoursePreviewPage —— 课程预览主组件
 * 挂载时调用 api.getCoursePreview 拉取章节 + 课次，
 * 首个章节默认展开、其它折叠；已购买则按钮切换为「开始学习」
 */
export const CoursePreviewPage: React.FC<Props> = ({ courseId, onBack, onStartStudy }) => {
    const { currentUser, students, courses, assetAccounts, createOrder, processPayment, fetchMyAssets, fetchOrders, addToast } = useStore();
    const [data, setData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get(`/api/course-catalog/preview/${courseId}`)
            .then(res => {
                setData(res.data);
                // Auto-expand all chapters
                const ids = new Set((res.data.chapters || []).map((ch: PreviewChapter) => ch.id));
                setExpandedChapters(ids);
            })
            .catch(err => {
                console.error('Failed to load preview', err);
                addToast('加载课程信息失败', 'error');
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    const isPurchased = useMemo(() => {
        if (!currentUser?.bindStudentId) return false;
        return assetAccounts.some(
            acc => (acc.student_id || acc.studentId) === currentUser.bindStudentId
                && (acc.course_id || acc.courseId) === courseId
                && acc.status === 'ACTIVE'
        );
    }, [assetAccounts, currentUser, courseId]);

    const course = useMemo(() => (courses || []).find(c => c.id === courseId), [courses, courseId]);

    const studentName = useMemo(() => {
        if (!currentUser?.bindStudentId) return '学员';
        return (students || []).find(s => s.id === currentUser.bindStudentId)?.name || '学员';
    }, [students, currentUser]);

    const toggleChapter = (id: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const totalLessons = data?.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0;
    const theme = data ? (COURSE_THEMES[data.course.name] || { gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', icon: '📚' }) : null;

    const handleConfirmPurchase = async (paymentMethod: string) => {
        if (!course || !currentUser?.bindStudentId) return;
        const amount = parseFloat(course.price.replace(/[^\d.]/g, '')) || 0;
        try {
            const orderId = await createOrder({
                studentId: currentUser.bindStudentId,
                courseId: course.id,
                amount,
                totalQty: course.totalLessons,
            });
            await processPayment({
                orderId,
                amount,
                channel: paymentMethod,
                campusId: (currentUser as any).campus_id || 'CAMPUS_PUDONG',
            });
            await fetchMyAssets?.();
            await fetchOrders?.();
            setIsConfirmModalOpen(false);
            addToast('购课成功！可以开始学习了', 'success');
        } catch (error: any) {
            addToast(error?.response?.data?.message || '购课失败，请重试', 'error');
            setIsConfirmModalOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-slate-100 rounded-[2.5rem]" />
                <div className="h-8 w-48 bg-slate-100 rounded-xl" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400">课程信息加载失败</p>
                <button onClick={onBack} className="mt-4 text-blue-600 text-sm font-bold">返回</button>
            </div>
        );
    }

    return (
        <div className="max-w-[960px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Back button */}
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={16} /> 返回精品市场
            </button>

            {/* Hero Banner */}
            <div className="relative rounded-[2.5rem] overflow-hidden" style={{ background: theme?.gradient || '#334155' }}>
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15 bg-white" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 bg-white" />
                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-start gap-8">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-[1.5rem] border border-white/30 flex items-center justify-center text-4xl shadow-2xl flex-shrink-0">
                        {theme?.icon || '📚'}
                    </div>
                    <div className="flex-1 space-y-4">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{data.course.name}</h1>
                        {data.course.description && (
                            <p className="text-white/70 text-sm leading-relaxed max-w-xl">{data.course.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-white/80 text-xs font-bold">
                            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                <BookOpen size={13} /> {totalLessons} 课时
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                <Clock size={13} /> {data.course.lesson_duration} 分钟/节
                            </span>
                            {data.course.age_min && (
                                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                    <Users2 size={13} /> {data.course.age_min}-{data.course.age_max}岁
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                <Star size={13} fill="currentColor" /> 4.9 好评
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-800">{data.chapters.length}</span> 个章节 ·{' '}
                        <span className="font-bold text-slate-800">{totalLessons}</span> 个课时
                    </div>
                    {course && (
                        <div className="text-2xl font-bold text-slate-900 font-mono">
                            {course.price.includes('¥') ? course.price : `¥${course.price}`}
                        </div>
                    )}
                </div>
                {isPurchased ? (
                    <button
                        onClick={() => onStartStudy(courseId)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                        <PlayCircle size={18} /> 开始学习
                    </button>
                ) : (
                    <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                    >
                        <ShoppingCart size={18} /> 立即购买
                    </button>
                )}
            </div>

            {/* Course Syllabus */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ElmIcon name="reading" size={16} /> 课程大纲
                </h2>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
                    {data.chapters.map((ch, ci) => {
                        const expanded = expandedChapters.has(ch.id);
                        return (
                            <div key={ch.id}>
                                {/* Chapter header */}
                                <button
                                    onClick={() => toggleChapter(ch.id)}
                                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-bold text-slate-500">
                                            {ci + 1}
                                        </span>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-800">{ch.title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                {ch.lessons.length} 课时
                                            </p>
                                        </div>
                                    </div>
                                    {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </button>

                                {/* Lessons */}
                                {expanded && (
                                    <div className="px-8 pb-4 space-y-1">
                                        {ch.lessons.map((ls, li) => (
                                            <div
                                                key={ls.id}
                                                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <span className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {li + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-600 font-medium truncate">{ls.title}</p>
                                                </div>
                                                {ls.duration && (
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                        <Clock size={10} /> {ls.duration}分钟
                                                    </span>
                                                )}
                                                {!isPurchased && (
                                                    <Lock size={12} className="text-slate-300 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Purchase Modal */}
            <PurchaseConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmPurchase}
                course={course || null}
                studentName={studentName}
            />
        </div>
    );
};
