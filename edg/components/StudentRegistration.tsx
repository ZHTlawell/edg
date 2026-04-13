
import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import {
    User,
    Smartphone,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Mail,
    Building2
} from 'lucide-react';
import { useStore } from '../store';

interface StudentRegistrationProps {
    onBack: () => void;
}

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({ onBack }) => {
    const { register, addToast, campuses } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        gender: 'male' as 'male' | 'female',
        campus: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            addToast('两次输入的密码不一致', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await register({
                username: formData.username,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                gender: formData.gender,
                campus: formData.campus
            });
            addToast('注册成功，请等待校区管理员审核通过后再登录', 'success');
            onBack();
        } catch {
            // handled in store
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 focus:bg-white transition-all text-sm text-slate-900 font-bold shadow-sm placeholder:text-slate-300";

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                返回登录
            </button>

            <div className="mb-8 text-left space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    学员自主注册
                    <ElmIcon name="circle-check" size={16} />
                </h2>
                <p className="text-slate-400 text-sm font-medium">开启您的智慧学习之旅，仅需几步即可完成</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">真实姓名</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                                <ElmIcon name="user" size={16} />
                            </div>
                            <input type="text" required value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses} placeholder="例: 张三" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">性别</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, gender: 'male' })}
                                className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${formData.gender === 'male' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>男</button>
                            <button type="button" onClick={() => setFormData({ ...formData, gender: 'female' })}
                                className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${formData.gender === 'female' ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>女</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">就读学校</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                            <ElmIcon name="house" size={16} />
                        </div>
                        <select
                            required
                            value={formData.campus}
                            onChange={e => setFormData({ ...formData, campus: e.target.value })}
                            className={`${inputClasses} appearance-none`}
                        >
                            <option value="" disabled hidden>-- 请选择已注册的校区 --</option>
                            {(campuses || []).map(campus => (
                                <option key={campus.id} value={campus.name}>{campus.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">登录账号 / 手机号</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><Smartphone size={16} /></div>
                        <input type="text" required value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className={inputClasses} placeholder="请输入手机号作为账号" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">联系电话</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><Mail size={16} /></div>
                        <input type="tel" required value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className={inputClasses} placeholder="常用联系方式" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">设置密码</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><Lock size={16} /></div>
                            <input type="password" required value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={inputClasses} placeholder="******" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">确认密码</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"><Lock size={16} /></div>
                            <input type="password" required value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={inputClasses} placeholder="******" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isLoading || !formData.campus}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-70 mt-4">
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                        <>
                            <span className="tracking-tight">提交注册信息</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
