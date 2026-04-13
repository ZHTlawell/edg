import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, CheckCircle2, XCircle, Loader2, CreditCard } from 'lucide-react';
import { useStore } from '../store';

interface MockPaymentModalProps {
    orderId: string | null;
    amount: number;
    campusId: string;
    classId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CHANNELS = [
    { id: 'Wechat', label: '微信支付', color: 'bg-emerald-500' },
    { id: 'Alipay', label: '支付宝', color: 'bg-sky-500' },
    { id: 'Bank', label: '银行卡', color: 'bg-indigo-500' },
    { id: 'Cash', label: '现金', color: 'bg-slate-500' },
];

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ orderId, amount, campusId, classId, onClose, onSuccess }) => {
    const { processPayment, getPaymentStatus, addToast } = useStore();
    const [channel, setChannel] = useState<string>('Wechat');
    const [stage, setStage] = useState<'choose' | 'qrcode' | 'processing' | 'done'>('choose');
    const [countdown, setCountdown] = useState(60);
    const pollingRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const handleChannelConfirm = () => {
        if (channel === 'Cash') {
            // 现金走简化流程
            handleFinishPayment();
            return;
        }
        setStage('qrcode');
        // 启动轮询（展示异步回调机制）
        if (orderId) {
            pollingRef.current = setInterval(async () => {
                try {
                    const st = await getPaymentStatus(orderId);
                    if (st.status === 'PAID') {
                        clearInterval(pollingRef.current);
                        setStage('done');
                        onSuccess();
                    }
                } catch {}
            }, 2000);
        }
        // 倒计时
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleFinishPayment = async () => {
        if (!orderId) return;
        setStage('processing');
        try {
            await processPayment({ orderId, amount, channel, campusId, classId });
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setStage('done');
            onSuccess();
        } catch (e: any) {
            addToast(e.message || '支付失败', 'error');
            setStage('choose');
        }
    };

    const handleCancel = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        onClose();
    };

    const selectedChannelMeta = CHANNELS.find(c => c.id === channel);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-900">完成支付</h3>
                    </div>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {/* 金额展示 */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">订单金额</p>
                        <p className="text-4xl font-bold text-slate-900 font-mono">¥ {amount.toFixed(2)}</p>
                        {orderId && <p className="text-[10px] text-slate-400 mt-2 font-mono">订单号: {orderId.slice(0, 8)}...</p>}
                    </div>

                    {stage === 'choose' && (
                        <>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">选择支付方式</p>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {CHANNELS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setChannel(c.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${channel === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg ${c.color} mb-2`} />
                                        <p className="text-sm font-bold text-slate-900">{c.label}</p>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleChannelConfirm}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all"
                            >
                                确认支付
                            </button>
                        </>
                    )}

                    {stage === 'qrcode' && (
                        <div className="text-center">
                            <div className="w-52 h-52 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center relative">
                                <QrCode size={120} className="text-slate-800" />
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-lg ${selectedChannelMeta?.color}`} />
                            </div>
                            <p className="text-sm font-semibold text-slate-600 mb-1">请使用{selectedChannelMeta?.label}扫描二维码</p>
                            <p className="text-xs text-slate-400 mb-4">
                                {countdown > 0 ? `二维码将在 ${countdown} 秒后失效` : '二维码已失效'}
                            </p>
                            <button
                                onClick={handleFinishPayment}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all mb-2"
                            >
                                模拟支付成功
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full border border-slate-200 text-slate-500 font-semibold py-2 rounded-2xl hover:bg-slate-50"
                            >
                                取消支付
                            </button>
                        </div>
                    )}

                    {stage === 'processing' && (
                        <div className="py-8 text-center">
                            <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 font-semibold">支付处理中...</p>
                            <p className="text-xs text-slate-400 mt-1">请稍候，正在与支付网关通信</p>
                        </div>
                    )}

                    {stage === 'done' && (
                        <div className="py-8 text-center">
                            <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-3" />
                            <p className="text-lg font-bold text-slate-900">支付成功</p>
                            <p className="text-xs text-slate-400 mt-1">课时资产已入账</p>
                            <button
                                onClick={onClose}
                                className="mt-4 w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800"
                            >
                                完成
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
