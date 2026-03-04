
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  RotateCcw, 
  DollarSign, 
  Undo2, 
  PieChart, 
  ArrowUpRight,
  MoreHorizontal,
  FileText,
  MapPin,
  BookOpen
} from 'lucide-react';

// --- Mock Data ---
const CORE_STATS = [
  { label: '新增报名人数', value: '1,284', trend: '+12.5%', isUp: true, icon: <Users />, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '新增订单数', value: '956', trend: '+8.2%', isUp: true, icon: <CreditCard />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: '营收金额 (已收)', value: '¥284,500', trend: '+15.3%', isUp: true, icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: '退费金额', value: '¥12,400', trend: '-2.4%', isUp: false, icon: <Undo2 />, color: 'text-red-600', bg: 'bg-red-50' },
  { label: '平均到课率', value: '94.2%', trend: '+1.1%', isUp: true, icon: <BarChart3 />, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: '课消课时数', value: '4,820', trend: '+5.7%', isUp: true, icon: <BookOpen />, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const TABLE_DATA = [
  { date: '2024-05-23', campus: '总部旗舰校', course: '高级UI设计', class: 'UI2401班', reg: 12, orders: 10, revenue: '¥48,000', refund: '¥0', attendance: '98%', consumption: 42 },
  { date: '2024-05-23', campus: '浦东分校', course: 'React架构', class: 'FE2405班', reg: 5, orders: 4, revenue: '¥24,800', refund: '¥1,200', attendance: '92%', consumption: 18 },
  { date: '2024-05-22', campus: '总部旗舰校', course: 'Python自动化', class: 'PY2402班', reg: 18, orders: 15, revenue: '¥21,600', refund: '¥0', attendance: '95%', consumption: 36 },
  { date: '2024-05-22', campus: '静安分校', course: '商业数据分析', class: 'DA2403班', reg: 8, orders: 7, revenue: '¥12,600', refund: '¥3,500', attendance: '88%', consumption: 24 },
];

export const StatisticsOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Home size={14} />
            <span>数据分析</span>
            <ChevronRight size={14} />
            <span className="text-slate-600">统计报表</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">全校运营统计报表</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <RotateCcw size={16} /> 重置视图
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
            <Download size={18} /> 导出全量报表
          </button>
        </div>
      </div>

      {/* Filter Section Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-6">
             <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
               {['近7天', '近30天', '本月', '自定义'].map((t, i) => (
                 <button 
                  key={i}
                  onClick={() => setTimeRange(i === 1 ? '30d' : '')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === (i === 1 ? '30d' : '') ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >{t}</button>
               ))}
             </div>
             <div className="h-6 w-px bg-slate-200"></div>
             <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">统计区间:</span>
                <p className="text-sm font-bold text-slate-700">2024年04月24日 - 2024年05月23日</p>
             </div>
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
          >
            {isFilterOpen ? '收起筛选' : '展开更多维度'} <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isFilterOpen && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">所属校区</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                <option>全部校区</option>
                <option>总部旗舰校</option>
                <option>浦东分校</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">课程类别</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                <option>全量课程项目</option>
                <option>UI/UX设计</option>
                <option>编程开发</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">班级状态</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                <option>不限状态</option>
                <option>进行中</option>
                <option>已结课</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">学员阶段</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                <option>全部学员</option>
                <option>在读</option>
                <option>结业</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-bold shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2">
                <Search size={16} /> 执行查询
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {CORE_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 20 })}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend} <span className="text-slate-300 font-medium">vs 上期</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Line Chart - Mocked with SVG */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
                <h4 className="font-bold text-slate-900">营收趋势波动图</h4>
                <p className="text-xs text-slate-400 font-medium">每日实收流水统计 (单位: 元)</p>
             </div>
             <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Download size={18} /></button>
                <button className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">按周切换</button>
             </div>
           </div>
           
           <div className="flex-1 relative mt-4">
              <svg className="w-full h-full min-h-[220px]" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="0" x2="800" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Area Gradient */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,150 L50,130 L100,160 L150,110 L200,90 L250,120 L300,70 L350,50 L400,90 L450,110 L500,60 L550,40 L600,80 L650,50 L700,30 L750,60 L800,40 V200 H0 Z" fill="url(#chartGradient)" />
                
                {/* Main Line */}
                <path d="M0,150 L50,130 L100,160 L150,110 L200,90 L250,120 L300,70 L350,50 L400,90 L450,110 L500,60 L550,40 L600,80 L650,50 L700,30 L750,60 L800,40" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data Points */}
                <circle cx="350" cy="50" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="700" cy="30" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
              </svg>
              
              <div className="flex justify-between mt-6 px-1">
                 {['04.24', '04.29', '05.04', '05.09', '05.14', '05.19', '05.23'].map((d, i) => (
                   <span key={i} className="text-[10px] font-bold text-slate-400 font-mono">{d}</span>
                 ))}
              </div>
           </div>
        </div>

        {/* Course Proportion Pie - Mocked */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <h4 className="font-bold text-slate-900">营收占比 (按项目)</h4>
              <button className="p-2 text-slate-400"><PieChart size={18} /></button>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray="65 100"></circle>
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-65"></circle>
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="-90"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">总营收</p>
                   <p className="text-sm font-bold text-slate-900">28.4W</p>
                </div>
              </div>
              
              <div className="w-full mt-10 space-y-4">
                 {[
                   { name: 'UI/UX设计实战', percent: '65%', color: 'bg-blue-500' },
                   { name: 'React前端开发', percent: '25%', color: 'bg-emerald-500' },
                   { name: '其他兴趣课程', percent: '10%', color: 'bg-amber-500' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                         <span className="text-xs font-bold text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900">{item.percent}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollment Bar Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
           <h4 className="font-bold text-slate-900 mb-8">报名人数分布 (按校区)</h4>
           <div className="space-y-6">
              {[
                { name: '总部旗舰校', count: 542, max: 600, color: 'bg-blue-600' },
                { name: '浦东分校', count: 382, max: 600, color: 'bg-indigo-500' },
                { name: '静安分校', count: 186, max: 600, color: 'bg-slate-300' },
                { name: '徐汇分校', count: 124, max: 600, color: 'bg-slate-200' },
              ].map((campus, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600">{campus.name}</span>
                      <span className="text-slate-900 font-mono">{campus.count} 人</span>
                   </div>
                   <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${campus.color} rounded-full transition-all duration-1000`} 
                        style={{ width: `${(campus.count/campus.max)*100}%` }}
                      ></div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Detailed Data Table */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
             <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-500" />
                <h4 className="font-bold text-slate-800">业务明细日报</h4>
             </div>
             <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                查看全量历史明细 <ArrowUpRight size={14} />
             </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/10 border-b border-slate-50">
                   <tr>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">日期/校区</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">报名/订单</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">营收/退费</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">到课/课消</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {TABLE_DATA.map((row, i) => (
                     <tr key={i} className="hover:bg-blue-50/5 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-400 font-mono tracking-tighter">{row.date}</p>
                              <p className="text-sm font-bold text-slate-800">{row.campus}</p>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="text-center px-2 py-1 bg-blue-50 rounded-lg">
                                 <p className="text-[10px] font-bold text-blue-600 uppercase">报名</p>
                                 <p className="text-sm font-bold text-blue-700 font-mono">{row.reg}</p>
                              </div>
                              <div className="text-center px-2 py-1 bg-slate-50 rounded-lg">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">订单</p>
                                 <p className="text-sm font-bold text-slate-600 font-mono">{row.orders}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <p className="text-sm font-bold text-emerald-600 font-mono">{row.revenue}</p>
                           <p className="text-[10px] font-bold text-red-400 font-mono">{row.refund !== '¥0' ? `-${row.refund}` : '--'}</p>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500">
                              <TrendingUp size={10} className="text-emerald-500" /> {row.attendance}
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">课消: {row.consumption}H</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><MoreHorizontal size={18} /></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="p-6 bg-slate-50/20 border-t border-slate-50 flex items-center justify-between">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">展示 1 - 4 / 共 156 条明细记录</p>
             <div className="flex gap-1">
                {[1, 2, 3].map(p => (
                  <button key={p} className={`w-8 h-8 rounded-lg text-[10px] font-bold ${p === 1 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}>{p}</button>
                ))}
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};
