
import React, { useMemo } from 'react';
import {
  Users,
  CircleDollarSign,
  BookMarked,
  ArrowRight,
  Download,
  PlusCircle,
  ChevronRight,
  Home,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Clock,
  ArrowUpRight,
  UserPlus,
  PlayCircle,
  AlertCircle,
  TrendingDown,
  MapPin,
  User as UserIcon,
  MoreHorizontal
} from 'lucide-react';
import { StatCard } from './StatCard';
import { useStore } from '../store';
import { Student } from '../types';

// Local implementation of TrendChart
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

// Local implementation of ActivityList
const ActivityList: React.FC<{ campus?: string, isBranch?: boolean }> = ({ campus, isBranch }) => {
  const { orders, students, courses } = useStore();

  const realActivities = useMemo(() => {
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(order => {
      const student = students.find(s => s.id === order.studentId);
      const course = courses.find(c => c.id === order.courseId);

      const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: order.id,
        title: order.status === 'paid' ? '支付成功' : '新订单创建',
        description: `学员“${student?.name || '未知学员'}”购买了《${course?.name || '未知课程'}》`,
        time: timeStr,
        color: order.status === 'paid' ? 'bg-emerald-500' : 'bg-blue-500',
        campus: order.campusId
      };
    });
  }, [orders, students, courses]);

  const activities = campus ? realActivities.filter(a => a.campus === campus) : realActivities;

  return (
    <div className="space-y-6">
      {activities.length > 0 ? activities.map((activity, idx) => (
        <div key={activity.id} className="flex gap-4 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
          <div className="relative flex flex-col items-center shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${activity.color} mt-1.5 z-10 ring-4 ${isBranch ? 'ring-cyan-50' : 'ring-slate-50'}`}></div>
            {idx !== activities.length - 1 && (
              <div className="w-px flex-1 bg-slate-100 my-1"></div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{activity.title}</h4>
              <span className="text-[11px] text-slate-400">{activity.time}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">{activity.description}</p>
          </div>
        </div>
      )) : (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <MessageSquare size={32} className="opacity-10" />
          <span className="text-xs">暂无待办动态</span>
        </div>
      )}
    </div>
  );
};

// Specialized Task List for Branch Admins
const BranchShortcut: React.FC = () => {
  const tasks = [
    { label: '学员缴费', icon: <CircleDollarSign size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: '录入考勤', icon: <CheckCircle2 size={20} />, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: '发布通知', icon: <MessageSquare size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '课室预定', icon: <Calendar size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tasks.map(task => (
        <button key={task.label} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group text-left">
          <div className={`p-2 rounded-xl ${task.bg} ${task.color} group-hover:scale-110 transition-transform`}>
            {task.icon}
          </div>
          <span className="text-sm font-bold text-slate-700">{task.label}</span>
        </button>
      ))}
    </div>
  );
};

const RenewalWarningList: React.FC = () => {
  const store = useStore();

  const warnings = useMemo(() => {
    try {
      if (typeof store.getLowBalanceAssetAccounts === 'function') {
        return store.getLowBalanceAssetAccounts();
      }
      console.warn('getLowBalanceAssetAccounts is not defined in store');
      return [];
    } catch (e) {
      console.error('Error fetching renewal warnings:', e);
      return [];
    }
  }, [store]);

  if (!warnings || warnings.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2">
      <CheckCircle2 size={32} className="opacity-10" />
      <span className="text-xs">暂无待续费预警</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {warnings.map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl hover:bg-orange-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
              <AlertCircle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{item.studentName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{item.courseName}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-orange-600 font-mono">{item.remainingQty} <span className="text-[10px]">H</span></p>
            <p className="text-[10px] text-orange-400 font-bold uppercase">余额告急</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { students, classes, currentUser } = useStore();
  const isCampusAdmin = currentUser?.role === 'campus_admin';
  const myCampus = currentUser?.campus;

  const stats = useMemo(() => {
    const filteredStudents = isCampusAdmin ? students.filter(s => s.campus === myCampus) : students;
    const filteredClasses = isCampusAdmin ? classes.filter(c => c.campus === myCampus) : classes;

    return {
      studentCount: filteredStudents.length,
      classCount: filteredClasses.length,
      revenue: isCampusAdmin ? '¥32,400' : '¥124,500' // Partially simulated
    };
  }, [students, classes, isCampusAdmin, myCampus]);

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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isCampusAdmin ? '分校运营工作台' : '管理总部仪表盘'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isCampusAdmin
              ? `欢迎回来，这里是 ${myCampus} 的实时教务与运营执行看板。`
              : '欢迎回来，这是全校区今日运营态势与核心数据概览。'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCampusAdmin ? (
            <button className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 active:scale-95">
              <UserPlus size={18} />
              学员登记
            </button>
          ) : (
            <>
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                <Download size={16} />
                导出周报
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                <PlusCircle size={18} />
                全局配置
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label={isCampusAdmin ? "本校在读学员" : "集团在读总人数"}
          value={stats.studentCount.toString()}
          change="12%"
          trend="up"
          icon={<Users size={24} />}
          iconBg={isCampusAdmin ? "bg-cyan-50 text-cyan-600" : "bg-blue-50 text-blue-600"}
        />
        <StatCard
          label={isCampusAdmin ? "本月消课营收" : "全集团月度营收"}
          value={stats.revenue}
          change="4.5%"
          trend="up"
          icon={<CircleDollarSign size={24} />}
          iconBg={isCampusAdmin ? "bg-emerald-50 text-emerald-600" : "bg-green-50 text-green-600"}
        />
        <StatCard
          label={isCampusAdmin ? "今日开课班级" : "全辖活跃班级"}
          value={stats.classCount.toString()}
          change="2%"
          trend="up"
          icon={<BookMarked size={24} />}
          iconBg={isCampusAdmin ? "bg-violet-50 text-violet-600" : "bg-orange-50 text-orange-600"}
        />
      </div>

      {isCampusAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle size={18} className="text-cyan-500" /> 快速业务入口
                </h3>
              </div>
              <BranchShortcut />
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-[2rem] text-white flex flex-col justify-between shadow-xl shadow-cyan-100 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={12} /> 教务待办提醒
                </div>
                <h2 className="text-2xl font-bold leading-tight">您有 <span className="text-cyan-200">5</span> 个待确认订单<br />需在今天 18:00 前处理</h2>
              </div>
              <button className="relative z-10 mt-6 w-full py-4 bg-white text-cyan-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-50 transition-all active:scale-95 shadow-lg">
                立即处理 <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-500" /> 续费预警名单
              </h3>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">余额 ≤ 3H</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              <RenewalWarningList />
            </div>
          </div>
        </>
      )}

      {/* Main Grid: Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Module: Trend or Schedule */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              {isCampusAdmin ? <Clock size={18} className="text-cyan-500" /> : <TrendingDown size={18} className="text-blue-500" />}
              {isCampusAdmin ? '今日课程安排预览' : '全集团招生趋势'}
            </h3>
            <button className={`${isCampusAdmin ? 'text-cyan-600' : 'text-blue-600'} text-xs font-bold hover:underline flex items-center gap-1`}>
              查看完整计划 <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="p-8 flex-1">
            {isCampusAdmin ? (
              <div className="space-y-4">
                {[
                  { time: '09:00 - 11:30', name: 'UI精英1班', room: 'A301', teacher: '李老师', status: 'ongoing' },
                  { time: '14:00 - 16:30', name: '全栈架构班', room: 'B202', teacher: '张教授', status: 'pending' },
                  { time: '18:30 - 20:30', name: '数据分析研修', room: 'C101', teacher: '陈首席', status: 'pending' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:border-cyan-200 hover:bg-white transition-all">
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm min-w-[100px]">
                      <span className="text-xs font-bold text-slate-900">{item.time.split(' - ')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Start Time</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
                        <MapPin size={12} /> {item.room} · <UserIcon size={12} /> {item.teacher}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === 'ongoing' ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 flex items-center gap-1.5 animate-pulse">
                          <PlayCircle size={12} /> 上课中
                        </span>
                      ) : (
                        <button className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm">
                          签到
                        </button>
                      )}
                      <button className="p-2 text-slate-300 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px]">
                <TrendChart />
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className={isCampusAdmin ? 'text-cyan-500' : 'text-blue-500'} />
              {isCampusAdmin ? '校区动态' : '全系统动态'}
            </h3>
          </div>
          <div className="p-8 flex-1 overflow-y-auto">
            <ActivityList campus={isCampusAdmin ? myCampus : undefined} isBranch={isCampusAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
};
