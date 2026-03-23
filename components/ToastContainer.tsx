import { ElmIcon } from './ElmIcon';
import React from 'react';
import { useStore } from '../store';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastType } from '../store';

const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
        case 'success':
            return <ElmIcon name="circle-check" size={16} />;
        case 'error':
            return <ElmIcon name="warning" size={16} />;
        case 'warning':
            return <ElmIcon name="warning" size={16} />;
        case 'info':
        default:
            return <Info className="text-blue-500" size={20} />;
    }
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useStore();

    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-200/50
                        border animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md
                        ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' :
                            toast.type === 'error' ? 'bg-red-50/90 border-red-100 text-red-800' :
                                toast.type === 'warning' ? 'bg-orange-50/90 border-orange-100 text-orange-800' :
                                    'bg-blue-50/90 border-blue-100 text-blue-800'}
                    `}
                >
                    <ToastIcon type={toast.type} />
                    <span className="text-sm font-bold min-w-[200px]">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 hover:bg-black/5 p-1 rounded-full transition-colors"
                    >
                        <ElmIcon name="close" size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
