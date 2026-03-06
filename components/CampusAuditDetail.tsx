
import React, { useState } from 'react';
import { ArrowLeft, Info, ShieldCheck, FileText, Eye, Phone, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AuditRecord {
    id: string;
    reqNo: string;
    campusName: string;
    type: '注册申请' | '新校入驻' | '信息变更' | '注销申请';
    submitter: string;
    submitTime: string;
    status: '待审批' | '已驳回' | '已通过';
}

interface CampusAuditDetailProps {
    record: AuditRecord;
    onBack: () => void;
}

export const CampusAuditDetail: React.FC<CampusAuditDetailProps> = ({ record, onBack }) => {
    const [remark, setRemark] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleApprove = () => {
        setSubmitted(true);
        alert('✅ 已通过审核！');
    };
    const handleReject = () => {
        if (!remark.trim()) {
            alert('驳回时请务必填写审核备注原因！');
            return;
        }
        setSubmitted(true);
        alert('❌ 已取消申请（驳回）');
    };

    // Simulated data based on record
    const info = {
        campusName: record.campusName,
        manager: '周小芳',
        phone: '13911112222',
        address: '上海市浦东新区张杨路3611弄金桥国际商业广场6座5楼全层',
    };

    const TYPE_COLOR: Record<string, string> = {
        '注册申请': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        '新校入驻': 'bg-blue-50 text-blue-600 border border-blue-100',
        '信息变更': 'bg-purple-50 text-purple-600 border border-purple-100',
        '注销申请': 'bg-red-50 text-red-500 border border-red-100',
    };

    return (
        <div className="flex flex-col min-h-full animate-in fade-in duration-300">
            {/* Content area with bottom padding for fixed bar */}
            <div className="flex-1 space-y-5 pb-24">
                {/* Header */}
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors mb-3 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        返回审核列表
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{record.campusName}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                        <span>申请单号：<span className="font-mono text-slate-700">{record.reqNo}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>申请类型：
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ml-1 ${TYPE_COLOR[record.type]}`}>
                                {record.type}
                            </span>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>提交时间：{record.submitTime}</span>
                    </div>
                </div>

                {/* Section 1: Basic Info */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <Info size={11} className="text-blue-600" />
                        </div>
                        <h2 className="font-bold text-slate-800 text-sm">最新基础资料</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-400 font-medium">校区名称</p>
                            <p className="text-sm font-bold text-slate-800">{info.campusName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-400 font-medium">负责人联系方式</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <span>{info.manager}</span>
                                <span className="text-slate-300">|</span>
                                <Phone size={13} className="text-slate-400" />
                                <span>{info.phone}</span>
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <p className="text-xs text-slate-400 font-medium">详细地址</p>
                            <div className="flex items-start gap-1.5">
                                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-sm font-bold text-slate-800">{info.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Qualification Files */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <ShieldCheck size={11} className="text-emerald-600" />
                        </div>
                        <h2 className="font-bold text-slate-800 text-sm">最新资质文件</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* License image */}
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-semibold">办学许可证</p>
                            <div className="relative w-full aspect-[4/3] max-w-xs bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                                <div className="relative z-10 flex flex-col items-center gap-2 text-slate-500">
                                    <div className="w-16 h-16 rounded-full border-2 border-slate-600 flex items-center justify-center">
                                        <ShieldCheck size={32} className="text-slate-500" />
                                    </div>
                                    <p className="text-xs">许可证图片</p>
                                </div>
                                <button className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg transition-all font-medium border border-white/10">
                                    <Eye size={12} />
                                    预览
                                </button>
                            </div>
                        </div>

                        {/* Lease contract */}
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-semibold">场地租赁合同</p>
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText size={18} className="text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">新租赁合同_2024-2027.pdf</p>
                                    <p className="text-xs text-slate-400 mt-0.5">2.4 MB · 2024-03-14 提交</p>
                                </div>
                                <button className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                                    <Eye size={12} />
                                    预览
                                </button>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-slate-400">
                                <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                                <span>请点击预览确认合同截止日期与办公地点一致</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
                    {/* Remark input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="请输入审核备注（若驳回请务必填写原因）"
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                    {/* Reject button */}
                    <button
                        onClick={handleReject}
                        disabled={submitted}
                        className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <XCircle size={16} />
                        取消申请
                    </button>
                    {/* Approve button */}
                    <button
                        onClick={handleApprove}
                        disabled={submitted}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <CheckCircle size={16} />
                        通过审核
                    </button>
                </div>
            </div>
        </div>
    );
};
