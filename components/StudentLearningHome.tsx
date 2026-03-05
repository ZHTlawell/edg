
import React, { useState, useMemo } from 'react';
import {
  Search,
  PlayCircle,
  Clock,
  BookOpen,
  FileText,
  Trophy,
  ChevronRight,
  ArrowRight,
  Zap,
  History
} from 'lucide-react';
import { useStore } from '../store';

interface Props {
  onSelectCourse?: (id: string) => void;
}

export const StudentLearningHome: React.FC<Props> = ({ onSelectCourse }) => {
  const { assetAccounts, courses, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'learning' | 'completed'>('learning');

  const myCourses = useMemo(() => {
    if (!currentUser?.bindStudentId) return [];

    // Get asset accounts for current student
    const myAssets = assetAccounts.filter(acc => acc.studentId === currentUser.bindStudentId && acc.remainingQty > 0);

    // Join with course details
    return myAssets.map(asset => {
      const course = courses.find(c => c.id === asset.courseId);
      return {
        id: asset.courseId,
        title: course?.name || '未知课程',
        level: course?.level || '中级',
        category: course?.category || '设计',
        remainingQty: asset.remainingQty,
        totalQty: asset.totalQty,
        // Mock progress for demo, in real life this would come from a StudyProgress table
        progress: Math.floor(Math.random() * 40) + 20,
        lastLesson: '第01课：课程导学与环境配置',
        status: 'learning' as const
      };
    });
  }, [assetAccounts, courses, currentUser]);

  const filteredCourses = useMemo(() => {
    return myCourses.filter(c =>
      c.title.includes(searchTerm) &&
      (activeTab === 'learning' ? c.progress < 100 : c.progress === 100)
    );
  }, [myCourses, searchTerm, activeTab]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-32 pt-4">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">在线学习中心</h1>
          <p className="text-slate-500 font-medium">您当前的专属进阶路径，共有 {myCourses.length} 门在研课程。</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <History size={18} className="text-blue-500" /> 学习记录
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Trophy size={18} className="text-amber-500" /> 我的测验
          </button>
        </div>
      </div>

      {/* Search & Filter Matrix */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="搜索课程名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('learning')}
            className={`flex-1 md:px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'learning' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >正在研读</button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 md:px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >已修毕</button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredCourses.length > 0 ? filteredCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse?.(course.id)}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all group overflow-hidden flex flex-col cursor-pointer border-b-4 border-b-blue-500"
          >
            <div className="p-8 space-y-6 flex-1">
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 ${course.category === '设计' ? 'bg-blue-600' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-500 ring-4 ring-white`}>
                  {course.category === '设计' ? <BookOpen size={28} /> : <Zap size={28} />}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-100`}>
                    {course.remainingQty} 剩余学时
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{course.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">{course.level}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{course.category}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学习进度分析</span>
                  <span className="text-sm font-bold font-mono text-blue-600">{course.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                  <PlayCircle size={20} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">正在攻克章节</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{course.lastLesson}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock size={14} /> 总投入学时 {course.totalQty}H
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xl hover:bg-blue-600 active:scale-95 group/btn"
              >
                进入课室 <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )) : (
          <div className="md:col-span-2 py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <BookOpen size={48} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-slate-600">暂无已购课程资产</p>
              <p className="text-sm text-slate-400 font-medium">您可以前往“精品市场”浏览并开启您的学习之旅。</p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
              前往市场购课
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
