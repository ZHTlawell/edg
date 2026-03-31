
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
    Search,
    Filter,
    ShoppingCart,
    Star,
    Users,
    Clock,
    Flame,
    CheckCircle2,
    ArrowRight,
    PartyPopper
} from 'lucide-react';
import { Course } from '../types';
import { PurchaseConfirmationModal } from './PurchaseConfirmationModal';

const COURSE_THEMES: Record<string, { gradient: string; accent: string; icon: string; tags: string[] }> = {
    '高级UI/UX设计实战': {
        gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        accent: '#a855f7',
        icon: '🎨',
        tags: ['Figma', 'Prototype'],
    },
    '全栈开发：React+Node': {
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
        accent: '#3b82f6',
        icon: '⚛️',
        tags: ['React', 'Node.js'],
    },
    '零基础Python自动化': {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        accent: '#059669',
        icon: '🐍',
        tags: ['Python', 'Script'],
    },
    '数据分析与可视化': {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        accent: '#d97706',
        icon: '📊',
        tags: ['Pandas', 'SQL'],
    },
    '人工智能基础与应用': {
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #7c3aed 100%)',
        accent: '#7c3aed',
        icon: '🤖',
        tags: ['PyTorch', 'NLP'],
    },
    '产品经理实战训练营': {
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
        accent: '#7c3aed',
        icon: '🚀',
        tags: ['PRD', 'Growth'],
    },
};

const CATEGORY_THEMES: Record<string, { gradient: string; icon: string }> = {
    '设计': { gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', icon: '🎨' },
    '编程': { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', icon: '💻' },
    'AI': { gradient: 'linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)', icon: '🤖' },
    '数据': { gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', icon: '📊' },
    '产品': { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', icon: '🚀' },
};

function getCourseTheme(course: Course) {
    return (
        COURSE_THEMES[course.name] ||
        (course.category && CATEGORY_THEMES[course.category]
            ? { ...CATEGORY_THEMES[course.category], accent: '#6366f1', tags: [] }
            : { gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', accent: '#64748b', icon: '📚', tags: [] })
    );
}

interface CourseMarketplaceProps {
    onViewCourse?: (courseId: string) => void;
}

export const CourseMarketplace: React.FC<CourseMarketplaceProps> = ({ onViewCourse }) => {
    const { courses, currentUser, createOrder, processPayment, fetchMyAssets, fetchOrders, students, assetAccounts, addToast } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');

    // Purchase State
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState<Course | null>(null);

    const studentName = useMemo(() => {
        if (!currentUser?.bindStudentId) return '未知学员';
        return (students || []).find(s => s.id === currentUser.bindStudentId)?.name || '学员';
    }, [students, currentUser]);

    // Track purchased courses for current student
    const purchasedCourseIds = useMemo(() => {
        if (!currentUser?.bindStudentId) return new Set<string>();
        return new Set(
            assetAccounts
                .filter(acc => (acc.student_id || acc.studentId) === currentUser.bindStudentId)
                .map(acc => acc.course_id || acc.courseId)
        );
    }, [assetAccounts, currentUser]);

    const categories = useMemo(() => {
        const cats = new Set((courses || []).map(c => c.category));
        return ['全部', ...Array.from(cats)];
    }, [courses]);

    const filteredCourses = useMemo(() => {
        return (courses || []).filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === '全部' || c.category === selectedCategory;
            return matchesSearch && matchesCategory && c.status === 'enabled';
        });
    }, [courses, searchQuery, selectedCategory]);

    const handlePurchaseClick = (course: Course) => {
        if (!currentUser?.bindStudentId) {
            addToast('无法获取学员身份，请重新登录。', 'error');
            return;
        }

        // Prevent duplicate purchase
        if (purchasedCourseIds.has(course.id)) return;

        setSelectedCourse(course);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmPurchase = async (paymentMethod: string) => {
        if (!selectedCourse || !currentUser?.bindStudentId) return;
        const amount = parseFloat(selectedCourse.price.replace(/[^\d.]/g, '')) || 0;
        try {
            const orderId = await createOrder({
                studentId: currentUser.bindStudentId,
                courseId: selectedCourse.id,
                amount,
                totalQty: selectedCourse.totalLessons,
            });
            await processPayment({
                orderId,
                amount,
                channel: paymentMethod,
                campusId: (currentUser as any).campus_id || 'CAMPUS_PUDONG',
            });
            await fetchMyAssets?.();
            await fetchOrders?.();
            const completedCourse = selectedCourse;
            setIsConfirmModalOpen(false);
            setSelectedCourse(null);
            setPurchaseSuccess(completedCourse);
            setTimeout(() => setPurchaseSuccess(null), 5000);
        } catch (error: any) {
            addToast(error?.response?.data?.message || '购课失败，请重试', 'error');
            setIsConfirmModalOpen(false);
            setSelectedCourse(null);
        }
    };

    return (
        <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Purchase Success Toast/Card */}
            {purchaseSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4">
                    <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl shadow-blue-500/20 border border-slate-800 flex items-center gap-5 animate-in slide-in-from-top-full duration-500">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <PartyPopper size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">购课成功</p>
                            <p className="text-sm font-bold truncate">已开启《{purchaseSuccess.name}》学习旅程</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">精品市场</h1>
                    <p className="text-sm text-slate-500 mt-1">共 {filteredCourses.length} 门课程</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96 group">
                    <ElmIcon name="search" size={16} />
                    <input
                        type="text"
                        placeholder="搜索您感兴趣的课程名称..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
                {filteredCourses.map(course => {
                    const isPurchased = purchasedCourseIds.has(course.id);
                    return (
                        <div
                            key={course.id}
                            onClick={() => onViewCourse?.(course.id)}
                            className={`group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2`}
                        >
                            {/* Thumbnail */}
                            {(() => {
                                const theme = getCourseTheme(course);
                                return (
                                <div className="h-56 relative overflow-hidden flex items-center justify-center" style={{ background: theme.gradient }}>
                                    {/* Decorative blobs */}
                                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 bg-white" />
                                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10 bg-white" />
                                    <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full opacity-10 bg-white" />
                                    {/* Hover overlay */}
                                    <div className={`absolute inset-0 bg-black/0 ${!isPurchased && 'group-hover:bg-black/10'} transition-all duration-500`} />
                                    {/* Center icon card */}
                                    <div className={`relative z-10 w-24 h-24 bg-white/20 backdrop-blur-sm rounded-[1.75rem] border border-white/30 flex flex-col items-center justify-center gap-1 shadow-2xl ${!isPurchased && 'group-hover:scale-110 group-hover:rotate-6'} transition-all duration-700`}>
                                        <span className="text-3xl leading-none">{theme.icon}</span>
                                        {theme.tags.length > 0 && (
                                            <span className="text-[9px] font-bold text-white/80 tracking-wide">{theme.tags[0]}</span>
                                        )}
                                    </div>
                                    {/* Tag pills */}
                                    {theme.tags.length > 1 && (
                                        <div className="absolute bottom-4 left-4 flex gap-1.5">
                                            {theme.tags.map(tag => (
                                                <span key={tag} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold rounded-lg border border-white/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    {isPurchased ? (
                                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-200 border border-emerald-400/50">
                                            <ElmIcon name="circle-check" size={16} /> 已在学习中
                                        </div>
                                    ) : (
                                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-slate-900 flex items-center gap-1.5 shadow-xl border border-white/50">
                                            <Flame size={14} className="text-orange-500 animate-pulse" /> 热门推荐
                                        </div>
                                    )}
                                    {/* Hover CTA */}
                                    {!isPurchased && (
                                        <div className="absolute bottom-4 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                            <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-blue-200 uppercase tracking-widest flex items-center gap-2">
                                                立即抢位 <ArrowRight size={12} />
                                            </span>
                                        </div>
                                    )}
                                </div>
                                );
                            })()}

                            <div className="p-10 space-y-6 flex-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                        {course.category}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                                        <Star size={14} fill="currentColor" /> 4.9
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <h3 className={`text-xl font-bold ${isPurchased ? 'text-slate-500' : 'text-slate-900 group-hover:text-blue-600'} transition-colors tracking-tight leading-tight`}>
                                        {course.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                        {course.description || '由行业专家亲自打造的体系化课程，涵盖全方位的实战案例分析与核心技术解析。'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 py-4 border-y border-slate-50/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <ElmIcon name="clock" size={16} /> {course.totalLessons} 课时
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <ElmIcon name="user" size={16} /> 1.2k 学员
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">单人特惠价</p>
                                        <p className={`text-3xl font-bold ${isPurchased ? 'text-slate-400 line-through decoration-slate-300 decoration-2' : 'text-slate-900'} font-mono tracking-tighter`}>
                                            {course.price.includes('¥') ? course.price : `¥${course.price}`}
                                        </p>
                                    </div>

                                    {isPurchased ? (
                                        <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-3xl font-bold text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            <ElmIcon name="circle-check" size={16} />
                                            <span>进入学习</span>
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-slate-900 text-white p-4 rounded-3xl group-hover:bg-blue-600 shadow-xl shadow-slate-100 group-hover:shadow-blue-200 transition-all duration-500 active:scale-90"
                                        >
                                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Modal */}
            <PurchaseConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmPurchase}
                course={selectedCourse}
                studentName={studentName}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient-move 3s ease infinite;
                }
            `}} />
        </div>
    );
};
