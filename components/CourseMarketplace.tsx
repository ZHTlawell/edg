
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
    Sparkles,
    ArrowRight,
    PartyPopper,
    BookOpen
} from 'lucide-react';
import { Course } from '../types';
import { PurchaseConfirmationModal } from './PurchaseConfirmationModal';

export const CourseMarketplace: React.FC = () => {
    const { courses, currentUser, createOrder, students, assetAccounts } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');

    // Purchase State
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState<Course | null>(null);

    const studentName = useMemo(() => {
        if (!currentUser?.bindStudentId) return '未知学员';
        return students.find(s => s.id === currentUser.bindStudentId)?.name || '学员';
    }, [students, currentUser]);

    // Track purchased courses for current student
    const purchasedCourseIds = useMemo(() => {
        if (!currentUser?.bindStudentId) return new Set<string>();
        return new Set(
            assetAccounts
                .filter(acc => acc.studentId === currentUser.bindStudentId)
                .map(acc => acc.courseId)
        );
    }, [assetAccounts, currentUser]);

    const categories = useMemo(() => {
        const cats = new Set(courses.map(c => c.category));
        return ['全部', ...Array.from(cats)];
    }, [courses]);

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === '全部' || c.category === selectedCategory;
            return matchesSearch && matchesCategory && c.status === 'enabled';
        });
    }, [courses, searchQuery, selectedCategory]);

    const handlePurchaseClick = (course: Course) => {
        if (!currentUser?.bindStudentId) {
            alert('无法获取学员身份，请重新登录。');
            return;
        }

        // Prevent duplicate purchase
        if (purchasedCourseIds.has(course.id)) return;

        setSelectedCourse(course);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmPurchase = () => {
        if (!selectedCourse || !currentUser?.bindStudentId) return;

        const amount = parseFloat(selectedCourse.price.replace(/[^\d.]/g, ''));
        createOrder({
            studentId: currentUser.bindStudentId,
            courseId: selectedCourse.id,
            classId: 'C-TBD',
            campusId: currentUser.campus || '总校区',
            lessons: selectedCourse.totalLessons,
            amount: amount,
            paymentMethod: '余额支付',
            notes: '学员自助购买'
        });

        const completedCourse = selectedCourse;
        setIsConfirmModalOpen(false);
        setSelectedCourse(null);

        // Show success state
        setPurchaseSuccess(completedCourse);
        setTimeout(() => setPurchaseSuccess(null), 5000); // Clear success after 5s
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

            {/* Hero Section */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 h-80 flex items-center px-12 group">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/30 to-transparent"></div>
                <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-[2000ms]"></div>

                <div className="relative z-10 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit border border-blue-500/30">
                        <Sparkles size={14} /> 2024 精品市场·新课首发
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            成就您的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient">职业梦想</span>
                        </h1>
                        <p className="text-slate-400 text-base font-medium max-w-lg leading-relaxed">
                            为您精心挑选的海量优质课程，由行业顶尖名师亲自打磨。从基础课到实战班，助您在数字时代保持竞争优势。
                        </p>
                    </div>
                    <div className="flex items-center gap-8 pt-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white font-mono">1.2k+</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">活跃学员</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800"></div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white font-mono">4.9/5</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">平均评分</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-0 z-40 py-4 -mt-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl bg-slate-50/80">
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
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
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
                            onClick={() => !isPurchased && handlePurchaseClick(course)}
                            className={`group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden flex flex-col ${isPurchased ? 'opacity-90 grayscale-[0.5]' : 'hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer hover:-translate-y-2'}`}
                        >
                            {/* Thumbnail */}
                            <div className="h-56 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                                <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 ${!isPurchased && 'group-hover:bg-blue-600/10'} transition-all duration-700`}></div>
                                <div className={`relative z-10 w-28 h-28 bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex items-center justify-center text-slate-200 ${!isPurchased && 'group-hover:scale-110 group-hover:rotate-6'} transition-all duration-700`}>
                                    {course.category === '设计' ? <BookOpen size={56} className={`text-blue-100 ${!isPurchased && 'group-hover:text-blue-500'} transition-colors`} /> : <Clock size={56} className={`text-indigo-100 ${!isPurchased && 'group-hover:text-indigo-500'} transition-colors`} />}
                                </div>

                                {isPurchased ? (
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-200 border border-emerald-400/50">
                                        <CheckCircle2 size={14} /> 已在学习中
                                    </div>
                                ) : (
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-slate-900 flex items-center gap-1.5 shadow-xl border border-white/50">
                                        <Flame size={14} className="text-orange-500 animate-pulse" /> 热门推荐
                                    </div>
                                )}

                                {!isPurchased && (
                                    <div className="absolute bottom-4 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-blue-200 uppercase tracking-widest flex items-center gap-2">
                                            立即抢位 <ArrowRight size={12} />
                                        </span>
                                    </div>
                                )}
                            </div>

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
                                        <Clock size={16} className={isPurchased ? 'text-slate-300' : 'text-blue-500'} /> {course.totalLessons} 课时
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <Users size={16} className={isPurchased ? 'text-slate-300' : 'text-indigo-500'} /> 1.2k 学员
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
                                        <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-3xl font-bold text-sm border border-emerald-100 shadow-inner">
                                            <CheckCircle2 size={18} />
                                            <span>已购买</span>
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

            {/* Purchase Help Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-24 translate-x-32 group-hover:scale-125 transition-transform duration-1000"></div>

                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-white shadow-xl border border-white/20">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-white tracking-tight">VIP 选课保障协议</h4>
                        <p className="text-blue-100 text-base font-medium opacity-90">所有通过市场选购的课程，均享有 24 小时开课极速退还权益保障。</p>
                    </div>
                </div>
                <button className="relative z-10 px-10 py-4 bg-white text-blue-700 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95 shrink-0">
                    查阅权益详情
                </button>
            </div>

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
