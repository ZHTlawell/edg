/**
 * StatisticsOverview.tsx - 统计看板 / 财务报表概览
 *
 * 所在模块：统计报表 -> 统计看板
 * 功能：
 *   - 按时间范围展示学员、订单、出勤、课消等关键指标
 *   - 校区管理员仅看本校数据；总部管理员看全局
 *   - 支持筛选、导出、穿透到明细
 * 使用方：admin / campus_admin 的报表模块
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
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

/**
 * StatisticsOverview 主组件（无 props）
 * - scopedOrders / scopedStudents / scopedLedgers：按角色过滤后的数据切片
 * - 校区管理员进入时按 campus_id 收窄范围
 * - 非校区管理员则从 fetchWorkbenchOverview 拉取全局概览数据
 */
export const StatisticsOverview: React.FC = () => {
  const { students, orders, attendanceRecords, assetLedgers, currentUser, courses, workbenchOverview, fetchWorkbenchOverview, addToast } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  const [timeRange, setTimeRange] = useState('30d');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  useEffect(() => {
    if (!isCampusAdmin) {
      fetchWorkbenchOverview();
    }
  }, [fetchWorkbenchOverview, isCampusAdmin]);

  // 按角色过滤数据：校区管理员只看本校区
  const myCampusId = currentUser?.campus_id || '';
  const scopedOrders = useMemo(() => {
    if (!isCampusAdmin) return orders;
    return orders.filter((o: any) => {
      const oCampus = o.course?.campus_id || o.campusId || o.campus_id;
      return oCampus === myCampusId;
    });
  }, [orders, isCampusAdmin, myCampusId]);

  const scopedStudents = useMemo(() => {
    if (!isCampusAdmin) return students;
    return students.filter(s => s.campus_id === myCampusId || s.campus === myCampusId);
  }, [students, isCampusAdmin, myCampusId]);

  const scopedLedgers = useMemo(() => {
    if (!isCampusAdmin) return assetLedgers;
    const studentIds = new Set(scopedStudents.map(s => s.id));
    return assetLedgers.filter((l: any) => studentIds.has(l.student_id));
  }, [assetLedgers, isCampusAdmin, scopedStudents]);

  const stats = useMemo(() => {
    const kpis = !isCampusAdmin ? workbenchOverview?.kpis : null; // 校区端不用总部 kpis

    const totalEnrollment = kpis?.newEnrollments ?? new Set(scopedOrders.map((o: any) => o.studentId || o.student_id)).size;
    const totalOrders = scopedOrders.length;
    const totalRevenue = kpis?.annualRevenue ?? scopedOrders.filter((o: any) => o.status === 'PAID').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const totalConsumption = scopedLedgers.filter((l: any) => l.businessType === 'CONSUME').reduce((sum: number, l: any) => sum + Math.abs(l.changeQty || 0), 0);
    const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const totalAttendance = attendanceRecords.length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance * 100).toFixed(1) : (kpis?.avgFillRate?.toFixed(1) ?? '0');
    const pendingRefundAmt = kpis?.pendingRefunds ? `${kpis.pendingRefunds} 笔待审` : '—';

    return [
      { label: '累计报名人数', value: totalEnrollment, trend: '--', isUp: true, icon: <ElmIcon name="user" size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: '新增订单总数', value: totalOrders, trend: '--', isUp: true, icon: <CreditCard />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: '实收营收金额', value: `¥${totalRevenue.toLocaleString()}`, trend: '--', isUp: true, icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: '退费申请 (待审)', value: pendingRefundAmt, trend: '--', isUp: false, icon: <Undo2 />, color: 'text-red-600', bg: 'bg-red-50' },
      { label: '平均满班率', value: `${attendanceRate}%`, trend: '--', isUp: true, icon: <BarChart3 />, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: '累计课消课时', value: `${totalConsumption}H`, trend: '--', isUp: true, icon: <ElmIcon name="reading" size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  }, [scopedOrders, attendanceRecords, scopedLedgers, workbenchOverview, isCampusAdmin]);

  const handleExportStats = () => {
    const kpis = workbenchOverview?.kpis;
    if (!kpis && stats.every((s: any) => s.value === 0 || s.value === '¥0')) {
      addToast('暂无统计数据可导出', 'warning');
      return;
    }
    const headers = ['指标名称', '当前数值', '趋势'];
    const rows = stats.map((s: any) => [s.label, s.value, s.trend]);
    const campusRows = (workbenchOverview?.campusRanking || []).map((c: any) => [`校区排行-${c.name}`, `¥${c.revenue.toFixed(2)}M`, '-']);
    const csvContent = [headers, ...rows, [], ['校区业绩排行'], ...campusRows]
      .map(e => (e as any[]).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `全校运营统计报表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('报表已导出为 CSV 文件', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Home size={14} />
            <span>数据分析</span>
            <ElmIcon name="arrow-right" size={16} />
            <span className="text-slate-600">统计报表</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isCampusAdmin ? `${myCampus} 运营数据概览` : '全校运营统计报表'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportStats} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">
            <ElmIcon name="download" size={16} /> 导出全量报表
          </button>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 20 })}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.isUp ? <ElmIcon name="trend-charts" size={16} /> : <ElmIcon name="data-analysis" size={16} />}
                {stat.trend} <span className="text-slate-300 font-medium">vs 上期</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900">营收趋势（按月）</h4>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span> 实收营收（万元）
              </span>
            </div>
          </div>
          {(() => {
            // Prefer backend revenueTrend data, fallback to computing from orders
            let months: string[] = [];
            let values: number[] = [];

            if (workbenchOverview?.revenueTrend?.length > 0) {
              months = workbenchOverview.revenueTrend.map((d: any) => d.month);
              values = workbenchOverview.revenueTrend.map((d: any) => d.amount); // already in 万元
            } else {
              const paidOrders = scopedOrders.filter((o: any) => o.status === 'PAID' && o.createdAt);
              const monthMap: Record<string, number> = {};
              paidOrders.forEach((o: any) => {
                const month = (o.createdAt || '').slice(0, 7);
                if (month) monthMap[month] = (monthMap[month] || 0) + (o.amount || 0);
              });
              months = Object.keys(monthMap).sort().slice(-12);
              values = months.map(m => monthMap[m] / 10000);
            }

            if (months.length === 0) {
              return (
                <div className="flex-1 flex items-center justify-center text-slate-300">
                  <p className="text-sm font-medium">暂无营收数据</p>
                </div>
              );
            }

            const maxVal = Math.max(...values, 0.01);
            const minVal = 0;
            const svgW = 640;
            const svgH = 280;
            const padL = 50, padR = 20, padT = 20, padB = 40;
            const chartW = svgW - padL - padR;
            const chartH = svgH - padT - padB;

            const points = values.map((v, i) => ({
              x: padL + (months.length === 1 ? chartW / 2 : (i / (months.length - 1)) * chartW),
              y: padT + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH,
              val: v,
              month: months[i],
            }));

            const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
            const areaPath = `M${points[0].x},${padT + chartH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padT + chartH} Z`;

            // Y-axis ticks (5 levels)
            const yTicks = Array.from({ length: 5 }, (_, i) => {
              const val = minVal + ((maxVal - minVal) * i) / 4;
              const y = padT + chartH - (i / 4) * chartH;
              return { val, y };
            });

            return (
              <div className="flex-1 relative" style={{ minHeight: svgH }}>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {yTicks.map((t, i) => (
                    <g key={i}>
                      <line x1={padL} y1={t.y} x2={svgW - padR} y2={t.y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? '' : '4,4'} />
                      <text x={padL - 8} y={t.y + 4} textAnchor="end" className="fill-slate-400" style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace' }}>
                        {t.val >= 1 ? t.val.toFixed(1) : t.val.toFixed(2)}
                      </text>
                    </g>
                  ))}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#areaGrad)" />

                  {/* Line */}
                  <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Data points + labels */}
                  {points.map((p, i) => (
                    <g key={i} className="group">
                      {/* Hover area */}
                      <circle cx={p.x} cy={p.y} r="16" fill="transparent" className="cursor-pointer" />
                      {/* Outer ring on hover */}
                      <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" fillOpacity="0" className="transition-all duration-200" style={{ pointerEvents: 'none' }}>
                        <set attributeName="fill-opacity" to="0.15" begin={`hover-${i}.mouseenter`} end={`hover-${i}.mouseleave`} />
                      </circle>
                      {/* Dot */}
                      <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2.5" className="transition-all duration-200" />

                      {/* Value tooltip — show on top of every other point, or all if <=6 */}
                      {(months.length <= 6 || i % Math.ceil(months.length / 6) === 0 || i === months.length - 1) && (
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-slate-700" style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                          {p.val >= 1 ? p.val.toFixed(1) : p.val.toFixed(2)}万
                        </text>
                      )}

                      {/* X-axis month label */}
                      {(months.length <= 8 || i % Math.ceil(months.length / 8) === 0 || i === months.length - 1) && (
                        <text x={p.x} y={svgH - 8} textAnchor="middle" className="fill-slate-400" style={{ fontSize: '10px', fontWeight: 600 }}>
                          {p.month.slice(5)}月
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
          <h4 className="font-bold text-slate-900 mb-8">营收占比 (按项目)</h4>
          <div className="space-y-6">
            {courses.slice(0, 5).map((course) => {
              const courseRevenue = scopedOrders.filter((o: any) => (o.courseId || o.course_id) === course.id && o.status === 'PAID').reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
              const allRevenue = scopedOrders.filter((o: any) => o.status === 'PAID').reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 1;
              const percent = (courseRevenue / allRevenue * 100).toFixed(0);
              return (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 truncate max-w-[150px]">{course.name}</span>
                    <span className="text-slate-900 font-mono">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
