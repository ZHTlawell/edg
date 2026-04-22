
import React, { useState, useRef } from 'react';
import {
    School,
    User,
    Smartphone,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Mail,
    ClockIcon,
    Building2,
    MapPin,
    ShieldCheck,
    FileText,
    UploadCloud,
    Check,
    ChevronRight
} from 'lucide-react';
import { ElmIcon } from './ElmIcon';
import { useStore } from '../store';

interface RegistrationProps {
    role: 'campus_admin' | 'teacher';
    onBack: () => void;
    campusList?: { id: string; name: string }[];
}

type CampusStep = 1 | 2 | 3; // 1: 基础信息, 2: 资质上传, 3: 提交成功

export const Registration: React.FC<RegistrationProps> = ({ role, onBack, campusList = [] }) => {
    const { registerCampusAdmin, registerTeacher, addToast, campuses, fetchCampuses } = useStore();

    // 每次进入注册页都强制拉最新校区列表，避免 zustand 持久化缓存导致新建校区不显示
    React.useEffect(() => {
        fetchCampuses();
    }, [fetchCampuses]);

    const [campusStep, setCampusStep] = useState<CampusStep>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        smsCode: '',
        address: '',
        campusName: '',   // campus_admin: 机构名称; teacher: 希望加入的校区名
        campus_id: '',    // teacher: 选择的校区 id
        permitFile: null as File | null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCampus = role === 'campus_admin';

    const handleNextStep = () => {
        if (campusStep === 1) {
            if (!formData.campusName || !formData.name || !formData.phone || !formData.address || !formData.username || !formData.password) {
                addToast('请填写所有必填基础信息', 'error');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                addToast('两次输入的密码不一致', 'error');
                return;
            }
            setCampusStep(2);
        }
    };

    const handlePrevStep = () => {
        if (campusStep === 2) setCampusStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isCampus) {
            if (campusStep !== 2) return;
            // In a real app, we'd validate files here
        } else {
            if (formData.password !== formData.confirmPassword) {
                addToast('两次输入的密码不一致', 'error');
                return;
            }
            if (!formData.campusName) {
                addToast('请填写希望加入的校区名称', 'error');
                return;
            }
        }

        setIsLoading(true);
        try {
            if (isCampus) {
                await registerCampusAdmin({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone,
                    campusName: formData.campusName,
                    address: formData.address,
                });
                setCampusStep(3);
            } else {
                await registerTeacher({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone,
                    campusName: formData.campusName,
                    campus_id: formData.campus_id || undefined,
                });
                setCampusStep(3); // Reuse step 3 for success
            }
        } catch {
            // error already shown by store
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all text-sm text-slate-800 font-medium placeholder:text-slate-400";

    // Step Indicator Component
    const StepIndicator = () => (
        <div className="flex items-center justify-between mb-12 relative px-4">
            <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 -z-10">
                <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${(campusStep - 1) * 50}%` }}
                />
            </div>
            {[
                { s: 1, label: '基础信息' },
                { s: 2, label: '资质上传' },
                { s: 3, label: '提交审核' }
            ].map((item) => (
                <div key={item.s} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${campusStep >= item.s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'
                        }`}>
                        {campusStep > item.s ? <ElmIcon name="check" size={16} /> : item.s}
                    </div>
                    <span className={`text-xs font-bold ${campusStep >= item.s ? 'text-blue-600' : 'text-slate-400'}`}>
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );

    if (campusStep === 3) {
        return (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                    <ElmIcon name="circle-check" size={16} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">注册申请已提交</h2>
                <p className="text-slate-500 text-sm mb-2">您的资质信息已进入审核流程</p>
                <div className="w-full rounded-2xl p-4 text-sm font-medium mb-8 bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                    <ElmIcon name="info-filled" size={16} className="mr-2" />
                    总管理员将在 1-3 个工作日内完成审核，请保持电话畅通。
                </div>
                <button
                    onClick={onBack}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    返回登录页
                </button>
            </div>
        );
    }

    if (!isCampus) {
        // Simple Teacher Registration (Fallback or keep as is)
        return (
            <div className="animate-in fade-in zoom-in-95 duration-500">
                <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    返回登录
                </button>
                <div className="mb-8 text-left space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        教师自主注册
                        <ElmIcon name="user" size={16} />
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">提交注册信息后，校区管理员将审核您的申请</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">真实姓名</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                <ElmIcon name="user" size={16} />
                            </div>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClasses} pl-12`} placeholder="请输入您的真实姓名" />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">希望加入的校区</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                <ElmIcon name="house" size={16} />
                            </div>
                            <select
                                required
                                className={`${inputClasses} pl-12 appearance-none`}
                                value={formData.campus_id}
                                onChange={e => {
                                    const selectedCampus = (campuses || []).find(c => c.id === e.target.value);
                                    setFormData({ ...formData, campus_id: e.target.value, campusName: selectedCampus?.name || '' });
                                }}
                            >
                                <option value="" disabled hidden>-- 请选择希望入职的校区 --</option>
                                {(campuses || []).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ElmIcon name="arrow-right" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">联系电话</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                <Smartphone size={18} />
                            </div>
                            <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`${inputClasses} pl-12`} placeholder="请输入11位手机号" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">登录账号</label>
                            <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClasses} placeholder="设置账号名称" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">设置密码</label>
                            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClasses} placeholder="******" />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">确认密码</label>
                        <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className={inputClasses} placeholder="请再次输入密码以确保一致" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-6 group active:scale-[0.98] disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span>提交入职申请</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">校区入驻申请</h1>
                <p className="text-slate-400 text-sm">欢迎加入我们，请填写基础资料开始入驻流程</p>
            </div>

            <StepIndicator />

            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        {campusStep === 1 ? <ElmIcon name="house" size={16} /> : <ElmIcon name="finished" size={16} />}
                    </div>
                    <h2 className="font-bold text-slate-800">
                        {campusStep === 1 ? '第一步：基础资料' : '第二步：资质上传'}
                    </h2>
                </div>

                {campusStep === 1 ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                校区名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="请输入校区完整名称（需与营业执照一致）"
                                className={inputClasses}
                                value={formData.campusName}
                                onChange={e => setFormData({ ...formData, campusName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    负责人姓名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="请输入负责人姓名"
                                    className={inputClasses}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    负责人联系方式 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="请输入11位手机号码"
                                    className={inputClasses}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    登录账号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="设置登录账号"
                                    className={inputClasses}
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    登录密码 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="设置 6 位以上密码"
                                    className={inputClasses}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    确认密码 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="请再次输入密码"
                                    className={inputClasses}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                短信验证码 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="请输入6位验证码"
                                    className={`${inputClasses} flex-1`}
                                    value={formData.smsCode}
                                    onChange={e => setFormData({ ...formData, smsCode: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors shrink-0"
                                >
                                    获取验证码
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                校区详细地址 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="请填写详细地址，如：XX省XX市XX区XX街道XX号"
                                className={`${inputClasses} resize-none`}
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={handleNextStep}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 mt-4 group"
                        >
                            <span>下一步：资质上传</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex flex-col items-center">
                            {/* License Upload */}
                            <div className="space-y-3 w-full max-w-md">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        办学许可证 <span className="text-red-500">*</span>
                                    </label>
                                    <button className="text-blue-600 text-xs font-bold hover:underline">查看示例</button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFormData({ ...formData, permitFile: file });
                                        }
                                    }}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    {formData.permitFile ? (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                                                <ElmIcon name="circle-check" size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1">{formData.permitFile.name}</p>
                                            <p className="text-xs text-slate-400">{(formData.permitFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, permitFile: null });
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="mt-4 text-xs font-bold text-red-500 hover:text-red-600"
                                            >
                                                删除并重新选择
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 mb-1">点击或将文件拖拽至此处</p>
                                            <p className="text-xs text-slate-400">支持 JPG, PNG 格式，文件大小不超过 10MB</p>
                                        </>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 italic text-center">
                                    <ElmIcon name="finished" size={16} /> 请确保许可证名称与第一步填写的校区名称完全一致
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <input type="checkbox" id="agreement" className="w-4 h-4 rounded text-blue-600" />
                            <label htmlFor="agreement" className="text-sm text-slate-500">
                                我已阅读并同意 <button className="text-blue-600 font-bold hover:underline">《校区入驻服务协议》</button>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handlePrevStep}
                                className="flex-1 border-2 border-slate-100 hover:border-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                上一步
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <ElmIcon name="check" size={16} />
                                        <span>提交入驻审核</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mt-8">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Lock size={10} /> 您的信息将受到严格保密，仅用于入驻资格审核
                </p>
                <button onClick={onBack} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    取消并返回登录
                </button>
            </div>
        </div>
    );
};
