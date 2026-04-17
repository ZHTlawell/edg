
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
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

interface ReportDetailsProps {
  onViewOrder?: (orderId: string) => void;
}

export const ReportDetails: React.FC<ReportDetailsProps> = ({ onViewOrder }) => {
  const { currentUser, orders, students, courses, getExportData, addToast, campuses, fetchCampuses } = useStore();

  React.useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [filterPayStatus, setFilterPayStatus] = useState('all');
  const [filterCampus, setFilterCampus] = useState('all');

  // Date range (default: last 90 days to today)
  const _today = new Date();
  const _past = new Date();
  _past.setDate(_today.getDate() - 90);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(fmt(_past));
  const [dateTo, setDateTo] = useState(fmt(_today));

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Helpers: resolve both snake_case and camelCase field variants
  const getOrderStudentId = (o: any) => o.studentId || o.student_id;
  const getOrderCourseId = (o: any) => o.courseId || o.course_id;
  const getOrderCampusId = (o: any) => o.campusId || o.campus_id;
  const resolveCampusName = (id: string | undefined) => {
    if (!id) return '未分配校区';
    const c = (campuses || []).find((x: any) => x.id === id || x.name === id);
    return c?.name || id;
  };

  const displayData = useMemo(() => {
    const data = orders.filter(o => {
      const oCampusId = getOrderCampusId(o);
      if (isCampusAdmin && oCampusId !== currentUser?.campus && oCampusId !== (currentUser as any)?.campus_id) return false;
      if (filterCampus !== 'all' && oCampusId !== filterCampus) return false;
      // Date filter
      const oDate = (o.createdAt || '').split('T')[0];
      if (dateFrom && oDate && oDate < dateFrom) return false;
      if (dateTo && oDate && oDate > dateTo) return false;
      // Pay status
      if (filterPayStatus !== 'all') {
        if (filterPayStatus === 'paid' && o.status !== 'PAID') return false;
        if (filterPayStatus === 'unpaid' && o.status !== 'PENDING_PAYMENT') return false;
      }
      if (keyword) {
        const student = (students || []).find(s => s.id === getOrderStudentId(o));
        return student?.name.includes(keyword) || student?.phone?.includes(keyword) || o.id.includes(keyword);
      }
      return true;
    });

    return data.map(o => {
      const student = (students || []).find(s => s.id === getOrderStudentId(o));
      const course = (courses || []).find(c => c.id === getOrderCourseId(o));
      return {
        orderId: o.id,
        studentName: student?.name || `学员 ${String(getOrderStudentId(o) || '').slice(-6) || '-'}`,
        phone: student?.phone || '-',
        campus: resolveCampusName(getOrderCampusId(o)),
        courseClass: course?.name || `课程 ${String(getOrderCourseId(o) || '').slice(-6) || '-'}`,
        totalAmount: o.amount,
        receivedAmount: o.status === 'PAID' ? o.amount : 0,
        paymentMethod: (o as any).channel || (o as any).paymentMethod || (o as any).payment_method || '-',
        status: o.status === 'REFUNDED' ? 'refunded' : o.status === 'CANCELLED' ? 'canceled' : 'valid',
        payStatus: o.status === 'PAID' ? 'paid' : 'unpaid',
        createdAt: o.createdAt
      };
    });
  }, [orders, students, courses, campuses, isCampusAdmin, currentUser, keyword, filterPayStatus, filterCampus, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = displayData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const received = displayData.reduce((acc, curr) => acc + curr.receivedAmount, 0);
    const refundedCount = displayData.filter(d => d.status === 'refunded').length;
    return { total, received, count: displayData.length, refundedCount };
  }, [displayData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filterPayStatus, filterCampus, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(displayData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayData.slice(start, start + pageSize);
  }, [displayData, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
      case 'paid': return <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><ElmIcon name="circle-check" size={16} /> 已收全款</span>;
      case 'partial': return <span className="flex items-center gap-1 text-blue-600 font-bold text-[11px]"><ElmIcon name="clock" size={16} /> 部分支付</span>;
      case 'unpaid': return <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]"><ElmIcon name="warning" size={16} /> 未支付</span>;
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
            <ElmIcon name="arrow-right" size={16} />
            <span>统计报表</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600">报表明细</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">业务订单报表明细</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setKeyword('');
              setFilterPayStatus('all');
              setFilterCampus('all');
              setDateFrom(fmt(_past));
              setDateTo(fmt(_today));
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <ElmIcon name="refresh" size={16} /> 重置
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <ElmIcon name="download" size={16} /> 导出当前明细
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-5 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">起始日期 <span className="text-red-500">*</span></label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="calendar" size={16} /></span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">截止日期 <span className="text-red-500">*</span></label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="calendar" size={16} /></span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {!isCampusAdmin && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">筛选校区 <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="location" size={16} /></span>
                <select value={filterCampus} onChange={e => setFilterCampus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer">
                  <option value="all">全部校区</option>
                  {(campuses || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="arrow-down" size={16} /></span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">支付状态</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="money" size={16} /></span>
              <select value={filterPayStatus} onChange={e => setFilterPayStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white appearance-none cursor-pointer">
                <option value="all">全部状态</option>
                <option value="paid">已收全款</option>
                <option value="partial">部分支付</option>
                <option value="unpaid">未支付</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="arrow-down" size={16} /></span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">关键字检索</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ElmIcon name="search" size={16} /></span>
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

        <div className="pt-4 flex justify-end">
          <button className="flex items-center gap-2 px-10 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95">
            <ElmIcon name="search" size={16} /> 执行筛选
          </button>
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex flex-wrap items-center gap-12 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-blue-100"><ElmIcon name="operation" size={16} /></div>
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
            <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><ElmIcon name="operation" size={16} /></button>
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
              {paginatedData.map((item, idx) => (
                <tr key={idx} onClick={() => onViewOrder?.(item.orderId)} className="hover:bg-blue-50/5 transition-all group cursor-pointer">
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
            <span>显示 {Math.min((currentPage - 1) * pageSize + 1, displayData.length)} - {Math.min(currentPage * pageSize, displayData.length)}，共 {displayData.length} 条记录</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <button className="px-3 py-1 bg-slate-100 rounded-md text-slate-800">{pageSize} 条/页</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 transition-all rounded-xl ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              <ElmIcon name="arrow-left" size={16} />
            </button>
            <div className="flex gap-1">
              {getPageNumbers().map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  disabled={typeof p !== 'number'}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === currentPage ? 'bg-slate-900 text-white shadow-lg' : typeof p === 'number' ? 'text-slate-400 hover:bg-white hover:text-slate-900' : 'text-slate-300 cursor-default'}`}
                >{p}</button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 transition-all rounded-xl ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              <ElmIcon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
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
