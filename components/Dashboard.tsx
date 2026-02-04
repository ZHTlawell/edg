
import React from 'react';
import { 
  Users, 
  CircleDollarSign, 
  BookMarked, 
  ArrowRight, 
  Download,
  PlusCircle,
  ChevronRight,
  Home
} from 'lucide-react';
import { StatCard } from './StatCard';

// Local implementation of TrendChart as the external file was not provided
const TrendChart: React.FC = () => {
  const data = [45, 52, 38, 65, 48, 80, 70, 90, 65, 55, 75, 85];
  return (
    <div className="w-full h-full flex items-end justify-between gap-2 pt-4 min-h-[240px]">
      {data.map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
          <div 
            className="w-full bg-blue-100 group-hover:bg-blue-500 transition-all rounded-t-sm" 
            style={{ height: `${height}%` }}
          ></div>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{i + 1}月</span>
        </div>
      ))}
    </div>
  );
};

// Local implementation of ActivityList as the external file was not provided
const ActivityList: React.FC = () => {
  const activities = [
    { id: '1', title: '新学员报名', description: '学员“张美玲”报名了《高级UI/UX设计》课程', time: '12分钟前', color: 'bg-blue-500' },
    { id: '2', title: '支付成功', description: '订单 #88492 已确认，金额 ¥4,800', time: '1小时前', color: 'bg-green-500' },
    { id: '3', title: '系统预警', description: '课程《商业数据分析》报名人数接近上限', time: '3小时前', color: 'bg-orange-500' },
    { id: '4', title: '排课提醒', description: '下周一 A301 教室已由王老师预约', time: '5小时前', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {activities.map((activity, idx) => (
        <div key={activity.id} className="flex gap-4">
          <div className="relative flex flex-col items-center shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${activity.color} mt-1.5 z-10`}></div>
            {idx !== activities.length - 1 && (
              <div className="w-px flex-1 bg-slate-100 my-1"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
              <span className="text-[11px] text-slate-400">{activity.time}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{activity.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={16} className="text-slate-500" />
        <a href="#" className="hover:text-blue-600 transition-colors">首页</a>
        <ChevronRight size={14} />
        <span className="text-slate-600 font-medium">仪表盘</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">仪表盘概览</h1>
          <p className="text-sm text-slate-500">欢迎回来，这是总校区今天的运营概览。</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} />
            导出数据
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
            <PlusCircle size={16} />
            新增报名
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="总学员数"
          value="2,420"
          change="12%"
          trend="up"
          icon={<Users size={24} />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="总营收"
          value="¥124,500"
          change="4.5%"
          trend="up"
          icon={<CircleDollarSign size={24} />}
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          label="活跃班级"
          value="48"
          change="0%"
          trend="neutral"
          icon={<BookMarked size={24} />}
          iconBg="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Main Grid: Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Enrollment Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">招生统计趋势</h3>
            <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              查看详情 <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-6 flex-1 min-h-[300px]">
             <TrendChart />
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">最近动态</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <ActivityList />
          </div>
        </div>
      </div>
    </div>
  );
};
