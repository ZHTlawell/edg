
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  initialData: Course | null;
}

/**
 * 统一的日期选择器组件逻辑 (Modal 紧凑修复版)
 */
const ModalDatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "选择日期" }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (inputRef.current && 'showPicker' in inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (e) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div 
      className="relative group h-[42px] w-full cursor-pointer"
      onClick={handleContainerClick}
    >
      {/* 视觉层 */}
      <div className="absolute inset-0 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 transition-all group-focus-within:ring-2 group-focus-within:ring-blue-100 group-focus-within:border-blue-500 group-focus-within:bg-white pointer-events-none z-0">
        <CalendarIcon size={16} className="text-slate-400 mr-2 group-focus-within:text-blue-500 transition-colors" />
        <span className={`text-sm font-medium ${value ? 'text-slate-700' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>
      </div>
      
      {/* 交互层 */}
      <input 
        ref={inputRef}
        type="date" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="modal-date-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{ colorScheme: 'light' }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          cursor: pointer;
          opacity: 0;
        }
      `}} />
    </div>
  );
};

export const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    description: '',
    instructor: '',
    totalLessons: 10,
    startDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    category: '未分类'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.instructor) {
      alert('请填写课程名称和讲师姓名');
      return;
    }
    onSave(formData as Course);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? '编辑课程' : '发布新课程'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">课程标题 <span className="text-red-500">*</span></label>
              <input
                autoFocus
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                placeholder="例如：高级产品经理修炼之道"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">课程分类</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="设计">设计</option>
                <option value="编程">编程</option>
                <option value="数据">数据</option>
                <option value="职场">职场</option>
                <option value="艺术">艺术</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">主讲讲师 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                placeholder="讲师姓名"
                value={formData.instructor}
                onChange={e => setFormData({...formData, instructor: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">总课时</label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                value={formData.totalLessons}
                onChange={e => setFormData({...formData, totalLessons: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">开课日期</label>
              <ModalDatePicker 
                value={formData.startDate || ''}
                onChange={(val) => setFormData({...formData, startDate: val})}
                placeholder="选择开课日期"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">当前状态</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as CourseStatus})}
              >
                <option value="pending">筹备中</option>
                <option value="ongoing">连载中</option>
                <option value="completed">已结课</option>
              </select>
            </div>
            
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">课程描述</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none font-medium"
                placeholder="简短介绍一下这门课程的内容..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs font-semibold">
            <AlertCircle size={16} />
            <span>提示：发布后，该课程将同步出现在学员的选课列表中。</span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-100 flex items-center gap-2 active:scale-95"
            >
              <Save size={18} />
              保存课程
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
