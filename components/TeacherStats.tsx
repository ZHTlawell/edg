
import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    Star,
    CheckCircle2,
    Calendar,
    ChevronRight,
    TrendingDown,
    MonitorPlay
} from 'lucide-react';

export const TeacherStats: React.FC = () => {
    const KpiCards = [
        { label: '平均学员好评', value: '4.92', trend: '+0.05', isUp: true, icon: <Star />, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: '到课率记录', value: '98.5%', trend: '+1.2%', isUp: true, icon: <CheckCircle2 />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: '作业批改耗时', value: '4.2H', trend: '-0.8', isUp: false, icon: <Clock />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: '累计带班人数', value: '428', trend: '+24', isUp: true, icon: <Users />, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>个人中心</span>
                        <ChevronRight size={14} />
                        <span className="text-slate-600">教学统计</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">教学质量数据看板</h1>
                </div>
                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    {['日榜', '周榜', '本学期', '年度'].map((t, i) => (
                        <button key={i} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${i === 2 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {KpiCards.map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                        <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shrink-0`}>
                            {React.cloneElement(kpi.icon as React.ReactElement, { size: 20 })}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight my-1">{kpi.value}</h3>
                            <p className={`text-[10px] font-bold flex items-center gap-1 ${kpi.isUp ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                {kpi.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {kpi.trend} <span className="text-slate-300 font-medium">周期对比</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Trend */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 size={18} className="text-indigo-600" /> 带班出勤走势 (本月)
                        </h4>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> UI精英1班</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> 平均水平</div>
                        </div>
                    </div>

                    <div className="flex items-end gap-3 h-48 relative">
                        {[65, 80, 75, 90, 85, 95, 88].map((h, i) => (
                            <div key={i} className="flex-1 space-y-2 group">
                                <div className="relative w-full h-full flex flex-col justify-end">
                                    <div className="absolute inset-0 bg-slate-50/50 rounded-t-xl -z-10 h-full"></div>
                                    <div className="w-full bg-indigo-500 rounded-t-xl group-hover:bg-indigo-600 transition-colors relative" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{h}%</div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 text-center">第{i + 1}周</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribution */}
                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 space-y-8">
                    <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest">授课分布 (课目占比)</h4>
                    <div className="space-y-6">
                        {[
                            { label: '软件应用技巧', percent: 45 },
                            { label: '理论体系建设', percent: 30 },
                            { label: '项目实战辅导', percent: 25 },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span>{item.label}</span>
                                    <span className="font-mono">{item.percent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${item.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><MonitorPlay size={24} /></div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold tracking-tight">核心竞争力评分</p>
                                <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">相比全校平均 +15%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
