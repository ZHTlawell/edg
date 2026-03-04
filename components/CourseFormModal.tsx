
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Calendar as CalendarIcon, Info, Layers, User as UserIcon, MapPin, DollarSign } from 'lucide-react';
import { Course, CourseStatus } from '../types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  initialData: Course | null;
}

const ModalDatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "选择日期" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleContainerClick = () => {
    if (inputRef.current && 'showPicker' in inputRef.current) {
      try { inputRef.current.showPicker(); } catch (e) { inputRef.current.focus(); }
    }
  };
  return (
    <div className="relative group h-[52px] w-full cursor-pointer" onClick={handleContainerClick}>
      <div className="absolute inset-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all group-focus-within:ring-4 group-focus-within:ring-blue-50 group-focus-within:border-blue-500 group-focus-within:bg-white pointer-events-none z-0">
        <CalendarIcon size={18} className="text-slate-400 mr-2 group-focus-within:text-blue-500 transition-colors" />
        <span className={`text-sm font-bold ${value ? 'text-slate-900' : 'text-slate-300'}`}>{value || placeholder}</span>
      </div>
      <input 
        ref={inputRef}
        type="date" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="modal-date-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
};

export const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    code: '',
    category: '设计',
    level: '初级',
    instructor: '',
    totalLessons: 10,
    price: '',
    campus: '总校区',
    startDate: new Date().toISOString().split('T')[0],
    status: 'enabled',
    description: ''
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.instructor) {
      alert('请确保必填项已正确填写');
      return;
    }
    onSave(formData as Course);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl"><Layers size={20} /></div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? '编辑课程档案' : '录入新课程项目'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程标题 <span className="text-red-500">*</span></label>
              <div className="relative group">
                <Info size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                <input
                  type="text" required autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900"
                  placeholder="例如：2024 高级商业插画研修班"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程类型</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="设计">视觉设计</option>
                <option value="编程">编程开发</option>
                <option value="数据">数据分析</option>
                <option value="职场">职场技能</option>
                <option value="艺术">艺术文化</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">难度级别</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                value={formData.level}
                onChange={e => setFormData({...formData, level: e.target.value})}
              >
                <option value="初级">初级基础</option>
                <option value="中级">中级提升</option>
                <option value="高级">高级研修</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">主讲导师 <span className="text-red-500">*</span></label>
              <div className="relative group">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                <input
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                  placeholder="导师姓名"
                  value={formData.instructor}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">收费策略 <span className="text-red-500">*</span></label>
              <div className="relative group">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 pointer-events-none" />
                <input
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-emerald-600"
                  placeholder="如：¥4,800.00"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">总课时数</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                value={formData.totalLessons}
                onChange={e => setFormData({...formData, totalLessons: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">适用校区</label>
              <div className="relative group">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                  value={formData.campus}
                  onChange={e => setFormData({...formData, campus: e.target.value})}
                >
                  <option value="总校区">总部旗舰校</option>
                  <option value="浦东校区">浦东分校</option>
                  <option value="静安校区">静安分校</option>
                </select>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程详情描述</label>
              <textarea
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all resize-none text-sm font-medium text-slate-600"
                placeholder="在此输入该课程的核心教学大纲、学习目标等..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-amber-700 text-xs font-bold border border-amber-100/50">
            <AlertCircle size={18} />
            <span>提醒：保存后，该课程项目将立即同步至教务选课池。请核对价格策略是否准确。</span>
          </div>

          <div className="pt-6 flex items-center justify-end gap-5 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-8 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">取消</button>
            <button
              type="submit"
              className="px-12 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center gap-2 active:scale-95"
            >
              <Save size={20} />
              保存并发布课程
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
