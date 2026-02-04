
import React from 'react';
import { School, User, Lock, ArrowRight, Loader2, Mail, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  
  // Form States
  const [account, setAccount] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API process
    setTimeout(() => {
      setIsLoading(false);
      if (isRegistering) {
        alert('注册申请已提交，请联系总校管理员审核！');
        setIsRegistering(false);
        setConfirmPassword('');
        setInviteCode('');
      } else {
        onLogin();
      }
    }, 1000);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    // Reset secondary fields when toggling
    setConfirmPassword('');
    setInviteCode('');
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all text-sm text-slate-950 font-medium shadow-sm placeholder:text-slate-400";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      {/* Top Header Section */}
      <div className="mb-8 flex flex-col items-center text-center space-y-4 transition-all duration-500">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
          <School className="text-white" size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EduAdmin Pro</h1>
          <p className="text-slate-500 font-medium text-sm text-opacity-80">进阶教育培训信息管理系统</p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-300">
        <div className="p-8 sm:p-10">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isRegistering ? '申请管理账号' : '欢迎登录'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isRegistering ? '请填写校区管理员申请信息' : '请使用您的账号登录系统'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Account / Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="account" className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                  {isRegistering ? '管理员邮箱' : '登录账号'}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                    {isRegistering ? <Mail size={18} /> : <User size={18} />}
                  </div>
                  <input
                    id="account"
                    name="account"
                    type={isRegistering ? "email" : "text"}
                    autoFocus
                    required
                    autoComplete={isRegistering ? "email" : "username"}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className={inputClasses}
                    placeholder={isRegistering ? "admin@school.com" : "请输入账号/邮箱"}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">登录密码</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="请输入密码"
                  />
                </div>
              </div>

              {/* Bottom Actions Bar (Login Mode only) */}
              {!isRegistering && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none font-medium">记住登录状态</label>
                  </div>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">忘记密码?</a>
                </div>
              )}

              {/* Registration Specific Fields */}
              {isRegistering && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">确认密码</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                        <ShieldCheck size={18} />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClasses}
                        placeholder="请再次确认密码"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="inviteCode" className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">校区校验码</label>
                    <input
                      id="inviteCode"
                      name="inviteCode"
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all text-sm text-slate-950 font-medium shadow-sm placeholder:text-slate-400"
                      placeholder="请输入 6 位校区授权码"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isRegistering ? '立即提交申请' : '登录'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500 font-medium">
            {isRegistering ? (
              <>
                已有管理账号？ <button type="button" onClick={toggleMode} className="text-blue-600 font-bold hover:underline underline-offset-4">返回登录</button>
              </> : (
              <>
                还没有系统账号？ <button type="button" onClick={toggleMode} className="text-blue-600 font-bold hover:underline underline-offset-4">申请注册</button>
              </>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
};
