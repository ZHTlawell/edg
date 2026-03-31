import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, LogIn, ExternalLink, Download, FileText } from 'lucide-react';

export const AuditLogs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const logs = [
        { id: '1', time: '2024-03-20 14:32:01', user: '王主管', role: '总部管理员', action: '登录系统', ip: '192.168.1.101', status: '成功', type: 'security' },
        { id: '2', time: '2024-03-20 14:45:12', user: '李建国', role: '全职教师', action: '新建班级 (高级UI设计3期)', ip: '114.215.111.23', status: '成功', type: 'business' },
        { id: '3', time: '2024-03-20 15:02:44', user: '张会计', role: '财务出纳', action: '审批通过退费单 (RF-2024001)', ip: '210.12.33.42', status: '成功', type: 'business' },
        { id: '4', time: '2024-03-20 15:58:10', user: '未知用户', role: '-', action: '尝试非授权访问 /api/v1/salary', ip: '8.8.8.8', status: '拦截', type: 'security' },
        { id: '5', time: '2024-03-20 16:30:05', user: '系统服务', role: 'SYSTEM', action: '自动生成学员报表 (月度)', ip: '127.0.0.1', status: '成功', type: 'system' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">系统审计日志</h1>
                    <p className="text-sm text-slate-500 mt-1">记录平台关键操作及安全事件，默认保存180天。</p>
                </div>
                <button className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm self-start md:self-auto">
                    <ElmIcon name="download" size={16} />
                    <span>导出当前日志</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 flex gap-3 w-full">
                    <div className="relative flex-1 max-w-sm">
                        <ElmIcon name="search" size={16} />
                        <input
                            type="text"
                            placeholder="搜索操作员、IP或事件描述..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm text-slate-700 hidden sm:block">
                        <option value="all">所有日志类型</option>
                        <option value="security">安全类事件</option>
                        <option value="business">业务操作记录</option>
                        <option value="system">系统维护</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-colors font-bold text-sm">
                        <ElmIcon name="operation" size={16} />
                        高级筛选
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="py-4 pl-6 pr-4 font-bold">时间戳</th>
                                <th className="px-4 py-4 font-bold">操作源 / 角色</th>
                                <th className="px-4 py-4 font-bold">事件概要</th>
                                <th className="px-4 py-4 font-bold">终端 IP</th>
                                <th className="px-4 py-4 font-bold">状态</th>
                                <th className="px-4 py-4 font-bold text-right pr-6">追踪</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-sm group">
                                    <td className="py-4 pl-6 pr-4 font-mono text-slate-500">
                                        {log.time}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            {log.type === 'security' && <ShieldAlert size={14} className="text-red-500" />}
                                            {log.type === 'business' && <ElmIcon name="document" size={16} />}
                                            {log.type === 'system' && <LogIn size={14} className="text-slate-500" />}
                                            <span className="font-bold text-slate-800">{log.user}</span>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{log.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-slate-700 max-w-xs truncate" title={log.action}>
                                        {log.action}
                                    </td>
                                    <td className="px-4 py-4 font-mono text-slate-500 text-xs">
                                        {log.ip}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${log.status === '成功' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {log.status === '成功' ? '正常' : '异常'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right pr-6">
                                        <button className="text-slate-400 hover:text-blue-600 flex items-center justify-end gap-1 text-xs font-bold transition-colors ml-auto group-hover:underline">
                                            <span>详戳</span>
                                            <ExternalLink size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/50">
                    <span>共检索到 <strong className="text-slate-800 text-sm">45,102</strong> 条日志关联记录</span>
                    {/* Pagination mockup */}
                    <div className="flex gap-1.5 items-center">
                        <button className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50">上页</button>
                        <span className="px-3 font-mono text-slate-700 text-sm">1 / 4511</span>
                        <button className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50">下页</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
