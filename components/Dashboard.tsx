
import React, { useMemo, useState } from 'react';
import { MonitorPlay, Users, CalendarCheck, UserPlus, TrendingUp, TrendingDown, ChevronRight, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store';

// ─── Smooth SVG Line Chart ───────────────────────────────────────────────────
const monthlyRevenue = [320, 410, 380, 460, 520, 490, 680, 720, 610, 540, 760, 890];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const W = 580, H = 200, PAD = 20;
const minV = Math.min(...monthlyRevenue), maxV = Math.max(...monthlyRevenue);
const toX = (i: number) => PAD + (i / (monthlyRevenue.length - 1)) * (W - PAD * 2);
const toY = (v: number) => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2);

function buildPath(pts: [number, number][]) {
  return pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
}
const pts = monthlyRevenue.map((v, i): [number, number] => [toX(i), toY(v)]);
const linePath = buildPath(pts);
const areaPath = `${linePath} L ${toX(monthlyRevenue.length - 1)},${H - PAD} L ${toX(0)},${H - PAD} Z`;

const LineChart: React.FC = () => (
  <div className="relative w-full" style={{ paddingBottom: '40%' }}>
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="absolute inset-0 w-full h-full overflow-visible">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        {/* highlight band around peak (Oct-Nov) */}
        <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 1, 2, 3].map(i => {
        const y = PAD + (i / 3) * (H - PAD * 2);
        return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
      })}
      {/* Peak highlight band */}
      <path
        d={`M ${toX(8)},${PAD - 10} L ${toX(11)},${PAD - 10} L ${toX(11)},${H - PAD} L ${toX(8)},${H - PAD} Z`}
        fill="url(#peakGrad)"
      />
      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots on hover — simplified as always-visible small dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" opacity={i === 10 ? 1 : 0} />
      ))}
      {/* Month labels */}
      {MONTHS.map((m, i) => (
        <text key={m} x={toX(i)} y={H + 18} textAnchor="middle" fontSize="11" fill="#94a3b8">{m}</text>
      ))}
    </svg>
  </div>
);

// ─── Campus Ranking Bar ───────────────────────────────────────────────────────
const campusRanking = [
  { name: '海淀校区', revenue: 4.2, color: '#3b82f6' },
  { name: '朝阳校区', revenue: 3.8, color: '#93c5fd' },
  { name: '西城校区', revenue: 2.1, color: '#bfdbfe' },
  { name: '东城校区', revenue: 1.8, color: '#dbeafe' },
  { name: '丰台校区', revenue: 0.9, color: '#eff6ff' },
];
const maxRev = campusRanking[0].revenue;

// ─── Orders ──────────────────────────────────────────────────────────────────
const mockOrders = [
  { student: '陈梓豪', course: '少儿编程进阶班', amount: 8800, campus: '海淀校区' },
  { student: '周美琳', course: '雅思精品提分课', amount: 15600, campus: '朝阳校区' },
  { student: '赵阳', course: '高一数理化同步', amount: 6200, campus: '西城校区' },
  { student: '林思雨', course: '美术启蒙培训', amount: 4500, campus: '东城校区' },
  { student: '王子豪', course: 'Python数据分析', amount: 9800, campus: '丰台校区' },
];

const pendingTasks = [
  { icon: RefreshCw, label: '转班申请：[英语同步班] → [雅思精英班]', sub: '申请人：陈老师（海淀校区）2小时前', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: UserPlus, label: '新教师入职审核：张建国', sub: '申请人：人事部 | 昨天 16:30', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface KpiProps { label: string; value: string; suffix?: string; change: string; up: boolean; Icon: React.FC<any>; iconBg: string; iconColor: string; }
const KpiCard: React.FC<KpiProps> = ({ label, value, suffix, change, up, Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-red-400'}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{change}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}{suffix && <span className="text-base font-semibold text-slate-500 ml-1">{suffix}</span>}</p>
    </div>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { students, classes, currentUser } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const [chartMode, setChartMode] = useState<'月' | '季'>('月');

  const studentCount = students.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="年度总营收" value="¥12,850,000" change="+15.2%" up={true} Icon={MonitorPlay} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <KpiCard label="在读学生总数" value={studentCount > 0 ? studentCount.toLocaleString() : '15,420'} change="+5.8%" up={true} Icon={Users} iconBg="bg-violet-50" iconColor="text-violet-500" />
        <KpiCard label="平均满班率" value="82.5" suffix="%" change="-2.1%" up={false} Icon={CalendarCheck} iconBg="bg-amber-50" iconColor="text-amber-500" />
        <KpiCard label="新增报名人数" value="846" suffix="人" change="+12%" up={true} Icon={UserPlus} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
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
            <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all">
              按{chartMode}统计 <ChevronRight size={12} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">单位：万元</p>
          <LineChart />
        </div>

        {/* Campus Ranking */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-4">各校区业绩贡献排行</h2>
          <div className="space-y-4">
            {campusRanking.map((c, i) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">¥{c.revenue}M</span>
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
            <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
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
                {mockOrders.map((o, i) => (
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
            <button className="text-xs text-blue-600 font-semibold hover:underline">批量审批</button>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg}`}>
                  <t.icon size={16} className={t.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{t.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">通过</button>
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold transition-colors">查看</button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckCircle size={40} className="text-emerald-300 mb-2" />
                <p className="text-sm">暂无待审批事项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
