
import React from 'react';
import { X, CreditCard, Clock, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Course } from '../types';

interface PurchaseConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    course: Course | null;
    studentName: string;
}

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    course,
    studentName
}) => {
    if (!isOpen || !course) return null;

    const amount = parseFloat(course.price.replace(/[^\d.]/g, '')) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                            <ShoppingCart size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">选购课程确认</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                            {studentName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">购课学员账户</p>
                            <p className="text-sm font-bold text-slate-900">{studentName}</p>
                        </div>
                    </div>

                    {/* Course Summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{course.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {course.totalLessons} 课时</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {course.category}课程</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">预估结算</p>
                                <p className="text-2xl font-bold text-blue-600 font-mono italic">¥{amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                        <AlertCircle size={18} className="text-amber-600 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-800">支付与退收须知</p>
                            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                确认购买后，对应课时将立即存入您的资产账户。根据《学员退收协议》，支持 24 小时内未开课全额退款。
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            我再想想
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-3 px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CreditCard size={18} />
                            确认支付并开启学习
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
