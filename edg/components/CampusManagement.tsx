/**
 * CampusManagement.tsx
 * ---------------------------------------------------------------
 * 校区管理列表页（总部管理员）。
 * 汇总展示真实校区（来自 store）+ 演示校区（mock），支持搜索、分页、查看详情、进入审批。
 * 使用位置：总部后台「校区管理」主菜单。
 * ---------------------------------------------------------------
 */
import React, { useState, useMemo } from 'react';
import { Search, MapPin, ChevronLeft, ChevronRight, MoreHorizontal, SlidersHorizontal, ChevronDown, UserCheck } from 'lucide-react';
import { ElmIcon } from './ElmIcon';
import { CampusAudit } from './CampusAudit';
import { CampusDetail } from './CampusDetail';
import { useStore } from '../store';

interface Campus {
    id: string;
    name: string;
    region: string;
    level: string;
    manager: string;
    students: number;
    classes: number;
    monthlyRevenue: number;
    status: '正常运营' | '维护中' | '已停业';
    icon?: string;
}

// 真实校区的补充字段（负责人/地区/级别）
const campusMeta: Record<string, { region: string; level: string; manager: string }> = {
    CAMPUS_PUDONG: { region: '华东地区', level: '旗舰校区', manager: '赵校长' },
    CAMPUS_XUHUI: { region: '华东地区', level: '标准校区', manager: '周主任' },
};

// 展示用 mock 校区（排在真实校区后面）
const mockCampusData: Campus[] = [
    { id: 'mock-1', name: '北京朝阳双井校区', region: '华北地区', level: '旗舰校区', manager: '李思思', students: 86, classes: 5, monthlyRevenue: 31200, status: '正常运营' },
    { id: 'mock-2', name: '深圳南山科技园校区', region: '华南地区', level: '旗舰校区', manager: '王健', students: 72, classes: 4, monthlyRevenue: 28800, status: '正常运营' },
    { id: 'mock-3', name: '杭州西湖文三校区', region: '华东地区', level: '社区中心', manager: '陈晓东', students: 45, classes: 3, monthlyRevenue: 12800, status: '正常运营' },
    { id: 'mock-4', name: '广州天河中怡校区', region: '华南地区', level: '标准校区', manager: '周小芳', students: 58, classes: 4, monthlyRevenue: 22400, status: '正常运营' },
    { id: 'mock-5', name: '成都高新天府校区', region: '西南地区', level: '标准校区', manager: '刘明', students: 39, classes: 3, monthlyRevenue: 15600, status: '正常运营' },
    { id: 'mock-6', name: '武汉光谷软件园校区', region: '华中地区', level: '标准校区', manager: '陈佳', students: 42, classes: 3, monthlyRevenue: 16800, status: '维护中' },
    { id: 'mock-7', name: '南京河西新城校区', region: '华东地区', level: '旗舰校区', manager: '赵磊', students: 61, classes: 4, monthlyRevenue: 24400, status: '正常运营' },
    { id: 'mock-8', name: '西安曲江新区校区', region: '西北地区', level: '社区中心', manager: '王霞', students: 28, classes: 2, monthlyRevenue: 8900, status: '正常运营' },
    { id: 'mock-9', name: '重庆渝北区校区', region: '西南地区', level: '标准校区', manager: '黄伟', students: 35, classes: 3, monthlyRevenue: 14000, status: '正常运营' },
    { id: 'mock-10', name: '长沙岳麓区校区', region: '华中地区', level: '社区中心', manager: '谢芳', students: 31, classes: 2, monthlyRevenue: 9600, status: '正常运营' },
];

const PAGE_SIZE = 5;

// StatusBadge —— 根据校区运营状态渲染不同颜色的小徽标
const StatusBadge: React.FC<{ status: Campus['status'] }> = ({ status }) => {
    const map: Record<Campus['status'], { cls: string; label: string }> = {
        '正常运营': { cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: '正常运营' },
        '维护中': { cls: 'bg-amber-50 text-amber-500 border border-amber-100', label: '维护中' },
        '已停业': { cls: 'bg-slate-100 text-slate-500 border border-slate-200', label: '已停业' },
    };
    const { cls, label } = map[status];
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === '正常运营' ? 'bg-emerald-500' : status === '维护中' ? 'bg-amber-400' : 'bg-slate-400'}`} />
            {label}
        </span>
    );
};

/**
 * CampusManagement —— 校区管理主组件
 * 关键状态：selectedCampus 进入详情、showAudit 进入审批中心、
 *           searchTerm / currentPage / filterRegion / filterStatus 用于列表筛选与分页
 */
export const CampusManagement: React.FC = () => {
    const { students, classes: storeClasses, orders, campuses, fetchCampuses, fetchStudents, fetchOrders } = useStore();

    React.useEffect(() => {
        fetchCampuses();
        fetchStudents();
        fetchOrders();
    }, []);

    const [showAudit, setShowAudit] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState('全部地区');
    const [currentPage, setCurrentPage] = useState(1);

    const regions = useMemo(() => {
        const set = new Set(['全部地区']);
        mockCampusData.forEach(c => set.add(c.region));
        Object.values(campusMeta).forEach(m => set.add(m.region));
        return Array.from(set);
    }, []);

    // 基于真实数据构建校区列表 + 追加 mock 展示校区
    const enrichedCampusData = useMemo(() => {
        const now = new Date();
        const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 真实校区（从后端拉取）
        const realCampuses: Campus[] = (campuses || []).map((c: any) => {
            const cid = c.id;
            const campusStudents = (students || []).filter(s => (s.campus_id === cid || s.campus === cid) && s.status !== 'inactive');
            const campusClasses = (storeClasses || []).filter((cl: any) => cl.campus_id === cid);
            const campusOrders = (orders || []).filter((o: any) => {
                const oCampus = o.course?.campus_id || o.campusId || o.campus_id;
                return oCampus === cid && o.status === 'PAID' && (o.createdAt || '').startsWith(currentYM);
            });
            const monthlyRev = campusOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

            const meta = campusMeta[cid] || {};
            return {
                id: cid,
                name: c.name,
                region: meta.region || '华东地区',
                level: meta.level || '标准校区',
                manager: meta.manager || '—',
                students: campusStudents.length,
                classes: campusClasses.length,
                monthlyRevenue: monthlyRev,
                status: '正常运营' as Campus['status'],
            };
        });

        // 真实校区排前面，mock 校区接后面
        return [...realCampuses, ...mockCampusData];
    }, [students, storeClasses, orders, campuses]);

    const filtered = useMemo(() => {
        return enrichedCampusData.filter(c => {
            const matchSearch = !searchTerm || c.name.includes(searchTerm) || c.manager.includes(searchTerm) || c.region.includes(searchTerm);
            const matchRegion = regionFilter === '全部地区' || c.region === regionFilter;
            return matchSearch && matchRegion;
        });
    }, [searchTerm, regionFilter, enrichedCampusData]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Stats
    const totalStudents = enrichedCampusData.reduce((s, c) => s + c.students, 0);
    const totalClasses = enrichedCampusData.reduce((s, c) => s + c.classes, 0);
    const totalRevenue = enrichedCampusData.reduce((s, c) => s + c.monthlyRevenue, 0);

    const stats = [
        { label: '校区总数', value: enrichedCampusData.length.toString(), sub: '', subColor: 'text-slate-400', subBg: 'bg-slate-50' },
        { label: '在读总人数', value: totalStudents.toLocaleString(), sub: '', subColor: 'text-slate-400', subBg: 'bg-slate-50' },
        { label: '总班级数', value: totalClasses.toString(), sub: '', subColor: 'text-slate-400', subBg: 'bg-slate-50' },
        { label: '本月总营收', value: totalRevenue > 0 ? `¥${(totalRevenue / 10000).toFixed(1)}万` : '¥0', sub: '', subColor: 'text-slate-400', subBg: 'bg-slate-50' },
    ];

    const handlePageClick = (p: number) => {
        if (p >= 1 && p <= totalPages) setCurrentPage(p);
    };

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3);
            if (currentPage > 4) pages.push('...');
            if (currentPage > 3 && currentPage < totalPages - 1) pages.push(currentPage);
            pages.push('...');
            pages.push(totalPages);
        }
        return [...new Set(pages)];
    };

    // Show detail — after all hooks
    if (selectedCampus) {
        return <CampusDetail campus={selectedCampus} onBack={() => setSelectedCampus(null)} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {showAudit && <CampusAudit onBack={() => setShowAudit(false)} />}
            {!showAudit && (<>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">校区概况管理</h1>
                    <button
                        onClick={() => setShowAudit(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-100">
                        <UserCheck size={16} />
                        校区审核
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <p className="text-xs text-slate-500 font-medium mb-2">{s.label}</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-slate-900">{s.value}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-0.5 ${s.subColor} ${s.subBg}`}>{s.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <ElmIcon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="搜索校区名称、负责人..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-slate-700 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={regionFilter}
                                onChange={e => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-9 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-semibold text-slate-700 appearance-none cursor-pointer min-w-[140px]"
                            >
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ElmIcon name="arrow-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-xs font-semibold text-slate-500 px-6 py-3.5">校区名称</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">负责人</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">学生人数</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">班级数量</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5">本月营收</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3.5">状态</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 px-6 py-3.5">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pageData.map(campus => (
                                    <tr key={campus.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${campus.status === '维护中' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {campus.icon ? <ElmIcon name={campus.icon} size={16} /> : <ElmIcon name="location" size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{campus.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{campus.region} | {campus.level}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700 font-medium">{campus.manager}</td>
                                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">{campus.students.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">{campus.classes}</td>
                                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-800">¥{campus.monthlyRevenue.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <StatusBadge status={campus.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedCampus(campus)}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline transition-colors">
                                                查看详情
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                        <span className="text-sm text-slate-500">
                            显示 {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} 到 {Math.min(currentPage * PAGE_SIZE, filtered.length)} 共 {filtered.length} 条校区记录
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageClick(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ElmIcon name="arrow-left" size={16} />
                            </button>
                            {getPageNumbers().map((p, idx) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400">
                                        <ElmIcon name="more-filled" size={16} />
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => handlePageClick(p as number)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => handlePageClick(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ElmIcon name="arrow-right" size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </>)}
        </div>
    );
};
