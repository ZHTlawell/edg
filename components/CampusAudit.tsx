
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Filter, ExternalLink, RefreshCw, Clock, UserCheck, CheckCircle, XCircle, Loader2, Building2, User, Phone } from 'lucide-react';
import { CampusAuditDetail } from './CampusAuditDetail';
import { useStore } from '../store';

interface AuditRecord {
    id: string;
    reqNo: string;
    campusName: string;
    type: '注册申请' | '新校入驻' | '信息变更' | '注销申请';
    submitter: string;
    submitTime: string;
    status: '待审批' | '已驳回' | '已通过';
}

const auditData: AuditRecord[] = [
    { id: '1', reqNo: 'REQ-20240315-001', campusName: '上海浦东新区金桥中心', type: '新校入驻', submitter: '赵成刚', submitTime: '2024-03-15 10:24', status: '待审批' },
    { id: '2', reqNo: 'REQ-20240314-012', campusName: '广州天河中怡校区', type: '信息变更', submitter: '周小芳', submitTime: '2024-03-14 16:45', status: '待审批' },
    { id: '3', reqNo: 'REQ-20240314-005', campusName: '北京朝阳双井校区', type: '新校入驻', submitter: '李思思', submitTime: '2024-03-14 11:30', status: '已驳回' },
    { id: '4', reqNo: 'REQ-20240313-022', campusName: '成都锦江太古里中心', type: '注销申请', submitter: '王海龙', submitTime: '2024-03-13 09:12', status: '待审批' },
    { id: '5', reqNo: 'REQ-20240312-088', campusName: '杭州西湖文三校区', type: '信息变更', submitter: '陈晓东', submitTime: '2024-03-12 14:05', status: '待审批' },
    { id: '6', reqNo: 'REQ-20240311-033', campusName: '武汉光谷软件园校区', type: '新校入驻', submitter: '黄伟', submitTime: '2024-03-11 15:20', status: '已通过' },
    { id: '7', reqNo: 'REQ-20240310-019', campusName: '南京河西新城校区', type: '信息变更', submitter: '赵磊', submitTime: '2024-03-10 10:05', status: '已통과' as any },
    { id: '8', reqNo: 'REQ-20240309-007', campusName: '西安曲江新区校区', type: '注销申请', submitter: '王霞', submitTime: '2024-03-09 09:30', status: '待审批' },
];

const TYPE_STYLE: Record<AuditRecord['type'], string> = {
    '注册申请': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    '新校入驻': 'bg-blue-50 text-blue-600 border border-blue-100',
    '信息变更': 'bg-purple-50 text-purple-600 border border-purple-100',
    '注销申请': 'bg-red-50 text-red-500 border border-red-100',
};

const STATUS_STYLE: Record<AuditRecord['status'], string> = {
    '待审批': 'bg-amber-50 text-amber-600 border border-amber-200',
    '已驳回': 'bg-red-50 text-red-500 border border-red-100',
    '已通过': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
};

const PAGE_SIZE = 5;

interface CampusAuditProps {
    onBack: () => void;
}

export const CampusAudit: React.FC<CampusAuditProps> = ({ onBack }) => {
    const { fetchPendingUsers, approveUser, rejectUser } = useStore();

    // ------- Registration Review State -------
    const [regList, setRegList] = useState<any[]>([]);
    const [regLoading, setRegLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadRegList = useCallback(async () => {
        setRegLoading(true);
        const data = await fetchPendingUsers('campus-admins');
        setRegList(data);
        setRegLoading(false);
    }, [fetchPendingUsers]);

    useEffect(() => { loadRegList(); }, [loadRegList]);

    const handleApprove = async (id: string) => {
        setActionLoading(id + '-approve');
        try { await approveUser(id); setRegList(prev => prev.filter(u => u.id !== id)); } catch { }
        setActionLoading(null);
    };
    const handleReject = async (id: string) => {
        setActionLoading(id + '-reject');
        try { await rejectUser(id); setRegList(prev => prev.filter(u => u.id !== id)); } catch { }
        setActionLoading(null);
    };

    // ------- Operations Audit State -------
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('全部状态');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

    // Combine registration list with business audit records
    const unifiedListData = useMemo(() => {
        const mappedReg: AuditRecord[] = regList.map(user => ({
            id: user.id,
            reqNo: `REG-${user.id.slice(0, 8)}`,
            campusName: user.campusName || '未填写机构名称',
            type: '注册申请' as any,
            submitter: user.username,
            submitTime: new Date(user.createdAt).toLocaleString('zh-CN'),
            status: '待审批'
        }));

        return [...mappedReg, ...auditData];
    }, [regList]);

    const filtered = useMemo(() => {
        return unifiedListData.filter(r => {
            const matchSearch = !search || r.campusName.includes(search) || r.reqNo.includes(search);
            const matchStatus = statusFilter === '全部状态' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [unifiedListData, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePage = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

    if (selectedRecord) {
        return <CampusAuditDetail record={selectedRecord} onBack={() => setSelectedRecord(null)} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">校区审核</h1>
                    {regList.length > 0 && (
                        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full">
                            <Clock size={12} />
                            注册待审核：{regList.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Campus search */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">搜索</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="输入校区名称、单号..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    </div>


                    {/* Date range */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">申请时间</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 min-w-0"
                            />
                            <span className="text-slate-400 text-sm shrink-0">至</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 min-w-0"
                            />
                        </div>
                    </div>

                    {/* Status filter + button */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">审核状态</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 cursor-pointer"
                            >
                                <option>全部状态</option>
                                <option>待审批</option>
                                <option>已通过</option>
                                <option>已驳回</option>
                            </select>
                            <button
                                onClick={loadRegList}
                                disabled={regLoading}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-100 shrink-0">
                                <RefreshCw size={14} className={regLoading ? 'animate-spin' : ''} />
                                刷新
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="text-left text-xs font-semibold text-slate-500 px-6 py-3.5">申请单号</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">校区名称</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">类型</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">提交人</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">提交时间</th>
                                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3.5">当前状态</th>
                                <th className="text-right text-xs font-semibold text-slate-500 px-6 py-3.5">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {pageData.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{record.reqNo}</td>
                                    <td className="px-4 py-4">
                                        <span className="font-bold text-slate-800 text-sm">{record.campusName}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.type === '注册申请' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : (TYPE_STYLE[record.type as any] || '')}`}>
                                            {record.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700 font-medium">{record.submitter}</td>
                                    <td className="px-4 py-4 text-sm text-slate-500">{record.submitTime}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[record.status] || STATUS_STYLE['已通过']}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${record.status === '待审批' ? 'bg-amber-400' : record.status === '已驳回' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-semibold transition-colors">
                                                <ExternalLink size={12} />
                                                查看详情
                                            </button>
                                            {record.type === '注册申请' && record.status === '待审批' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReject(record.id); }}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
                                                    >
                                                        {actionLoading === record.id + '-reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                        拒绝
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(record.id); }}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50"
                                                    >
                                                        {actionLoading === record.id + '-approve' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                        通过
                                                    </button>
                                                </div>
                                            )}
                                            {record.type !== '注册申请' && record.status === '待审批' && (
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold underline underline-offset-2 transition-colors">
                                                    立即处理
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pageData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                                        暂无符合条件的审核记录
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">
                        显示 {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} 到 {Math.min(currentPage * PAGE_SIZE, filtered.length)} 共 {filtered.length} 条待处理审核记录
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => handlePage(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
