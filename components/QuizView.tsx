
import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  CheckCircle2,
  AlertCircle,
  Send,
  HelpCircle
} from 'lucide-react';

interface Question {
  id: number;
  type: 'single' | 'multiple';
  text: string;
  options: { id: string; label: string; text: string }[];
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'single',
    text: '在原子化设计理论(Atomic Design)中，以下哪一项属于最小的物理单位？',
    options: [
      { id: 'A', label: 'A', text: '原子 (Atoms)' },
      { id: 'B', label: 'B', text: '分子 (Molecules)' },
      { id: 'C', label: 'C', text: '组织 (Organisms)' },
      { id: 'D', label: 'D', text: '模板 (Templates)' },
    ]
  },
  {
    id: 2,
    type: 'multiple',
    text: '关于 Figma 组件变量(Variants)的描述，以下哪些是正确的？(多选)',
    options: [
      { id: 'A', label: 'A', text: '可以将不同状态的组件组织在一起' },
      { id: 'B', label: 'B', text: '可以减少组件库中冗余的命名' },
      { id: 'C', label: 'C', text: '支持 Boolean 类型开关控制' },
      { id: 'D', label: 'D', text: '只能在一个文件内生效' },
    ]
  },
  {
    id: 3,
    type: 'single',
    text: '当设计系统(Design System)的颜色发生全局变更时，最有效的处理方式是？',
    options: [
      { id: 'A', label: 'A', text: '手动逐个页面修改' },
      { id: 'B', label: 'B', text: '通过更新全局颜色样式库一键应用' },
      { id: 'C', label: 'C', text: '重新创建所有组件' },
      { id: 'D', label: 'D', text: '让开发直接在代码层级覆盖' },
    ]
  }
];

interface QuizViewProps {
  chapterTitle: string;
  onBack: () => void;
  onSubmit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ chapterTitle, onBack, onSubmit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [isFlagged, setIsFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [showConfirm, setShowConfirm] = useState(false);

  const currentQuestion = MOCK_QUESTIONS[currentIdx];

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (optionId: string) => {
    const currentAnswers = answers[currentQuestion.id] || [];
    if (currentQuestion.type === 'single') {
      setAnswers({ ...answers, [currentQuestion.id]: [optionId] });

      // Auto jump to next question if it's not the last one
      if (!isLastQuestion) {
        setTimeout(() => {
          setCurrentIdx(prev => prev + 1);
        }, 600); // 600ms buffer for user to see their selection
      }
    } else {
      if (currentAnswers.includes(optionId)) {
        setAnswers({ ...answers, [currentQuestion.id]: currentAnswers.filter(id => id !== optionId) });
      } else {
        setAnswers({ ...answers, [currentQuestion.id]: [...currentAnswers, optionId] });
      }
    }
  };

  const isLastQuestion = currentIdx === MOCK_QUESTIONS.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === MOCK_QUESTIONS.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col animate-in fade-in duration-500">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIdx + 1) / MOCK_QUESTIONS.length) * 100}%` }}></div>
      </div>

      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><X size={24} /></button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">章节测验：{chapterTitle}</h2>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">当前进度：{currentIdx + 1} / {MOCK_QUESTIONS.length} 题</span>
              <div className="h-3 w-px bg-slate-200"></div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <Clock size={14} /> {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {allAnswered && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <CheckCircle2 size={14} /> 全部答完，立即提交
            </button>
          )}
          <button
            onClick={() => setIsFlagged({ ...isFlagged, [currentQuestion.id]: !isFlagged[currentQuestion.id] })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${isFlagged[currentQuestion.id] ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
              }`}
          >
            <Flag size={14} fill={isFlagged[currentQuestion.id] ? 'currentColor' : 'none'} /> 标记疑问
          </button>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${currentQuestion.type === 'single' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                }`}>
                {currentQuestion.type === 'single' ? '单选题' : '多选题'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 leading-relaxed">{currentQuestion.text}</h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`group w-full flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 scale-[1.01]'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}>
                      {opt.label}
                    </div>
                    <span className="text-base font-bold leading-relaxed">{opt.text}</span>
                    {isSelected && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation Bubbles */}
          <div className="pt-10 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {MOCK_QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative ${currentIdx === idx ? 'ring-4 ring-blue-50 border-2 border-blue-600 text-blue-600 scale-110 z-10 bg-white shadow-lg' :
                      answers[q.id] ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                >
                  {idx + 1}
                  {isFlagged[q.id] && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                  {answers[q.id] && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${allAnswered ? 'bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">已完成：{answeredCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">未回答：{MOCK_QUESTIONS.length - answeredCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="px-8 py-3.5 border border-slate-200 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} /> 上一题
          </button>
          {isLastQuestion ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-12 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Send size={18} /> 提交测验
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(Math.min(MOCK_QUESTIONS.length - 1, currentIdx + 1))}
              className="px-12 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
            >
              下一题 <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Submission Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowConfirm(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-blue-50/50">
                <HelpCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">确认提交测验？</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  您当前已答 <span className="text-blue-600 font-bold">{answeredCount}</span> 题，未答 <span className="text-red-500 font-bold">{MOCK_QUESTIONS.length - answeredCount}</span> 题。<br />
                  提交后将立即进行系统自动判分，未答题目将记为 0 分。
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">取消</button>
              <button onClick={onSubmit} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">确定提交</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
};
