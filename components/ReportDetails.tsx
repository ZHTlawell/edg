
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
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

// Removed MOCK_DATA in favor of useStore

export const ReportDetails: React.FC = () => {
  const { currentUser, orders, students, courses, getExportData, addToast } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  const displayData = useMemo(() => {
    const data = orders.filter(o => {
      if (isCampusAdmin && o.campusId !== currentUser?.campus) return false;
      if (keyword) {
        const student = students.find(s => s.id === o.studentId);
        return student?.name.includes(keyword) || o.id.includes(keyword);
      }
      return true;
    });

    return data.map(o => ({
      orderId: o.id,
      studentName: students.find(s => s.id === o.studentId)?.name || '未知',
      phone: students.find(s => s.id === o.studentId)?.phone || '-',
      campus: o.campusId,
      courseClass: courses.find(c => c.id === o.courseId)?.name || '未知课程',
      totalAmount: o.amount,
      receivedAmount: o.status === 'PAID' ? o.amount : 0,
      paymentMethod: o.paymentMethod,
      status: o.status === 'REFUNDED' ? 'refunded' : o.status === 'CANCELLED' ? 'canceled' : 'valid',
      payStatus: o.status === 'PAID' ? 'paid' : 'unpaid',
      createdAt: o.createdAt
    }));
  }, [orders, students, courses, isCampusAdmin, currentUser?.campus, keyword]);

  const stats = useMemo(() => {
    const total = displayData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const received = displayData.reduce((acc, curr) => acc + curr.receivedAmount, 0);
    const refundedCount = displayData.filter(d => d.status === 'refunded').length;
    return { total, received, count: displayData.length, refundedCount };
  }, [displayData]);

  const handleExport = () => {
    if (displayData.length === 0) {
      addToast('没有可导出的数据', 'warning');
      return;
    }

    const headers = ['订单号', '时间', '学员', '电话', '校区', '项目', '金额', '支付状态'];
    const rows = displayData.map(d => [
      d.orderId,
      d.createdAt,
      d.studentName,
      d.phone,
      d.campus,
      d.courseClass,
      d.totalAmount,
      d.payStatus === 'paid' ? '已收录' : '待处理'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `教务收支明细_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusTag = (status: ReportItem['status']) => {
    switch (status) {
      case 'valid': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">有效订单</span>;
      case 'refunded': return <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded text-[10px] font-bold">已退款</span>;
      case 'canceled': return <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded text-[10px] font-bold">已取消</span>;
    }
  };

  const getPayStatusTag = (status: ReportItem['payStatus']) => {
    switch (status) {
      case 'paid': return <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><CheckCircle2 size={12} /> 已收全款</span>;
      case 'partial': return <span className="flex items-center gap-1 text-blue-600 font-bold text-[11px]"><Clock size={12} /> 部分支付</span>;
      case 'unpaid': return <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]"><AlertCircle size={12} /> 未支付</span>;
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
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
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

          {!isCampusAdmin && (
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
          )}

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
              <input
                type="text"
                placeholder="学员姓名/手机号/订单号"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
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
          <span className="text-lg font-bold text-slate-900 font-mono">{stats.count}</span>
        </div>
        <div className="w-px h-6 bg-blue-100"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">已收总额</span>
          <span className="text-lg font-bold text-emerald-600 font-mono">¥ {stats.received.toLocaleString()}</span>
        </div>
        <div className="w-px h-6 bg-blue-100"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">异常/退费数</span>
          <span className="text-lg font-bold text-red-500 font-mono">{stats.refundedCount}</span>
        </div>
        <div className="w-px h-6 bg-blue-100"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">预计总营收</span>
          <span className="text-lg font-bold text-blue-600 font-mono">¥ {stats.total.toLocaleString()}</span>
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
            <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Filter size={18} /></button>
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
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isCampusAdmin ? '报读班级' : '校区及班级'}</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1 cursor-help">
                    订单/实收金额 <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支付方式</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">订单状态</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayData.map((item, idx) => (
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
                      {!isCampusAdmin && <p className="text-xs font-bold text-slate-700 tracking-tight">{item.campus}</p>}
                      <p className={`${isCampusAdmin ? 'text-sm font-bold text-slate-800' : 'text-[10px] text-slate-400 font-medium'}`}>{item.courseClass}</p>
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
            <button disabled className="p-2 text-slate-300 cursor-not-allowed transition-all"><ChevronLeft size={20} /></button>
            <div className="flex gap-1">
              {[1, 2, 3, '...', 12].map((p, i) => (
                <button
                  key={i}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === 1 ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:border-slate-200'}`}
                >{p}</button>
              ))}
            </div>
            <button className="p-2 text-slate-400 hover:bg-white hover:border-slate-200 rounded-xl transition-all"><ChevronRight size={20} /></button>
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

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};
