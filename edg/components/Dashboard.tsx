
import React, { useMemo, useEffect } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { ElmIcon } from './ElmIcon';
import { useStore } from '../store';

// ─── Smooth SVG Line Chart (固定12个月 + Y轴刻度) ─────────────────────────
interface LineChartProps {
  data: { month: string; amount: number }[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const MONTHS = data.map(d => {
    const parts = d.month.split('-');
    return parts.length >= 2 ? parseInt(parts[1]) + '月' : d.month;
  });
  const values = data.map(d => d.amount);

  const W = 620, H = 200, PAD_L = 50, PAD_R = 20, PAD_T = 20, PAD_B = 20;
  const maxV = Math.max(...values, 1);
  // Y轴刻度：自动计算合理的刻度间隔
  const niceStep = (() => {
    const rough = maxV / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / mag;
    if (normalized <= 1) return mag;
    if (normalized <= 2) return 2 * mag;
    if (normalized <= 5) return 5 * mag;
    return 10 * mag;
  })();
  const yMax = Math.ceil(maxV / niceStep) * niceStep;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
  const toY = (v: number) => H - PAD_B - ((v) / (yMax || 1)) * (H - PAD_T - PAD_B);

  const pts = values.map((v, i): [number, number] => [toX(i), toY(v)]);

  const linePath = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');

  const areaPath = `${linePath} L ${toX(data.length - 1)},${H - PAD_B} L ${toX(0)},${H - PAD_B} Z`;

  return (
    <div className="relative w-full" style={{ paddingBottom: '42%' }}>
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y轴刻度线 + 刻度标签 */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={`y-${i}`}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{tick}</text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" opacity={i === data.length - 1 ? 1 : 0} />
        ))}
        {/* 12个月份标签全部显示 */}
        {MONTHS.map((m, i) => (
          <text key={i} x={toX(i)} y={H + 18} textAnchor="middle" fontSize="10" fill="#94a3b8">{m}</text>
        ))}
      </svg>
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface KpiProps { label: string; value: string; suffix?: string; change: string; up: boolean; icon: string; iconBg: string; iconColor: string; }
const KpiCard: React.FC<KpiProps> = ({ label, value, suffix, change, up, icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <ElmIcon name={icon} size={20} className={iconColor} />
      </div>
      <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-red-400'}`}>
        {up ? <ElmIcon name="trend-charts" size={12} /> : <ElmIcon name="data-line" size={12} />}{change}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}{suffix && <span className="text-base font-semibold text-slate-500 ml-1">{suffix}</span>}</p>
    </div>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const Dashboard: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const { students, classes, currentUser, workbenchOverview, fetchWorkbenchOverview } = useStore();
  const isHQAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isHQAdmin) {
      fetchWorkbenchOverview();
    }
  }, [isHQAdmin, fetchWorkbenchOverview]);

  // If loading or no data yet, use static defaults but styled similarly
  const data = workbenchOverview || {
    kpis: { annualRevenue: 12850000, totalStudents: students.length || 15420, avgFillRate: 82.5, newEnrollments: 846, pendingRefunds: 2 },
    revenueTrend: [
      { month: '1月', amount: 320 }, { month: '2月', amount: 410 }, { month: '3月', amount: 380 },
      { month: '4月', amount: 460 }, { month: '5月', amount: 520 }, { month: '6月', amount: 490 },
      { month: '7月', amount: 680 }, { month: '8月', amount: 720 }, { month: '9月', amount: 610 },
      { month: '10月', amount: 540 }, { month: '11月', amount: 760 }, { month: '12月', amount: 890 }
    ],
    campusRanking: [
      { name: '海淀校区', revenue: 4.2 }, { name: '朝阳校区', revenue: 3.8 },
      { name: '东城校区', revenue: 2.1 }, { name: '西城校区', revenue: 1.8 }
    ],
    latestOrders: [
      { student: '陈梓豪', course: '少儿编程进阶班', amount: 8800, campus: '海淀校区' },
      { student: '周美琳', course: '雅思精品提分课', amount: 15600, campus: '朝阳校区' }
    ]
  };

  const maxRev = Math.max(...data.campusRanking.map((c: any) => c.revenue), 1);

  return (
    <div className="space-y-5 animate-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="年度总营收" value={`¥${(data.kpis.annualRevenue).toLocaleString()}`} change="+15.2%" up={true} icon="video-play" iconBg="bg-blue-50" iconColor="text-blue-500" />
        <KpiCard label="在读学生总数" value={data.kpis.totalStudents.toLocaleString()} change="+5.8%" up={true} icon="user" iconBg="bg-violet-50" iconColor="text-violet-500" />
        <KpiCard label="平均满班率" value={data.kpis.avgFillRate.toString()} suffix="%" change="-2.1%" up={false} icon="calendar" iconBg="bg-amber-50" iconColor="text-amber-500" />
        <KpiCard label="新增报名人数" value={data.kpis.newEnrollments.toString()} suffix="人" change="+12%" up={true} icon="circle-plus" iconBg="bg-emerald-50" iconColor="text-emerald-500" />
      </div>

      {/* Chart + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">过去12个月招生营收增长趋势</h2>
              <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] cursor-help font-bold">i</div>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
              按月统计
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">单位：万元</p>
          <LineChart data={data.revenueTrend} />
        </div>

        {/* Campus Ranking */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-4">各校区业绩贡献排行</h2>
          <div className="space-y-4">
            {data.campusRanking.map((c: any, i: number) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">¥{c.revenue.toFixed(1)}M</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(c.revenue / maxRev) * 100}%`, background: i === 0 ? '#3b82f6' : i === 1 ? '#60a5fa' : i === 2 ? '#93c5fd' : '#bfdbfe' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders + Pending tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">最新报名订单动态</h2>
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">实时</span>
            </div>
            <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1" onClick={() => onNavigate?.('payments-orders')}>
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="text-left text-[11px] font-semibold text-slate-400 px-5 py-3">学生/学员</th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 px-3 py-3">报课名称</th>
                  <th className="text-right text-[11px] font-semibold text-slate-400 px-3 py-3">实付金额</th>
                  <th className="text-right text-[11px] font-semibold text-slate-400 px-5 py-3">成交校区</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.latestOrders.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{o.student}</td>
                    <td className="px-3 py-3.5 text-sm text-slate-600 max-w-[120px] truncate">{o.course}</td>
                    <td className="px-3 py-3.5 text-right text-sm font-bold text-blue-600">¥{o.amount.toLocaleString()}.00</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">{o.campus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">待审批教务事项</h2>
            <span className="text-xs text-slate-400 font-medium">{(data.kpis.pendingRefunds || 0) + (data.kpis.pendingCampusAdmins || 0)} 项待处理</span>
          </div>
          <div className="divide-y divide-slate-50">
            {data.kpis.pendingRefunds > 0 && (
               <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50`}>
                  <ElmIcon name="refresh" size={16} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">待处理退费申请</p>
                  <p className="text-xs text-slate-400 mt-0.5">当前共有 {data.kpis.pendingRefunds} 笔待审批退费</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all" onClick={() => onNavigate?.('refund-management')}>去审核</button>
                </div>
              </div>
            )}
            {data.kpis.pendingCampusAdmins > 0 && (
               <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-50`}>
                  <ElmIcon name="map-pin" size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">新校区入驻申请</p>
                  <p className="text-xs text-slate-400 mt-0.5">{data.kpis.pendingCampusAdmins} 个校区管理员账号待审核</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all" onClick={() => onNavigate?.('campus-list')}>去处理</button>
                </div>
              </div>
            )}
            {data.kpis.pendingRefunds === 0 && data.kpis.pendingCampusAdmins === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ElmIcon name="circle-check" size={40} className="text-emerald-300 mb-2" />
                <p className="text-sm">暂无待审批事项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
