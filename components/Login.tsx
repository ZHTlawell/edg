
import React, { useState } from 'react';
import { 
  School, 
  User, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Smartphone, 
  GraduationCap, 
  LayoutDashboard,
  Users,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

type UserRole = 'admin' | 'teacher' | 'student';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  
  // Form States
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      onLogin(activeRole);
    }, 1200);
  };

  // UI Theme Configuration based on role
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: '管理端登录',
          desc: '总部及分校区教务管理门户',
          color: 'blue',
          accent: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          shadow: 'shadow-blue-100',
          ring: 'focus:ring-blue-100',
          border: 'focus:border-blue-600',
          label: '管理员账号 / 工号',
          icon: <LayoutDashboard size={20} />
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
          icon: <Users size={20} />
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
      <div className="mb-10 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className={`p-4 rounded-3xl text-white shadow-2xl transition-all duration-500 ${config.accent} transform hover:rotate-3`}>
          <School size={36} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EduAdmin Pro</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Premium Education Management System</p>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="w-full max-w-[480px] bg-white p-1.5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex gap-1 mb-8 animate-in fade-in duration-500 delay-100">
        {(['admin', 'teacher', 'student'] as UserRole[]).map((role) => {
          const isActive = activeRole === role;
          const roleConfig = getRoleConfig(role);
          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] transition-all relative overflow-hidden group ${
                isActive ? 'bg-slate-900 text-white shadow-xl scale-105 z-10' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className={`mb-2 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {role === 'admin' && <LayoutDashboard size={20} />}
                {role === 'teacher' && <Users size={20} />}
                {role === 'student' && <GraduationCap size={20} />}
              </div>
              <span className="text-xs font-bold tracking-wider uppercase">
                {role === 'admin' ? '管理端' : role === 'teacher' ? '教师端' : '学员端'}
              </span>
              {isActive && (
                <div className={`absolute top-0 right-0 w-12 h-12 -translate-y-6 translate-x-6 rounded-full blur-2xl opacity-50 ${roleConfig.accent}`}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="p-10 md:p-12">
          <div className="mb-10 text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              {config.title}
              <CheckCircle2 size={24} className={isActiveRole('admin') ? 'text-blue-500' : isActiveRole('teacher') ? 'text-indigo-500' : 'text-emerald-500'} />
            </h2>
            <p className="text-slate-400 text-sm font-medium">{config.desc}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              {/* Account Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{config.label}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                    {activeRole === 'student' ? <Smartphone size={18} /> : <User size={18} />}
                  </div>
                  <input
                    type="text"
                    required
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className={inputClasses}
                    placeholder={activeRole === 'student' ? "请输入手机号" : "输入工号或账号"}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-end ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">访问凭证 / 密码</label>
                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">忘记密码?</a>
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
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 EDUADMIN SYSTEMS</p>
             <div className="flex items-center gap-6">
               <a href="#" className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest">使用协议</a>
               <a href="#" className="text-[10px] text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest">隐私声明</a>
             </div>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className={`fixed -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isActiveRole('admin') ? 'bg-blue-400' : isActiveRole('teacher') ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
      <div className={`fixed -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isActiveRole('admin') ? 'bg-blue-400' : isActiveRole('teacher') ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}} />
    </div>
  );

  function isActiveRole(role: UserRole) {
    return activeRole === role;
  }
};
