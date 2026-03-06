import React, { useState, useRef } from 'react';
import {
    User,
    Smartphone,
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    GraduationCap,
    ShieldCheck,
    UploadCloud,
    ChevronDown,
    X,
    FileText
} from 'lucide-react';
import { useStore } from '../store';

interface TeacherRegistrationProps {
    onBack: () => void;
}

type Step = 1 | 2 | 3;

export const TeacherRegistration: React.FC<TeacherRegistrationProps> = ({ onBack }) => {
    const { registerTeacher, addToast } = useStore();
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        phone: '',
        code: '',
        school: '',
        degree: '',
        years: '',
        resume: '',
        password: '',
        confirmPassword: '',
        campusName: '',
        certificate: null as File | null
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sendCodeCountdown, setSendCodeCountdown] = useState(0);

    const handleSendCode = () => {
        if (!formData.phone) {
            addToast('请输入常用手机号', 'warning');
            return;
        }
        setSendCodeCountdown(60);
        const timer = setInterval(() => {
            setSendCodeCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        addToast('验证码发送成功 (测试环境固定为 1234)', 'info');
    };

    const nextStep = () => {
        console.log('TeacherRegistration: nextStep clicked', { step, formData });
        if (step === 1) {
            const { name, gender, phone, code, password, confirmPassword, campusName } = formData;
            if (!name.trim() || !gender || !phone.trim() || !password || !confirmPassword || !campusName) {
                console.warn('TeacherRegistration: Validation failed - missing fields');
                addToast('请完整填写基本资料及登录密码', 'warning');
                return;
            }
            if (password !== confirmPassword) {
                addToast('两次输入的密码不一致', 'error');
                return;
            }
            if (code.trim() !== '1234') {
                console.warn('TeacherRegistration: Validation failed - wrong code', code);
                addToast('验证码不正确，请输入 1234', 'error');
                return;
            }
            console.log('TeacherRegistration: Proceeding to step 2');
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        if (!formData.years || !formData.resume || !formData.certificate) {
            addToast('请填写教龄、个人简历并上传证件', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            await registerTeacher({
                username: formData.phone, // 使用手机号作为账号
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                role: 'teacher',
                campusName: formData.campusName,
                extras: {
                    gender: formData.gender,
                    school: formData.school,
                    degree: formData.degree,
                    years: formData.years,
                    resume: formData.resume,
                    certificateName: formData.certificate?.name
                }
            });
            setStep(3);
        } catch {
            // Error handled in store
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full bg-[#f8fafc]/50 border border-slate-200 rounded-2xl py-3.5 px-5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all text-sm text-slate-900 font-bold shadow-sm placeholder:text-slate-300";
    const selectClasses = "w-full bg-[#f8fafc]/50 border border-slate-200 rounded-2xl py-3.5 px-5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all text-sm text-slate-900 font-bold shadow-sm appearance-none cursor-pointer";

    return (
        <div className="w-full max-w-4xl mx-auto space-y-10 py-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">教师入驻申请</h1>
                <p className="text-slate-500 font-medium">欢迎加入我们，请填写您的基本个人资料开始入驻流程</p>
            </div>

            {/* Stepper UI */}
            <div className="flex items-center justify-center max-w-3xl mx-auto relative px-10">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                <div className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: step === 1 ? '5%' : step === 2 ? '50%' : '100%' }}></div>

                <div className="flex justify-between w-full relative z-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                            {step > 1 ? <CheckCircle2 size={24} /> : '1'}
                        </div>
                        <span className={`text-xs font-extrabold uppercase tracking-widest ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>基本信息</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                            {step > 2 ? <CheckCircle2 size={24} /> : '2'}
                        </div>
                        <span className={`text-xs font-extrabold uppercase tracking-widest ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>授课资质</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${step >= 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                            3
                        </div>
                        <span className={`text-xs font-extrabold uppercase tracking-widest ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>提交审核</span>
                    </div>
                </div>
            </div>

            {/* Main Form Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
                {/* Section Header */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center gap-3 text-slate-800">
                        {step === 1 ? <User className="text-blue-500" size={20} /> : step === 2 ? <ShieldCheck className="text-blue-500" size={20} /> : <CheckCircle2 className="text-emerald-500" size={20} />}
                        <h2 className="text-lg font-bold">
                            {step === 1 ? '第一步：基本资料' : step === 2 ? '第二步：授课资质' : '申请提交成功'}
                        </h2>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Row 1 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">姓名<span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入您的真实姓名"
                                    className={inputClasses}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">性别<span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select
                                        className={selectClasses}
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="" disabled>请选择性别</option>
                                        <option value="male">男</option>
                                        <option value="female">女</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={18} />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">联系电话<span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    placeholder="请输入11位手机号码"
                                    className={inputClasses}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">短信验证码<span className="text-red-500">*</span></label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="6位验证码"
                                        className={inputClasses}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        disabled={sendCodeCountdown > 0}
                                        onClick={handleSendCode}
                                        className="bg-blue-50 border border-blue-100 text-blue-600 px-6 rounded-2xl text-xs font-bold hover:bg-blue-100 transition-all whitespace-nowrap min-w-[120px] disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400"
                                    >
                                        {sendCodeCountdown > 0 ? `${sendCodeCountdown}s` : '获取验证码'}
                                    </button>
                                </div>
                            </div>

                            {/* Row 4 - Campus Selection */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">申请加入校区<span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <select
                                        className={selectClasses}
                                        value={formData.campusName}
                                        onChange={e => setFormData({ ...formData, campusName: e.target.value })}
                                    >
                                        <option value="" disabled>请选择意向校区</option>
                                        <option value="总校区">总校区</option>
                                        <option value="浦东校区">浦东校区</option>
                                        <option value="静安校区">静安校区</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={18} />
                                </div>
                            </div>

                            {/* Row 5 - Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">设置登录密码<span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="不少于 6 位密码"
                                        className={`${inputClasses} pl-12`}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-1 ml-1">确认登录密码<span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="请再次输入密码"
                                        className={`${inputClasses} pl-12`}
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* 教龄 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">教龄 (年) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    placeholder="请输入累计教龄"
                                    className={inputClasses}
                                    value={formData.years}
                                    onChange={e => setFormData({ ...formData, years: e.target.value })}
                                />
                            </div>

                            {/* 简历 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">个人简历 <span className="text-red-500">*</span></label>
                                <textarea
                                    placeholder="请阐述您的教育背景、工作经历以及教学成就 (建议300字以内)"
                                    rows={5}
                                    className={`${inputClasses} resize-none font-medium leading-relaxed`}
                                    value={formData.resume}
                                    onChange={e => setFormData({ ...formData, resume: e.target.value })}
                                />
                            </div>

                            {/* 资质上传卡片 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">教师资格证上传 <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setFormData({ ...formData, certificate: file });
                                    }}
                                />
                                {formData.certificate ? (
                                    <div className="border-2 border-blue-100 rounded-[1.5rem] bg-blue-50/30 p-8 flex items-center justify-between group animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-800">{formData.certificate.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{(formData.certificate.size / 1024).toFixed(1)} KB • 已选择</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFormData({ ...formData, certificate: null });
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/20 p-12 transition-all hover:border-blue-400 hover:bg-blue-50/20 group cursor-pointer flex flex-col items-center gap-4"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                            <UploadCloud size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-extrabold text-slate-800">点击或将文件拖拽至此处上传</p>
                                            <p className="text-xs text-slate-400 font-medium mt-1">支持 JPG, PNG, PDF 格式，文件大小不超过 5MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center py-10 space-y-6 animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-100/50 scale-110">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">申请提交成功</h3>
                                <p className="text-slate-500 font-medium max-w-[320px] mx-auto leading-relaxed">
                                    您的教师入驻申请已成功提交至后台。<br />我们将会在 1-3 个工作日内完成审核。
                                </p>
                            </div>
                            <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-sm text-slate-500 font-medium mb-4">
                                📱 您可使用注册时的手机号登录查看审核进度。
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                {step < 3 && (
                    <div className="p-8 pt-0 flex flex-col items-center gap-6">
                        <button
                            type="button"
                            onClick={step === 1 ? nextStep : handleSubmit}
                            disabled={isLoading}
                            className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-blue-200/50 flex items-center justify-center gap-4 active:scale-95 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    {step === 1 ? '下一步: 授课资质上传' : '提交入驻申请'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <Lock size={12} className="text-amber-500" />
                            您的信息将受到严格保护，仅用于教师入驻资格审核
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="px-10 pb-12 flex justify-center">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-extrabold text-sm transition-all group border-b border-transparent hover:border-blue-700"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            返回登录页面
                        </button>
                    </div>
                )}
            </div>

            {/* Global Footer Overlay */}
            <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">© 2024 教育培训信息管理系统. 版权所有.</p>
            </div>

            {/* Styling for step transitions */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideInFromRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .slide-in-from-right-4 { animation: slideInFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                `
            }} />
        </div>
    );
};
