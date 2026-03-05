
import React from 'react';
import {
    Bell,
    ChevronRight,
    Mail,
    MessageCircle,
    Megaphone,
    Clock,
    CheckCircle2,
    MoreVertical
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
    { id: 1, title: '【调课通知】高级UI/UX设计实战', content: '尊敬的学员，由于原教室电路检修，原定于明天14:00的课程将调整至 A305 教室举行，请知悉。', time: '10分钟前', type: 'urgent', read: false },
    { id: 2, title: '作业批改提醒', content: '您提交的《App 复杂列表系统设计》作业李建国老师已完成批改，快去查看评价吧！', time: '1小时前', type: 'homework', read: false },
    { id: 3, title: '校区端午节放假通知', content: '各位学员，6月8日至6月10日为端午节法定假期，学校将暂停线下课程，线上资源可正常访问。', time: '2小时前', type: 'system', read: true },
    { id: 4, title: '课时余额预警', content: '您的课时余额不足10H，为了不影响您的上课进度，建议尽快充值续费。', time: '昨天', type: 'finance', read: true },
];

export const StudentNotifications: React.FC = () => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'urgent': return <Megaphone className="text-rose-500" size={20} />;
            case 'homework': return <MessageCircle className="text-blue-500" size={20} />;
            case 'finance': return <Mail className="text-amber-500" size={20} />;
            default: return <Bell className="text-slate-400" size={20} />;
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>学员中心</span>
                        <ChevronRight size={14} />
                        <span className="text-slate-600">通知中心</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">消息与公告</h1>
                </div>
                <button className="text-sm font-bold text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all">
                    全部标记为已读
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {['全部消息', '系统通知', '作业提醒', '校区公告'].map((tab, i) => (
                    <button key={i} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                {MOCK_NOTIFICATIONS.map((n) => (
                    <div key={n.id} className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-start gap-8 relative ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            {getIcon(n.type)}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className={`text-base font-bold tracking-tight ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {n.title}
                                    {!n.read && <span className="ml-3 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock size={12} /> {n.time}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                {n.content}
                            </p>
                            <div className="flex items-center gap-6 pt-2">
                                <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">立即前往查看</button>
                                <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">删除消息</button>
                            </div>
                        </div>
                        <button className="p-2 text-slate-200 hover:text-slate-900 absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-10 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                    <h5 className="font-bold text-slate-900">您已读完所有重要通知</h5>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">保持信息通畅，可以更好地安排学习计划。</p>
                </div>
            </div>
        </div>
    );
};
