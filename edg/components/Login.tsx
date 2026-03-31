
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
import {
  School,
  User,
  Lock,
  ArrowRight,
  Loader2,
  Smartphone,
  GraduationCap,
  LayoutDashboard,
  Users,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Mail,
  UserPlus
} from 'lucide-react';
import { useStore } from '../store';

interface LoginProps {
  onLogin: (role: string) => void;
}

type UserRole = 'admin' | 'campus_admin' | 'teacher' | 'student';

import { Registration } from './Registration';
import { StudentRegistration } from './StudentRegistration';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { login, addToast } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isRegistering, setIsRegistering] = useState<false | 'campus_admin' | 'teacher' | 'student'>(false);

  // Login Form States
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetAccount, setResetAccount] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      addToast('请输入账号和密码', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(account, password);
      setIsLoading(false);
      onLogin(activeRole);
    } catch (error) {
      setIsLoading(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
        <div className={`w-full ${isRegistering === 'teacher' ? 'max-w-[900px]' : 'max-w-[480px]'} bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative p-10 md:p-12 transition-all duration-500`}>
          {isRegistering === 'student' ? (
            <StudentRegistration onBack={() => setIsRegistering(false)} />
          ) : (
            <Registration
              role={isRegistering as 'campus_admin' | 'teacher'}
              onBack={() => setIsRegistering(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // ... rest of the component ...

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode !== '1234') {
      addToast('验证码输入错误，请输入右侧固定的测试验证码：1234', 'error');
      return;
    }
    if (!resetAccount) {
      addToast('请输入需要找回的账号', 'warning');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      addToast('新密码长度不能少于6位', 'warning');
      return;
    }
    setIsResetLoading(true);
    try {
      const api = (await import('../utils/api')).default;
      await api.post('/api/auth/reset-password', {
        username: resetAccount,
        newPassword: newPassword
      });
      addToast('密码重置成功！请使用新密码重新登录。', 'success');
      setIsForgotPassword(false);
      setResetAccount('');
      setVerifyCode('');
      setNewPassword('');
    } catch (error: any) {
      addToast(error.message || '密码重置失败，请检查账号是否正确', 'error');
    } finally {
      setIsResetLoading(false);
    }
  };

  // UI Theme Configuration based on role
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: '总部管理端',
          desc: '跨校区全局教务经营监控门户',
          color: 'blue',
          accent: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          shadow: 'shadow-blue-100',
          ring: 'focus:ring-blue-100',
          border: 'focus:border-blue-600',
          label: '总部管理员账号 / 工号',
          icon: <ElmIcon name="odometer" size={16} />
        };
      case 'campus_admin':
        return {
          title: '分校管理端',
          desc: '本校区教务编排与运营执行门户',
          color: 'cyan',
          accent: 'bg-cyan-600',
          hover: 'hover:bg-cyan-700',
          shadow: 'shadow-cyan-100',
          ring: 'focus:ring-cyan-100',
          border: 'focus:border-cyan-600',
          label: '校区管理员账号 / 手机号',
          icon: <School size={20} />
        };
      case 'teacher':
        return {
          title: '教师端登录',
          desc: '授课讲师与教研人员办公系统',
          color: 'indigo',
          accent: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          shadow: 'shadow-indigo-100',
          ring: 'focus:ring-indigo-100',
          border: 'focus:border-indigo-600',
          label: '教师编号 / 手机号',
          icon: <ElmIcon name="user" size={16} />
        };
      case 'student':
        return {
          title: '学员/家长端',
          desc: '在线学习进度与课表查询中心',
          color: 'emerald',
          accent: 'bg-emerald-600',
          hover: 'hover:bg-emerald-700',
          shadow: 'shadow-emerald-100',
          ring: 'focus:ring-emerald-100',
          border: 'focus:border-emerald-600',
          label: '手机号 / 学号',
          icon: <GraduationCap size={20} />
        };
    }
  };

  const config = getRoleConfig(activeRole);
  const inputClasses = `w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 ${config.ring} ${config.border} focus:bg-white transition-all text-sm text-slate-900 font-bold shadow-sm placeholder:text-slate-300`;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
      {/* Branding */}
      <div className="mb-10 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-700">
        <div className={`p-4 rounded-3xl text-white shadow-2xl transition-all duration-500 ${config.accent} transform hover:rotate-3`}>
          <School size={36} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EduAdmin Pro</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Premium Education Management System</p>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      {!isForgotPassword && (
        <div className="w-full max-w-[480px] bg-white p-1.5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex gap-1 mb-8 animate-in fade-in duration-500 delay-100 overflow-x-auto custom-scrollbar">
          {(['admin', 'campus_admin', 'teacher', 'student'] as UserRole[]).map((role) => {
            const isActive = activeRole === role;
            const roleConfig = getRoleConfig(role);
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`flex-1 min-w-[80px] flex flex-col items-center justify-center py-4 rounded-[1.5rem] transition-all relative overflow-hidden group ${isActive ? 'bg-slate-900 text-white shadow-xl scale-105 z-10' : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                <div className={`mb-2 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {role === 'admin' && <ElmIcon name="odometer" size={16} />}
                  {role === 'campus_admin' && <School size={20} />}
                  {role === 'teacher' && <ElmIcon name="user" size={16} />}
                  {role === 'student' && <GraduationCap size={20} />}
                </div>
                <span className="text-xs font-bold tracking-wider uppercase whitespace-nowrap">
                  {role === 'admin' ? '总部端' : role === 'campus_admin' ? '分校端' : role === 'teacher' ? '教师端' : '学员端'}
                </span>
                {isActive && (
                  <div className={`absolute top-0 right-0 w-12 h-12 -translate-y-6 translate-x-6 rounded-full blur-2xl opacity-50 ${roleConfig.accent}`}></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative animate-in fade-in duration-700 delay-200">
        <div className="p-10 md:p-12">

          {isForgotPassword ? (
            // Forgot Password Form View
            <div className="animate-in fade-in-fast">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                返回登录
              </button>

              <div className="mb-10 text-center sm:text-left space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  找回密码
                  <KeyRound size={24} className="text-blue-500" />
                </h2>
                <p className="text-slate-400 text-sm font-medium">输入绑定的账号或手机号重置登录凭证</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">绑定账号 / 手机号</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                      <ElmIcon name="user" size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={resetAccount}
                      onChange={(e) => setResetAccount(e.target.value)}
                      className={inputClasses}
                      placeholder="请输入需要找回的账号"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">验证码</label>
                  <div className="flex gap-3">
                    <div className="relative group flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                        <Mail size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        className={inputClasses}
                        placeholder="4位验证码"
                        maxLength={4}
                      />
                    </div>
                    <div
                      className="bg-slate-100/80 border border-slate-200 text-slate-800 px-5 rounded-2xl font-mono font-bold text-xl tracking-[0.2em] flex items-center justify-center select-none shadow-inner min-w-[120px] relative overflow-hidden group cursor-help"
                      title="固定测试验证码"
                    >
                      {/* Graphics pattern background for Captcha look */}
                      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')]"></div>
                      {/* Strike-through line */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <div className="w-full h-[1.5px] bg-slate-800 transform -rotate-12"></div>
                      </div>
                      <span className="relative z-10 italic transform group-hover:scale-110 transition-transform duration-300">1234</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">设置新密码</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="包含字母及数字的强密码"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResetLoading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4`}
                >
                  {isResetLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span className="tracking-tight">确认重置</span>
                      <ElmIcon name="circle-check" size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // Standard Login Form
            <div className="animate-in fade-in-fast">
              <div className="mb-10 text-center sm:text-left space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  {config.title}
                  <ElmIcon name="circle-check" size={16} />
                </h2>
                <p className="text-slate-400 text-sm font-medium">{config.desc}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{config.label}</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                        {activeRole === 'student' ? <Smartphone size={18} /> : <ElmIcon name="user" size={16} />}
                      </div>
                      <input
                        type="text"
                        required
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        className={inputClasses}
                        placeholder={activeRole === 'student' ? "请输入手机号" : "输入工号或账号"}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end ml-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">访问凭证 / 密码</label>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer"
                      >
                        忘记密码?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClasses}
                        placeholder="请输入登录密码"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-1 pt-1">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer transition-all"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-500 font-bold cursor-pointer select-none">记住登录状态 (受信任设备)</label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${config.accent} ${config.hover} text-white font-bold py-4 rounded-2xl transition-all shadow-xl ${config.shadow} flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span className="tracking-tight">安全登录系统</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {activeRole === 'campus_admin' && (
                  <div className="pt-4 border-t border-slate-50 mt-8">
                    <button
                      type="button"
                      onClick={() => setIsRegistering('campus_admin')}
                      className="w-full bg-cyan-50 text-cyan-600 font-bold py-4 rounded-2xl transition-all hover:bg-cyan-100 flex items-center justify-center gap-2 border border-cyan-100 group"
                    >
                      <School size={18} className="group-hover:scale-110 transition-transform" />
                      <span>还没有账号? 申请注册校区</span>
                    </button>
                  </div>
                )}

                {activeRole === 'teacher' && (
                  <div className="pt-4 border-t border-slate-50 mt-8">
                    <button
                      type="button"
                      onClick={() => setIsRegistering('teacher')}
                      className="w-full bg-indigo-50 text-indigo-600 font-bold py-4 rounded-2xl transition-all hover:bg-indigo-100 flex items-center justify-center gap-2 border border-indigo-100 group"
                    >
                      <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                      <span>还没有账号? 教师自主注册</span>
                    </button>
                  </div>
                )}

                {activeRole === 'student' && (
                  <div className="pt-4 border-t border-slate-50 mt-8">
                    <button
                      type="button"
                      onClick={() => setIsRegistering('student')}
                      className="w-full bg-emerald-50 text-emerald-600 font-bold py-4 rounded-2xl transition-all hover:bg-emerald-100 flex items-center justify-center gap-2 border border-emerald-100 group"
                    >
                      <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                      <span>还没有账号? 立即自主注册</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 EDUADMIN SYSTEMS</p>
            <div className="flex items-center gap-6">
              <button type="button" onClick={(e) => { e.preventDefault(); addToast('使用协议功能开发中，敬请期待。', 'info'); }} className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer">使用协议</button>
              <button type="button" onClick={(e) => { e.preventDefault(); addToast('隐私声明功能开发中，敬请期待。', 'info'); }} className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer">隐私声明</button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className={`fixed -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isActiveRole('admin') ? 'bg-blue-400' : isActiveRole('teacher') ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
      <div className={`fixed -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isActiveRole('admin') ? 'bg-blue-400' : isActiveRole('teacher') ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInFast { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .fade-in-fast { animation: fadeInFast 0.4s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}} />
    </div>
  );

  function isActiveRole(role: UserRole) {
    return activeRole === role;
  }
};
