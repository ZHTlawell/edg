/**
 * ActionModals.tsx
 * ---------------------------------------------------------------
 * 通用「动作确认」弹窗组件集合。
 * 包含 ConfirmModal（二次确认）与 PromptModal（带输入框的确认）。
 * 被全站各管理页面用于删除/修改/审批等操作前的轻量交互。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import { AlertCircle, HelpCircle, X, Check } from 'lucide-react';

// ConfirmModal 的 props：isOpen 控制显隐，title/message 为文案，
// confirmText/cancelText 可自定义按钮文字，onConfirm/onCancel 为回调
interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmModal —— 通用二次确认弹窗
 * 用途：执行危险/不可逆操作前给用户确认机会（删除、禁用、重置等）
 * 关键交互：点击遮罩或「取消」关闭；点击「确认」触发 onConfirm
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title = '确认操作',
    message,
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 transition-opacity animate-in fade-in" onClick={onCancel} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                            <ElmIcon name="warning" size={16} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-xl shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <ElmIcon name="check" size={16} /> {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// PromptModal 的 props：在确认弹窗基础上增加 placeholder，
// onConfirm 回调接收用户输入的字符串
interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

/**
 * PromptModal —— 带输入框的确认弹窗
 * 用途：需要用户补充文字理由/备注时使用（拒绝原因、退款说明等）
 * 关键交互：Enter 提交、Esc 取消；提交/取消后内部 inputValue 自动清空
 */
export const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    title,
    message,
    placeholder = '请输入...',
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onCancel
}) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(inputValue);
        setInputValue('');
    };

    const handleCancel = () => {
        setInputValue('');
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 transition-opacity animate-in fade-in" onClick={handleCancel} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <ElmIcon name="help-filled" size={16} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{message}</p>

                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSubmit();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <ElmIcon name="check" size={16} /> {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
