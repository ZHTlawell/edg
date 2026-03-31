
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
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
import { useStore } from '../store';

type NotificationType = 'all' | 'system' | 'homework' | 'campus';

const MOCK_NOTIFICATIONS = [
    { id: 1, title: '【调课通知】高级UI/UX设计实战', content: '尊敬的学员，由于原教室电路检修，原定于明天14:00的课程将调整至 A305 教室举行，请知悉。', time: '10分钟前', type: 'system' as const, read: false },
    { id: 2, title: '作业批改提醒', content: '您提交的《App 复杂列表系统设计》作业李建国老师已完成批改，快去查看评价吧！', time: '1小时前', type: 'homework' as const, read: false },
    { id: 3, title: '校区端午节放假通知', content: '各位学员，6月8日至6月10日为端午节法定假期，学校将暂停线下课程，线上资源可正常访问。', time: '2小时前', type: 'campus' as const, read: true },
    { id: 4, title: '课时余额预警', content: '您的课时余额不足10H，为了不影响您的上课进度，建议尽快充值续费。', time: '昨天', type: 'system' as const, read: true },
    { id: 5, title: '新作业发布通知', content: '《UI设计色彩搭配原理》新作业已发布，截止日期为下周三，请及时完成提交。', time: '2天前', type: 'homework' as const, read: true },
    { id: 6, title: '校区五一课程安排', content: '五一假期期间部分课程时间有调整，请查看最新课表。如有疑问请联系班主任。', time: '3天前', type: 'campus' as const, read: true },
];

const TAB_MAP: { label: string; value: NotificationType }[] = [
    { label: '全部消息', value: 'all' },
    { label: '系统通知', value: 'system' },
    { label: '作业提醒', value: 'homework' },
    { label: '校区公告', value: 'campus' },
];

export const StudentNotifications: React.FC = () => {
    const { addToast, announcements, fetchAnnouncementsActive } = useStore();
    const [activeTab, setActiveTab] = useState<NotificationType>('all');
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    useEffect(() => {
        fetchAnnouncementsActive();
    }, []);

    // Merge real announcements into notifications as 'campus' type
    const mergedNotifications = React.useMemo(() => {
        const announcementItems = (announcements || []).map((a: any, i: number) => ({
            id: 1000 + i,
            title: a.title,
            content: a.content || a.summary || '',
            time: a.createdAt ? new Date(a.createdAt).toLocaleDateString('zh-CN') : '最近',
            type: 'campus' as const,
            read: false,
        }));
        // Deduplicate by title
        const existingTitles = new Set(notifications.map(n => n.title));
        const newAnns = announcementItems.filter(a => !existingTitles.has(a.title));
        return [...notifications, ...newAnns];
    }, [notifications, announcements]);

    const filteredNotifications = React.useMemo(() => {
        if (activeTab === 'all') return mergedNotifications;
        return mergedNotifications.filter(n => n.type === activeTab);
    }, [mergedNotifications, activeTab]);

    const unreadCount = mergedNotifications.filter(n => !n.read).length;

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        addToast('已将所有消息标记为已读', 'success');
    };

    const handleDelete = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        addToast('消息已删除', 'success');
    };

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleView = (n: typeof MOCK_NOTIFICATIONS[0]) => {
        // Mark as read and toggle expand
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setExpandedId(prev => prev === n.id ? null : n.id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'system': return <ElmIcon name="notification" size={16} />;
            case 'homework': return <ElmIcon name="chat-round" size={16} />;
            case 'campus': return <Megaphone className="text-blue-500" size={20} />;
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
                        <ElmIcon name="arrow-right" size={16} />
                        <span className="text-slate-600">通知中心</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">消息与公告</h1>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    className="text-sm font-bold text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all"
                >
                    全部标记为已读
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {TAB_MAP.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-bold">暂无{TAB_MAP.find(t => t.value === activeTab)?.label || '消息'}</p>
                    </div>
                ) : filteredNotifications.map((n) => (
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
                                    <ElmIcon name="clock" size={16} /> {n.time}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                {n.content}
                            </p>
                            {expandedId === n.id && (
                                <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="font-bold text-slate-700 mb-2">通知详情</p>
                                    <p>{n.content}</p>
                                    <p className="mt-2 text-xs text-slate-400">发送时间：{n.time} · 类型：{n.type === 'system' ? '系统通知' : n.type === 'homework' ? '作业提醒' : '校区公告'}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-6 pt-2">
                                <button
                                    onClick={() => handleView(n)}
                                    className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                                >{expandedId === n.id ? '收起详情' : '查看详情'}</button>
                                <button
                                    onClick={() => handleDelete(n.id)}
                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                                >删除消息</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {unreadCount === 0 && (
                <div className="p-10 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                        <ElmIcon name="circle-check" size={16} />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-slate-900">您已读完所有重要通知</h5>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">保持信息通畅，可以更好地安排学习计划。</p>
                    </div>
                </div>
            )}
        </div>
    );
};
