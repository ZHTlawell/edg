import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { exportCSV } from '../utils/exportCSV';
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

export const StatisticsOverview: React.FC = () => {
  const { students, orders, attendanceRecords, assetLedgers, currentUser, courses } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus || '总校区';

  const [timeRange, setTimeRange] = useState('30d');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // 实时数据聚合统计
  const stats = useMemo(() => {
    // 过滤校区（如果是校区管理员）
    const filteredOrders = isCampusAdmin ? orders.filter(o => o.campusId === myCampus) : orders;
    const filteredAttendance = isCampusAdmin ? attendanceRecords.filter(r => r.campusId === myCampus) : attendanceRecords;
    const filteredLedgers = isCampusAdmin ? assetLedgers.filter(l => l.studentId.includes(myCampus)) : assetLedgers; // 假设 ID 包含校区信息，或需要更细致过滤

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalEnrollment = new Set(filteredOrders.map(o => o.studentId)).size;
    const totalConsumption = filteredLedgers.filter(l => l.businessType === 'CONSUME').reduce((sum, l) => sum + Math.abs(l.changeQty), 0);

    // 计算出勤率
    const presentCount = filteredAttendance.filter(r => r.status === 'present').length;
    const totalAttendance = filteredAttendance.length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance * 100).toFixed(1) : '0';

    return [
      { label: '累计报名人数', value: totalEnrollment, trend: '+12%', isUp: true, icon: <ElmIcon name="user" size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: '新增订单总数', value: filteredOrders.length, trend: '+5%', isUp: true, icon: <CreditCard />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: '实收营收金额', value: `¥${totalRevenue.toLocaleString()}`, trend: '+15%', isUp: true, icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: '退费金额 (暂计)', value: '¥2,400', trend: '-2%', isUp: false, icon: <Undo2 />, color: 'text-red-600', bg: 'bg-red-50' },
      { label: '平均到课率', value: `${attendanceRate}%`, trend: '+0.5%', isUp: true, icon: <BarChart3 />, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: '累计课消课时', value: `${totalConsumption}H`, trend: '+8%', isUp: true, icon: <ElmIcon name="reading" size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  }, [orders, attendanceRecords, assetLedgers, isCampusAdmin, myCampus]);

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
          <button
            onClick={() => {
              const headers = ['指标', '数值', '趋势'];
              const rows = stats.map(s => [s.label, String(s.value), s.trend]);
              exportCSV(`统计报表_${isCampusAdmin ? myCampus : '全校'}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
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

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-slate-900">营收与消课实时趋势 (Mock View)</h4>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">实收营收</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">实际消课</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed flex items-center justify-center text-slate-300">
            <p className="text-sm font-medium">图表分析引擎加载中...</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
          <h4 className="font-bold text-slate-900 mb-8">营收占比 (按项目)</h4>
          <div className="space-y-6">
            {courses.slice(0, 5).map((course, i) => {
              const courseRevenue = orders.filter(o => o.courseId === course.id).reduce((sum, o) => sum + o.amount, 0);
              const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 1); // Avoid div by zero
              const percent = (courseRevenue / totalRevenue * 100).toFixed(0);
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
