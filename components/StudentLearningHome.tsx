
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  FileText, 
  Trophy, 
  ChevronRight, 
  Home, 
  Calendar, 
  GraduationCap, 
  User,
  ArrowRight,
  Zap,
  History
} from 'lucide-react';

interface CourseProgress {
  id: string;
  title: string;
  level: string;
  class: string;
  progress: number;
  lastLesson: string;
  status: 'learning' | 'completed';
  type: 'design' | 'coding' | 'data';
  thumbnailColor: string;
}

const MOCK_STUDENT_COURSES: CourseProgress[] = [
  { id: 'LC001', title: '高级UI/UX设计实战全能课', level: '高级', class: '24春季1班', progress: 75, lastLesson: '第12课：复杂表格系统组件化', status: 'learning', type: 'design', thumbnailColor: 'bg-blue-500' },
  { id: 'LC002', title: 'React 18 企业级项目从零到一', level: '中级', class: '前端精英班', progress: 100, lastLesson: '第24课：项目结课与部署发布', status: 'completed', type: 'coding', thumbnailColor: 'bg-indigo-500' },
  { id: 'LC003', title: '商业数据分析与可视化看板', level: '初级', class: '数据分析A班', progress: 32, lastLesson: '第05课：SQL 基础聚合查询', status: 'learning', type: 'data', thumbnailColor: 'bg-emerald-500' },
  { id: 'LC004', title: 'Figma 插件开发与工作流优化', level: '高级', class: '极客兴趣组', progress: 15, lastLesson: '第02课：API 环境搭建', status: 'learning', type: 'design', thumbnailColor: 'bg-rose-500' },
];

interface Props {
  onSelectCourse?: (id: string) => void;
}

export const StudentLearningHome: React.FC<Props> = ({ onSelectCourse }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'learning' | 'completed'>('learning');

  const filteredCourses = useMemo(() => {
    return MOCK_STUDENT_COURSES.filter(c => 
      (c.title.includes(searchTerm) || c.lastLesson.includes(searchTerm)) &&
      (c.status === activeTab)
    );
  }, [searchTerm, activeTab]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-32 pt-4">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">在线学习</h1>
          <p className="text-slate-500 font-medium">勤学如春起之苗，不见其增，日有所长。</p>
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
            placeholder="搜索课程名称、章节关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('learning')}
            className={`flex-1 md:px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'learning' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >学习中</button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 md:px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >已完成</button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredCourses.map((course) => (
          <div 
            key={course.id} 
            onClick={() => onSelectCourse?.(course.id)}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden flex flex-col cursor-pointer"
          >
             <div className="p-8 space-y-6 flex-1">
                <div className="flex items-start justify-between">
                   <div className={`w-14 h-14 ${course.thumbnailColor} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-500`}>
                      {course.type === 'design' && <BookOpen size={28} />}
                      {course.type === 'coding' && <Zap size={28} />}
                      {course.type === 'data' && <FileText size={28} />}
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${course.status === 'learning' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {course.status === 'learning' ? '正在学习' : '结课合格'}
                   </span>
                </div>

                <div className="space-y-1.5">
                   <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                   <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{course.level} · {course.class}</p>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学习进度</span>
                      <span className={`text-sm font-bold font-mono ${course.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'}`}>{course.progress}%</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${course.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full transition-all duration-1000`} 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                   <PlayCircle size={18} className="text-slate-400 group-hover:text-blue-500 mt-0.5" />
                   <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">最近观看章节</p>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[240px]">{course.lastLesson}</p>
                   </div>
                </div>
             </div>

             <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <Clock size={14}/> 累计学时 24.5H
                </div>
                <button 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${course.status === 'completed' ? 'bg-white border border-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}
                >
                   {course.status === 'completed' ? '回顾复习' : '继续学习'} <ArrowRight size={14}/>
                </button>
             </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
