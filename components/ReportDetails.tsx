
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  RotateCcw, 
  ChevronRight, 
  Home, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Calendar, 
  MapPin, 
  CreditCard,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface ReportItem {
  orderId: string;
  studentName: string;
  phone: string;
  campus: string;
  courseClass: string;
  totalAmount: number;
  receivedAmount: number;
  paymentMethod: string;
  status: 'valid' | 'refunded' | 'canceled';
  payStatus: 'paid' | 'unpaid' | 'partial';
  createdAt: string;
}

const MOCK_DATA: ReportItem[] = [
  { orderId: 'ORD20240523001', studentName: '张美玲', phone: '138****5678', campus: '总部旗舰校', courseClass: '高级UI/UX / UI2401班', totalAmount: 12800, receivedAmount: 12800, paymentMethod: '微信支付', status: 'valid', payStatus: 'paid', createdAt: '2024-05-23 14:20' },
  { orderId: 'ORD20240523002', studentName: '王大卫', phone: '139****7777', campus: '浦东分校', courseClass: 'React架构 / FE2405班', totalAmount: 9600, receivedAmount: 4800, paymentMethod: '银行转账', status: 'valid', payStatus: 'partial', createdAt: '2024-05-23 11:15' },
  { orderId: 'ORD20240522045', studentName: '李思思', phone: '155****3333', campus: '静安分校', courseClass: '数据分析 / DA2403班', totalAmount: 5800, receivedAmount: 5800, paymentMethod: '支付宝', status: 'refunded', payStatus: 'paid', createdAt: '2024-05-22 16:40' },
  { orderId: 'ORD20240522012', studentName: '赵小龙', phone: '186****1111', campus: '总部旗舰校', courseClass: 'Python基础 / PY2402班', totalAmount: 4200, receivedAmount: 0, paymentMethod: '待选择', status: 'canceled', payStatus: 'unpaid', createdAt: '2024-05-22 09:30' },
  { orderId: 'ORD20240521098', studentName: '陈晓燕', phone: '137****3333', campus: '浦东分校', courseClass: '数字媒体 / ART2401班', totalAmount: 15000, receivedAmount: 15000, paymentMethod: '现金支付', status: 'valid', payStatus: 'paid', createdAt: '2024-05-21 15:50' },
  { orderId: 'ORD20240521033', studentName: '周杰瑞', phone: '131****9999', campus: '总部旗舰校', courseClass: '高级UI/UX / UI2401班', totalAmount: 12800, receivedAmount: 6000, paymentMethod: '微信支付', status: 'valid', payStatus: 'partial', createdAt: '2024-05-21 10:10' },
];

export const ReportDetails: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const getStatusTag = (status: ReportItem['status']) => {
    switch (status) {
      case 'valid': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">有效订单</span>;
      case 'refunded': return <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded text-[10px] font-bold">已退款</span>;
      case 'canceled': return <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded text-[10px] font-bold">已取消</span>;
    }
  };

  const getPayStatusTag = (status: ReportItem['payStatus']) => {
    switch (status) {
      case 'paid': return <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><CheckCircle2 size={12}/> 已收全款</span>;
      case 'partial': return <span className="flex items-center gap-1 text-blue-600 font-bold text-[11px]"><Clock size={12}/> 部分支付</span>;
      case 'unpaid': return <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]"><AlertCircle size={12}/> 未支付</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Home size={14} />
            <span>数据分析</span>
            <ChevronRight size={14} />
            <span>统计报表</span>
            <ChevronRight size={14} />
            <span className="text-slate-600">报表明细</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">业务订单报表明细</h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
             <RotateCcw size={18} /> 重置
           </button>
           <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
             <Download size={18} /> 导出当前明细
           </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">统计时间区间 <span className="text-red-500">*</span></label>
            <div className="relative group">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" defaultValue="2024-05-01 ~ 2024-05-31" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">筛选校区 <span className="text-red-500">*</span></label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer">
                <option>全部校区</option>
                <option>总部旗舰校</option>
                <option>浦东分校</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">订单状态</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer">
              <option>全部状态</option>
              <option>有效订单</option>
              <option>已退款</option>
              <option>已取消</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">支付状态</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer">
              <option>全部状态</option>
              <option>已收全款</option>
              <option>部分支付</option>
              <option>未支付</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">关键字检索</label>
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="学员姓名/手机号/订单号" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end">
           <button className="flex items-center gap-2 px-10 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95">
             <Search size={18} /> 执行筛选
           </button>
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex flex-wrap items-center gap-12 shadow-inner">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-blue-100"><Filter size={16} /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">当前筛选结果：</span>
         </div>
         <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">订单总数</span>
            <span className="text-lg font-bold text-slate-900 font-mono">156</span>
         </div>
         <div className="w-px h-6 bg-blue-100"></div>
         <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">已收总额</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">¥ 284,500.00</span>
         </div>
         <div className="w-px h-6 bg-blue-100"></div>
         <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">退费总额</span>
            <span className="text-lg font-bold text-red-500 font-mono">¥ 12,400.00</span>
         </div>
         <div className="w-px h-6 bg-blue-100"></div>
         <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">平均到课率</span>
            <span className="text-lg font-bold text-blue-600 font-mono">94.2%</span>
         </div>
         <div className="w-px h-6 bg-blue-100"></div>
         <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">累计课消</span>
            <span className="text-lg font-bold text-slate-900 font-mono">4,820H</span>
         </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-4">
             <h3 className="font-bold text-slate-800">业务明细列表</h3>
             {selectedIds.length > 0 && (
               <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full animate-in zoom-in">已选中 {selectedIds.length} 项</span>
             )}
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Filter size={18}/></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/10 border-b border-slate-100">
                <th className="px-8 py-5 w-12">
                   <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单号/时间</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">学员详情</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">校区及班级</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1 cursor-help">
                    订单/实收金额 <ArrowUpDown size={12}/>
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支付方式</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单状态</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_DATA.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/5 transition-all group">
                   <td className="px-8 py-6">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                   </td>
                   <td className="px-6 py-6">
                      <div className="space-y-0.5">
                         <p className="text-xs font-bold text-slate-800 font-mono tracking-tighter">{item.orderId}</p>
                         <p className="text-[10px] text-slate-400 font-medium font-mono">{item.createdAt}</p>
                      </div>
                   </td>
                   <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-sm border border-slate-200">{item.studentName.charAt(0)}</div>
                         <div>
                            <p className="text-sm font-bold text-slate-800">{item.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-medium font-mono">{item.phone}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-6 py-6">
                      <div className="space-y-0.5">
                         <p className="text-xs font-bold text-slate-700 tracking-tight">{item.campus}</p>
                         <p className="text-[10px] text-slate-400 font-medium">{item.courseClass}</p>
                      </div>
                   </td>
                   <td className="px-6 py-6">
                      <div className="space-y-0.5">
                         <p className="text-sm font-bold text-slate-900 font-mono tracking-tight">¥ {item.totalAmount.toLocaleString()}</p>
                         <p className="text-[11px] font-bold text-emerald-600 font-mono">¥ {item.receivedAmount.toLocaleString()}</p>
                      </div>
                   </td>
                   <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <CreditCard size={14} className="text-slate-300" /> {item.paymentMethod}
                      </div>
                   </td>
                   <td className="px-6 py-6 space-y-2">
                      <div>{getStatusTag(item.status)}</div>
                      <div>{getPayStatusTag(item.payStatus)}</div>
                   </td>
                   <td className="px-6 py-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="查看详情">
                        <ExternalLink size={18} />
                      </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
           <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>共 1,284 条记录</span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                <button className="px-3 py-1 bg-slate-100 rounded-md text-slate-800">10 条/页</button>
                <ChevronDown size={14} className="mx-1" />
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button disabled className="p-2 text-slate-300 cursor-not-allowed transition-all"><ChevronLeft size={20}/></button>
              <div className="flex gap-1">
                 {[1, 2, 3, '...', 12].map((p, i) => (
                   <button 
                    key={i}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === 1 ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:border-slate-200'}`}
                   >{p}</button>
                 ))}
              </div>
              <button className="p-2 text-slate-400 hover:bg-white hover:border-slate-200 rounded-xl transition-all"><ChevronRight size={20}/></button>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                 跳至 <input type="text" className="w-10 bg-white border border-slate-200 rounded-lg text-center py-1.5 outline-none focus:border-blue-500" /> 页
              </div>
           </div>
        </div>
      </div>

      {/* Audit Hint Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex items-center justify-between relative overflow-hidden group shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:scale-150 transition-transform duration-1000"></div>
         <div className="flex items-center gap-8 relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-blue-400 backdrop-blur-md border border-white/10 shadow-inner">
               <Info size={32} />
            </div>
            <div className="space-y-1">
               <h4 className="text-xl font-bold tracking-tight">报表数据合规审计提示</h4>
               <p className="text-sm opacity-60 font-medium">当前明细数据已通过财务系统 T+1 自动对账。如发现入账金额与流水不符，请立即联系校区财务专员发起审计申请。</p>
            </div>
         </div>
         <button className="relative z-10 px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all hover:bg-blue-50">
            查阅审计规范指引
         </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};
