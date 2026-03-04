
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ArrowRight,
  MonitorPlay,
  Bookmark,
  Share2,
  HelpCircle,
  // Added missing Zap icon import
  Zap
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  duration: string;
  status: 'locked' | 'unlearned' | 'learning' | 'completed';
}

const MOCK_CHAPTERS: Chapter[] = [
  { id: '1', title: '第1章：UI/UX 设计基础概念与趋势', duration: '45min', status: 'completed' },
  { id: '2', title: '第2章：用户研究与竞品分析方法论', duration: '60min', status: 'completed' },
  { id: '3', title: '第3章：原子化设计规范与 Figma 核心工具', duration: '90min', status: 'learning' },
  { id: '4', title: '第4章：多终端响应式布局实战', duration: '120min', status: 'unlearned' },
  { id: '5', title: '第5章：高级动效交互与原型演示', duration: '75min', status: 'unlearned' },
];

interface CourseStudyViewProps {
  onBack: () => void;
  onStartQuiz: (chapterId: string) => void;
}

export const CourseStudyView: React.FC<CourseStudyViewProps> = ({ onBack, onStartQuiz }) => {
  const [activeChapterId, setActiveChapterId] = useState('3');
  const activeChapter = MOCK_CHAPTERS.find(c => c.id === activeChapterId) || MOCK_CHAPTERS[2];

  return (
    <div className="max-w-[1440px] mx-auto animate-in fade-in duration-500 flex flex-col h-full bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="h-10 w-px bg-slate-100"></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">高级UI/UX设计实战全能课</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">24春季1班 · 讲师：李建国</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><Bookmark size={20} /></button>
           <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><Share2 size={20} /></button>
           <button 
             onClick={() => onStartQuiz(activeChapterId)}
             className="ml-4 flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-black transition-all active:scale-95"
           >
             开始本章测验 <Zap size={16} className="text-amber-400" />
           </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-[calc(100vh-200px)]">
        {/* Left: Chapter Sidebar */}
        <div className="w-full lg:w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/30 overflow-y-auto custom-scrollbar">
           <div className="p-8 pb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">课程章节目录</h4>
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">整体进度</p>
                    <p className="text-lg font-bold text-blue-700 font-mono tracking-tighter">75%</p>
                 </div>
                 <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '75%' }}></div>
                 </div>
              </div>
           </div>

           <div className="p-4 space-y-2">
              {MOCK_CHAPTERS.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapterId(chapter.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-[1.75rem] transition-all text-left group ${
                    activeChapterId === chapter.id 
                    ? 'bg-white shadow-xl shadow-slate-200 border border-slate-100' 
                    : 'hover:bg-white hover:shadow-md border border-transparent'
                  }`}
                >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-colors ${
                      chapter.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      chapter.id === activeChapterId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                   }`}>
                      {chapter.status === 'completed' ? <CheckCircle2 size={20} /> : chapter.id}
                   </div>
                   <div className="flex-1 space-y-1">
                      <p className={`text-sm font-bold leading-tight ${activeChapterId === chapter.id ? 'text-blue-600' : 'text-slate-600'}`}>{chapter.title}</p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                         <span className="flex items-center gap-1"><Clock size={12} /> {chapter.duration}</span>
                         {chapter.status === 'learning' && <span className="text-blue-400 uppercase tracking-widest animate-pulse">正在学习</span>}
                      </div>
                   </div>
                   <ChevronRight size={18} className={`text-slate-200 transition-transform ${activeChapterId === chapter.id ? 'text-blue-500 translate-x-1' : ''}`} />
                </button>
              ))}
           </div>
        </div>

        {/* Right: Media & Details Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
           <div className="max-w-4xl mx-auto space-y-10">
              {/* Media Player Placeholder */}
              <div className="aspect-video bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border-[8px] border-slate-50">
                 <div className="absolute inset-0 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1586717791821-3f44a563de4c?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-60"></div>
                 <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
                 <button className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:scale-110 hover:bg-white hover:text-slate-900 transition-all shadow-2xl group">
                    <MonitorPlay size={40} className="ml-1" />
                 </button>
                 <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between text-white z-10">
                    <div className="space-y-1">
                       <p className="text-xs font-bold opacity-60 uppercase tracking-widest">当前观看章节</p>
                       <h4 className="text-lg font-bold">{activeChapter.title}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">00:42 / {activeChapter.duration.replace('min', ':00')}</span>
                 </div>
              </div>

              {/* Study Key Points & Resources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                       <BookOpen size={18} className="text-blue-500" /> 本章学习要点
                    </h5>
                    <ul className="space-y-5">
                       {[
                         '理解原子化组件的设计哲学与应用场景',
                         '掌握 Figma 嵌套组件与变体(Variants)的高级用法',
                         '建立可维护、可扩展的 UI 设计库(Design System)',
                         '组件属性(Properties)的深度解析与逻辑配置',
                       ].map((point, i) => (
                         <li key={i} className="flex gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-100 transition-all">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-sm font-bold text-slate-700 leading-relaxed">{point}</span>
                         </li>
                       ))}
                    </ul>
                 </div>

                 <div className="space-y-8">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                       <Download size={18} className="text-emerald-500" /> 课件与附件下载
                    </h5>
                    <div className="space-y-4">
                       {[
                         { name: '原子化组件系统案例.fig', size: '24.5 MB', type: 'figma' },
                         { name: 'UI设计组件化思维导图.pdf', size: '4.2 MB', type: 'pdf' },
                       ].map((file, i) => (
                         <button key={i} className="w-full flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
                            <div className="flex items-center gap-4 text-left">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                  <FileText size={24} />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-800">{file.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{file.size}</p>
                               </div>
                            </div>
                            <Download size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                         </button>
                       ))}
                       <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                          <HelpCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 font-medium leading-relaxed">提示：若下载缓慢，可尝试切换校区 CDN 加速。资料仅供内部学习使用，严禁外传。</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Footer Navigation */}
      <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <PlayCircle size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">当前章节进度</p>
                  <p className="text-sm font-bold text-slate-900">42% 已学习</p>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="text-xs text-slate-400 font-medium italic">
               上次学习：2024-05-23 10:20
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button className="px-8 py-3.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
               上一章
            </button>
            <button className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2">
               标记本章已完成 <CheckCircle2 size={18} />
            </button>
            <button className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2">
               下一章 <ArrowRight size={18} />
            </button>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};
