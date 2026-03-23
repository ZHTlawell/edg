import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import { Shield, Key, AlertCircle, Save, CheckCircle2, Copy } from 'lucide-react';

export const RolePermission: React.FC = () => {
    const [activeRole, setActiveRole] = useState('总部管理员');

    const roles = ['总部管理员', '校区长', '前台教务', '课程顾问', '专职教师', '财务出纳'];

    const permissionModules = [
        { title: '学员档案管理', desc: '新增、修改、查看名下或全局学员数据', items: [{ name: '新增学员录入', checked: true }, { name: '历史档案变更', checked: true }, { name: '批量联系人导出', checked: false }] },
        { title: '财务与订单管控', desc: '控制课时消耗审批与学费代收', items: [{ name: '新增收费单据', checked: true }, { name: '办理全额退费', checked: false }, { name: '销课凭证审批', checked: true }] },
        { title: '排课与班级调度', desc: '调整教务运载数据及课表发布', items: [{ name: '建立新教学班', checked: true }, { name: '强制换课干预', checked: false }, { name: '课表生成权', checked: true }] },
        { title: '系统设置与审计', desc: '超管专用：员工管理与参数设置', items: [{ name: '新增系统账号', checked: false }, { name: '岗位角色编辑', checked: false }, { name: '核心日志查阅', checked: false }] }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">权限配置</h1>
                    <p className="text-sm text-slate-500 mt-1">精细化管理系统各角色模块读写权限</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Roles List */}
                <div className="w-full lg:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 h-fit flex-shrink-0">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2 flex items-center gap-2">
                        <Shield size={16} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm">系统角色</h3>
                    </div>
                    <div className="space-y-1">
                        {roles.map(role => (
                            <button
                                key={role}
                                onClick={() => setActiveRole(role)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between group ${activeRole === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span>{role}</span>
                                {activeRole === role && <ChevronRightIcon className="text-blue-200" />}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 px-2">
                        <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors font-bold text-sm flex items-center justify-center gap-2">
                            <PlusIcon /> 新增自定义角色
                        </button>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Key size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{activeRole} 权限清单</h2>
                                <p className="text-xs text-slate-500 font-medium">包含 12 项业务管控节点配置，部分受保护功能需超管确权。</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                                <Copy size={16} /> 复制模板
                            </button>
                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-md">
                                <Save size={16} /> 保存配置
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                        {permissionModules.map((module, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-xl p-5 hover:border-blue-100 transition-colors group">
                                <div className="mb-4">
                                    <h4 className="font-bold text-slate-800 tracking-tight flex justify-between items-center text-[15px]">
                                        {module.title}
                                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 bg-slate-50 border-slate-300 cursor-pointer" />
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-1">{module.desc}</p>
                                </div>
                                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-colors">
                                    {module.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                {item.checked ? <ElmIcon name="circle-check" size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                                {item.name}
                                            </span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Warning banner */}
                    <div className="mt-auto px-6 py-4 bg-orange-50 border-t border-orange-100 flex items-start gap-3">
                        <ElmIcon name="warning" size={16} />
                        <div className="text-sm">
                            <p className="text-orange-800 font-bold">权限变动警示</p>
                            <p className="text-orange-600 text-xs mt-1 leading-relaxed">修改【财务与订单管控】或【系统设置与审计】关联卡片，将影响该角色下所有现存账号的安全及业务可用性，保存后需用户重新登录才可生效该修改。</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* SVGs embedded for icons that weren't imported directly to save import lists */}
        </div>
    );
};
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6" /></svg>
)
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
)
