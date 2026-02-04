
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Archive, 
  Share2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  History,
  Plus,
  Filter,
  Search,
  FileText,
  ListFilter,
  User,
  Inbox
} from 'lucide-react';
import { Student } from '../types';

interface StudentDetailViewProps {
  student: Student;
  onBack: () => void;
}

type TabType = 'basic' | 'enrollment' | 'payment' | 'progress' | 'grades' | 'attendance' | 'homework';

// Reusable Empty State Component with high-fidelity styling
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
    <div className="p-5 bg-slate-50 rounded-full text-slate-300 mb-5">
      {icon}
    </div>
    <h4 className="text-slate-800 font-bold mb-2 text-lg">{title}</h4>
    <p className="text-slate-400 text-sm max-w-[320px] leading-relaxed">{description}</p>
    <button className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
      <Plus size={16} /> 立即添加记录
    </button>
  </div>
);

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基本信息' },
    { id: 'enrollment', label: '报名记录' },
    { id: 'payment', label: '缴费记录' },
    { id: 'progress', label: '学习进度' },
    { id: 'grades', label: '成绩统计' },
    { id: 'attendance', label: '考勤日志' },
    { id: 'homework', label: '作业批改' },
  ];

  const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  const calculateAge = (birthday?: string) => {
    if (!birthday) return '未知';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthday = (birthday?: string) => {
    if (!birthday) return '未录入';
    const date = new Date(birthday);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1440px] mx-auto">
      {/* Top Header Information Bar - 1440px Optimized */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-0 z-20">
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-slate-200"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${student.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                {student.name.charAt(0)}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{student.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {student.status === 'active' ? '在读' : '非在读'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-8 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-2"><Phone size={15} className="text-slate-300" /> {maskPhone(student.phone)}</span>
                  <span className="flex items-center gap-2"><MapPin size={15} className="text-slate-300" /> {student.campus}</span>
                  <span className="px-2 py-0.5 bg-slate-50 text-[10px] font-mono text-slate-400 rounded">UID: {student.id}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all active:scale-95">
              <Archive size={18} /> 归档学员
            </button>
            {student.campus === '总校区' && (
              <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all active:scale-95">
                <Share2 size={18} /> 转移校区
              </button>
            )}
            <button className="flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-200 active:scale-95">
              <Edit size={18} /> 编辑档案
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation - High Fidelity */}
        <div className="flex items-center px-8 border-t border-slate-100 bg-slate-50/20 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-5 text-sm font-bold transition-all relative flex-shrink-0 group ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)] animate-in fade-in slide-in-from-bottom-2"></div>
              )}
              <div className="absolute inset-x-2 inset-y-3 bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-0"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="min-h-[600px]">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 space-y-10 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <FileText size={18} className="text-blue-500" /> 基本教务属性
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">出生日期</p>
                      <p className="text-base text-slate-900 font-bold">
                        {formatBirthday(student.birthday)} 
                        <span className="text-slate-400 font-medium ml-2 text-sm">({calculateAge(student.birthday)}岁)</span>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">证件号码</p>
                      <p className="text-base text-slate-900 font-bold tracking-widest font-mono">3101**********1234</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">最高学历</p>
                      <p className="text-base text-slate-900 font-bold">本科 · 上海交通大学 <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-2">985/211</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">紧急联系人</p>
                      <p className="text-base text-slate-900 font-bold">王美华 <span className="text-slate-400 text-sm font-medium">(母亲)</span> · 139****8888</p>
                    </div>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <Mail size={18} className="text-emerald-500" /> 联络社交详情
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">常用电子邮箱</p>
                        <p className="text-sm text-slate-800 font-bold">meiling.z@school-edu.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                        <Share2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">即时通讯 (微信)</p>
                        <p className="text-sm text-slate-800 font-bold underline decoration-emerald-100 underline-offset-4">ZML_DesignPRO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-2"><History size={20} className="text-slate-400" /> 档案日志</span>
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">查看全部</button>
                </h3>
                <div className="space-y-8 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {[
                    { user: '教务王老师', action: '修正了 学员手机号', time: '2024-05-18 10:24' },
                    { user: '系统日志', action: '自动同步了 学习进度', time: '2024-05-17 22:15' },
                    { user: '陈主管', action: '批准了 奖学金申请', time: '2024-05-15 14:30' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-5 relative group">
                      <div className="w-[18px] h-[18px] rounded-full bg-blue-500 border-4 border-white shadow-md z-10 mt-1 transition-transform group-hover:scale-125"></div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm text-slate-800 font-bold leading-tight">{log.user}</p>
                        <p className="text-xs text-slate-500">{log.action}</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono pt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mb-2">学业活跃度</p>
                <h4 className="text-2xl font-bold mb-6 tracking-tight">累计在校 482 小时</h4>
                <div className="space-y-5 relative">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2 uppercase tracking-widest opacity-80">
                      <span>本月课程达成率</span>
                      <span className="font-mono">65%</span>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex-1 p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-[9px] font-bold uppercase opacity-60">最近登录</p>
                      <p className="text-xs font-bold mt-1">1小时前</p>
                    </div>
                    <div className="flex-1 p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-[9px] font-bold uppercase opacity-60">活跃排名</p>
                      <p className="text-xs font-bold mt-1">TOP 5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollment' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                 <h4 className="font-bold text-slate-800">在读与历史报名记录</h4>
                 <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                   <button className="px-3 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-lg">全部</button>
                   <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600">有效</button>
                   <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600">过期</button>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Filter size={18} /></button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download size={18} /></button>
               </div>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">核心项目</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">负责讲师</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">成交日期</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">结课日期</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">学习状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-base">高级UI/UX设计实战全能课</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">SKU: PRO-UI-2024-A</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">李</div>
                         <span className="text-sm text-slate-600 font-bold">李建国 老师</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 font-medium font-mono">2024-01-10</td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium font-mono italic">2025-01-10</td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">在读学习中</span>
                    </td>
                  </tr>
                </tbody>
             </table>
             <div className="p-6 bg-slate-50/20 border-t border-slate-100 flex justify-center items-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">End of Records</p>
             </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-6">
                   <h4 className="font-bold text-slate-800">账务记录流水</h4>
                   <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2 text-sm shadow-sm">
                     <Search size={16} className="text-slate-400 mr-3" />
                     <input type="text" placeholder="快速检索订单号..." className="outline-none bg-transparent w-48 font-medium placeholder:text-slate-300" />
                   </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                  <Download size={16} /> 导出开票流水
                </button>
             </div>
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">订单/流水号</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">合同项目</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">合同总价</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">实付金额</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">收款状态</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">渠道</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6 font-mono text-xs text-slate-400 font-bold tracking-tighter">ORD20240110001Z</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 uppercase text-sm leading-tight">全能设计班高级套餐包</span>
                        <span className="text-[10px] text-slate-400 font-medium">包含实体教材 + 认证考证费</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-mono font-bold tracking-tighter">¥ 12,800.00</td>
                    <td className="px-8 py-6 text-emerald-600 font-bold font-mono text-base tracking-tighter">¥ 12,800.00</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit uppercase tracking-wider">
                        <CheckCircle2 size={14} /> 已完成全额入账
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-slate-500 font-bold">
                      <div className="flex items-center justify-end gap-2 text-xs"><CreditCard size={16} className="text-slate-300"/> 微信线上扫码</div>
                    </td>
                  </tr>
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-10 space-y-10 shadow-xl shadow-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xl tracking-tight">核心学段进度</h4>
                  <p className="text-xs text-slate-400 mt-1 font-bold">系统实时同步 · 最近学习：2小时前</p>
                </div>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <TrendingUp size={32} />
                </div>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-800 font-bold text-base tracking-tight">UI/UX设计实战课 (第4期春季班)</span>
                    <span className="text-blue-600 font-mono font-bold text-lg">75%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-200" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> 已耗 24 课时</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-400" /> 剩余 8 课时</span>
                    </div>
                    <span className="text-slate-400">出勤率 98.2%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <EmptyState 
              icon={<BookOpen size={64} />}
              title="暂无其他辅修课程"
              description="该学员目前的学业精力主要集中在 UI/UX 核心项目，尚未开启其他模块。如需添加辅修，请点击下方按钮。"
            />
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-xl shadow-slate-100">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
               <div>
                 <h4 className="font-bold text-slate-900 text-xl tracking-tight">学期成绩综述</h4>
                 <p className="text-sm text-slate-400 mt-1 font-medium">数据基于本学期 4 次关键阶段考核得出</p>
               </div>
               <div className="flex items-center gap-10">
                 <div className="text-center">
                   <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-widest">综合加权绩点</p>
                   <p className="text-4xl font-bold text-blue-600 font-mono tracking-tighter">92.5</p>
                 </div>
                 <div className="w-px h-16 bg-slate-100"></div>
                 <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl text-xs font-bold border border-slate-200 transition-all shadow-sm">
                   <Download size={18} /> 下载 PDF 成绩单
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-1 gap-5">
                {[
                  { name: '色彩心理学与界面配色进阶', score: 98, trend: [80, 85, 90, 98], date: '2024-05-12' },
                  { name: 'Figma 高级组件封装与原子化构建', score: 85, trend: [95, 92, 88, 85], date: '2024-04-28' },
                  { name: 'iOS/Android 交互设计通用规范', score: 94, trend: [70, 82, 88, 94], date: '2024-04-15' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50/30 hover:bg-white rounded-3xl transition-all border-2 border-transparent hover:border-blue-100 group hover:shadow-xl hover:shadow-blue-50/50">
                    <div className="flex items-center gap-8">
                      <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <div>
                        <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</span>
                        <p className="text-[10px] text-slate-400 font-bold font-mono mt-1 uppercase tracking-wider">Assessment Date: {item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-16">
                      <div className="hidden md:flex items-end gap-2 h-10 px-4">
                         {item.trend.map((val, k) => (
                           <div 
                            key={k} 
                            className={`w-2 rounded-full transition-all duration-700 ${val > 90 ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'bg-slate-200'}`} 
                            style={{ height: `${(val / 100) * 100}%` }}
                           ></div>
                         ))}
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className={`text-3xl font-bold font-mono tracking-tighter ${item.score >= 90 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {item.score}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">SCORE</p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-100">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6">
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold whitespace-nowrap shadow-xl shadow-blue-200 active:scale-95">全周期考勤</button>
                <button className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-bold whitespace-nowrap hover:bg-slate-50 transition-all active:scale-95">正常出勤 (18)</button>
                <button className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-bold whitespace-nowrap hover:bg-slate-50 transition-all active:scale-95">申请请假 (2)</button>
                <button className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-bold whitespace-nowrap hover:bg-slate-50 transition-all active:scale-95 text-red-500">异常缺勤 (1)</button>
              </div>
              <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200">
                <ListFilter size={20} />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { date: '2024-05-21', time: '14:00 - 16:30', class: '高级UI：App 复杂视觉系统全案设计', status: 'present' },
                { date: '2024-05-18', time: '14:00 - 16:30', class: '高级UI：Icon 精细化绘制与细节打磨', status: 'leave' },
                { date: '2024-05-14', time: '14:00 - 16:30', class: '高级UI：高级排版与多语言字体规范', status: 'absent' },
              ].map((item, i) => (
                <div key={i} className="px-10 py-8 flex items-center justify-between hover:bg-blue-50/10 transition-all group">
                  <div className="flex items-center gap-10">
                    <div className="text-center w-16 flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.date.split('-')[1]}月</span>
                       <span className="text-2xl font-bold text-slate-900 leading-none mt-1 font-mono tracking-tighter">{item.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{item.class}</p>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-2 mt-2 uppercase tracking-wide">
                        <Clock size={14} className="text-slate-300" /> {item.time} <span className="text-slate-200 mx-2">|</span> 授课人：李老师
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    {item.status === 'present' && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-inner">
                        <CheckCircle2 size={18}/> 正常打卡
                      </div>
                    )}
                    {item.status === 'leave' && (
                      <div className="flex items-center gap-2 text-xs text-amber-500 font-bold bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-inner">
                        <Clock size={18}/> 已准事假
                      </div>
                    )}
                    {item.status === 'absent' && (
                      <div className="flex items-center gap-2 text-xs text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-inner">
                        <XCircle size={18}/> 异常缺席
                      </div>
                    )}
                    <button className="p-3 text-slate-300 hover:text-slate-900 transition-all active:scale-75">
                      <ChevronRight size={22}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50/40 border-t border-slate-100 flex justify-center items-center">
               <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2 group">
                 加载更早之前的 20 条考勤档案 <ChevronRight size={14} className="rotate-90 group-hover:translate-y-1 transition-transform" />
               </button>
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-10">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <button className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center active:scale-90 transition-all">
                   <Plus size={24} />
                 </button>
                 <div>
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">作业档案中心</h4>
                    <p className="text-xs text-slate-400 font-medium">支持多附件批注与版本对比</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <button className="p-3 text-slate-400 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 transition-all"><Search size={20} /></button>
                 <button className="p-3 text-blue-600 bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100"><ListFilter size={20} /></button>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { title: '阶段性综合作业：企业级社交 App 视觉重构全案', status: 'graded', score: 92, date: '2024-05-20', files: 3, comment: '视觉统一性极佳，动效处理到位。' },
                 { title: '课后实操：复杂多态列表卡片组件化构建', status: 'pending', date: '2024-05-18', files: 1, comment: '老师正在批改中，预计24小时内出分。' },
               ].map((work, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-500 -z-0"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">阶段大作业</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Sub: {work.date}</span>
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 mb-6 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-h-[56px] relative z-10">{work.title}</h5>
                    
                    <div className="bg-slate-50/50 rounded-2xl p-4 mb-8 border border-slate-100/50 relative z-10">
                       <p className="text-[11px] text-slate-800 font-bold mb-1">教师点评：</p>
                       <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{work.comment}"</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto relative z-10">
                      {work.status === 'graded' ? (
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full border-[6px] border-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-base shadow-inner bg-emerald-50/20">
                             {work.score}
                           </div>
                           <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">已完成批改</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                             <Clock size={24} />
                           </div>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic animate-pulse">审阅中...</span>
                        </div>
                      )}
                      <button className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-2xl transition-all border border-blue-100 bg-white group-hover:shadow-lg shadow-blue-50">
                        <Download size={16}/> {work.files} 个附件
                      </button>
                    </div>
                 </div>
               ))}
               
               <button className="bg-slate-50/50 hover:bg-white border-4 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-6 transition-all hover:border-blue-400 group min-h-[320px] hover:shadow-xl">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center text-slate-200 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500">
                    <Inbox size={40}/>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-500 group-hover:text-slate-900 transition-colors">补交/追加提报档案</p>
                    <p className="text-xs text-slate-300 mt-2 font-medium">支持 ZIP, FIG, PSD, MP4 最大 500MB</p>
                  </div>
               </button>
             </div>
             
             <div className="flex justify-center mt-12">
               <button className="text-sm font-bold text-slate-400 hover:text-blue-600 px-8 py-3 bg-white border border-slate-200 rounded-3xl transition-all hover:shadow-md active:scale-95">
                 查看全部历史作业记录 (12)
               </button>
             </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
