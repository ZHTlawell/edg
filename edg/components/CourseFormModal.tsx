
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Calendar as CalendarIcon, Info, Layers, User as UserIcon, MapPin, DollarSign, Search, CheckCircle2 } from 'lucide-react';
import { Course } from '../types';
import { useStore } from '../store';
import api from '../utils/api';

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
  const { currentUser, addToast, teachers, fetchTeachers, campuses, fetchCampuses } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    category: '设计',
    level: '初级',
    price: '',
    totalLessons: 0,
    description: '',
    standard_id: ''
  });

  const [standards, setStandards] = useState<any[]>([]);
  const selectedStandard = standards.find(s => s.id === formData.standard_id);
  const minLessons = selectedStandard ? Math.floor(selectedStandard.total_lessons * 0.8) : 0;
  const maxLessons = selectedStandard ? Math.ceil(selectedStandard.total_lessons * 1.2) : 0;

  useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);

  useEffect(() => {
    if (!isOpen) return;
    api.get('/api/course-standard/standards')
      .then(res => {
        const list = (res.data || []).filter((s: any) => s.status === 'ENABLED' || s.status === 'PUBLISHED');
        setStandards(list);
      })
      .catch(() => setStandards([]));
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (isCampusAdmin) {
      setFormData(prev => ({ ...prev, campus: myCampus }));
    }
  }, [initialData, isCampusAdmin, myCampus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData && !formData.standard_id) {
      addToast('必须选择课程标准（总部教研定义）', 'warning');
      return;
    }
    if (!formData.name) {
      addToast('请填写课程标题', 'warning');
      return;
    }
    if (selectedStandard) {
      const lessons = formData.totalLessons || 0;
      if (lessons < minLessons || lessons > maxLessons) {
        addToast(`课时数 ${lessons} 超出标准建议范围 [${minLessons}, ${maxLessons}]`, 'warning');
        return;
      }
    }
    onSave(formData as Course);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl"><Layers size={20} /></div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? '编辑课程档案' : '录入新课程项目'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><ElmIcon name="close" size={16} /></button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <form id="course-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {!initialData && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    基于课程标准 <span className="text-red-500">*</span>
                    <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal">（由总部教研定义；课程必须基于已发布的标准实例化）</span>
                  </label>
                  <select
                    required
                    className="w-full bg-blue-50 border border-blue-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm font-bold text-blue-700 appearance-none cursor-pointer"
                    value={formData.standard_id || ''}
                    onChange={e => {
                      const selected: any = standards.find(s => s.id === e.target.value);
                      if (selected) {
                        setFormData({
                          ...formData,
                          standard_id: selected.id,
                          name: selected.name,
                          category: selected.category?.name || selected.category_id || '',
                          totalLessons: selected.total_lessons,
                          description: selected.description || '',
                        });
                      } else {
                        setFormData({ ...formData, standard_id: '' });
                      }
                    }}
                  >
                    <option value="">-- 请选择课程标准 --</option>
                    {standards.length === 0 ? (
                      <option disabled>暂无可用标准，请联系总部发布</option>
                    ) : standards.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name} · {s.total_lessons}课时
                      </option>
                    ))}
                  </select>
                  {selectedStandard && (
                    <div className="text-[11px] text-blue-600 font-bold flex items-center gap-2 mt-1">
                      <CheckCircle2 size={12} /> 已选标准「{selectedStandard.name}」 · 建议 {selectedStandard.total_lessons} 课时（允许范围 {minLessons}~{maxLessons}）
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程标题 <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <Info size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                  <input
                    type="text" required autoFocus
                    readOnly={!!formData.standard_id}
                    className={`w-full ${formData.standard_id ? 'bg-slate-100' : 'bg-slate-50'} border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold text-slate-900`}
                    placeholder="例如：2024 高级商业插画研修班"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程类型</label>
                <select
                  disabled={!!formData.standard_id}
                  className={`w-full ${formData.standard_id ? 'bg-slate-100' : 'bg-slate-50'} border border-slate-200 rounded-xl py-3.5 px-4 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer`}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="初级">初级基础</option>
                  <option value="中级">中级提升</option>
                  <option value="高级">高级研修</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">收费策略 <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 pointer-events-none" />
                  <input
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-emerald-600"
                    placeholder="如：¥4,800.00"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  总课时数 {selectedStandard && <span className="text-blue-600 normal-case tracking-normal">（允许 {minLessons}~{maxLessons}）</span>}
                </label>
                <input
                  type="number"
                  min={selectedStandard ? minLessons : undefined}
                  max={selectedStandard ? maxLessons : undefined}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900"
                  value={formData.totalLessons || 0}
                  onChange={e => setFormData({ ...formData, totalLessons: parseInt(e.target.value) || 0 })}
                />
              </div>

              {!isCampusAdmin && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">适用校区</label>
                  <div className="relative group">
                    <ElmIcon name="location" size={16} />
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                      value={formData.campus || ''}
                      onChange={e => setFormData({ ...formData, campus: e.target.value })}
                    >
                      {(campuses || []).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程详情描述</label>
                <textarea
                  rows={3}
                  readOnly={!!formData.standard_id}
                  className={`w-full ${formData.standard_id ? 'bg-slate-100' : 'bg-slate-50'} border border-slate-200 rounded-xl py-4 px-4 outline-none transition-all resize-none text-sm font-medium text-slate-600`}
                  placeholder="在此输入该课程的核心教学大纲、学习目标等..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-amber-700 text-xs font-bold border border-amber-100/50">
              <ElmIcon name="warning" size={16} />
              <span>提醒：保存后，该课程项目将立即同步至教务选课池。请核对价格策略是否准确。</span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-end gap-5 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-8 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">取消</button>
          <button
            type="submit"
            form="course-form"
            className="px-12 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center gap-2 active:scale-95"
          >
            <Save size={20} />
            保存并发布课程
          </button>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        `}} />
      </div>
    </div>
  );
};
