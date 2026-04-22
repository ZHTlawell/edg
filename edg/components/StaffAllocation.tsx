/**
 * StaffAllocation.tsx - 人员分配/档案页
 *
 * 所在模块：
 *   - 总部管理员：跨校区人员分配
 *   - 校区管理员：本校人员档案
 * 功能：按校区/姓名/手机号筛选员工列表，展示岗位、校区、状态
 * 备注：当前使用静态示例数据，仅为原型
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Filter, UserCog, MoreVertical, Edit2, ShieldAlert } from 'lucide-react';
import { useStore } from '../store';

/**
 * StaffAllocation 组件（无 props）
 * - 校区管理员仅看本校人员；总部管理员看全部
 * - 本地 allStaff 静态数据源，实际后续应替换为 API
 */
export const StaffAllocation: React.FC = () => {
    const { currentUser } = useStore();
    const isCampusAdmin = currentUser?.role === 'campus_admin';
    const myCampus = currentUser?.campus || '总校区';

    const [searchTerm, setSearchTerm] = useState('');

    const allStaff = [
        { id: '1', name: '王主管', role: '校区总监', campus: '总部旗舰校', phone: '138****0001', status: '在职' },
        { id: '2', name: '李建国', role: '全职教师', campus: '浦东分校', phone: '139****0002', status: '在职' },
        { id: '3', name: '张会计', role: '财务专员', campus: '总部旗舰校', phone: '137****0003', status: '在职' },
        { id: '4', name: '赵辅导', role: '教务辅导', campus: '静安校区', phone: '185****0004', status: '离职' },
        { id: '5', name: '林教师', role: '教研组长', campus: '总部旗舰校', phone: '186****0005', status: '在职' },
        { id: '6', name: '谢老师', role: '全职教师', campus: '浦东分校', phone: '187****0006', status: '在职' },
        { id: '7', name: '陈班导', role: '资深班主任', campus: '总部旗舰校', phone: '135****8888', status: '在职' },
        { id: '8', name: '刘行政', role: '行政前台', campus: '总部旗舰校', phone: '131****6666', status: '在职' },
        { id: '9', name: '周助教', role: '学术助教', campus: '总部旗舰校', phone: '159****2222', status: '在职' },
    ];

    const staffList = useMemo(() => {
        let list = allStaff;
        if (isCampusAdmin) {
            list = list.filter(s => s.campus === myCampus);
        }
        if (searchTerm) {
            list = list.filter(s =>
                s.name.includes(searchTerm) ||
                s.role.includes(searchTerm) ||
                s.phone.includes(searchTerm)
            );
        }
        return list;
    }, [isCampusAdmin, myCampus, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isCampusAdmin ? '本校人员档案' : '校区人员分配'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isCampusAdmin
                            ? `管理 ${myCampus} 的全体教职员工信息与权限`
                            : '跨校区调拨教职员工及入职离职管理'}
                    </p>
                </div>
                <button className={`flex items-center gap-2 ${isCampusAdmin ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg self-start md:self-auto`}>
                    <ElmIcon name="plus" size={16} />
                    <span>添加员工</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full max-w-md">
                    <ElmIcon name="search" size={16} />
                    <input
                        type="text"
                        placeholder="搜索姓名、手机号或岗位..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-colors font-medium">
                        <ElmIcon name="operation" size={16} />
                        <span>筛选部门</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
                                <th className="py-4 pl-6 pr-4 font-bold text-slate-600 whitespace-nowrap">员工姓名</th>
                                <th className="px-4 py-4 font-bold text-slate-600">所属岗位</th>
                                {!isCampusAdmin && <th className="px-4 py-4 font-bold text-slate-600">归属校区</th>}
                                <th className="px-4 py-4 font-bold text-slate-600">联系方式</th>
                                <th className="px-4 py-4 font-bold text-slate-600">在职状态</th>
                                <th className="px-4 py-4 font-bold text-slate-600 text-right pr-6">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {staffList.map(staff => (
                                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-3 pl-6 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${isCampusAdmin ? 'bg-cyan-100 text-cyan-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-xs font-bold ring-2 ring-white`}>
                                                {staff.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-800">{staff.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                            <UserCog size={14} className="text-slate-400" />
                                            {staff.role}
                                        </div>
                                    </td>
                                    {!isCampusAdmin && (
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-bold text-slate-700">{staff.campus}</span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-mono text-slate-500">{staff.phone}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${staff.status === '在职' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${staff.status === '在职' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className={`p-1.5 text-slate-400 ${isCampusAdmin ? 'hover:text-cyan-600 hover:bg-cyan-50' : 'hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`} title="编辑信息"><Edit2 size={16} /></button>
                                            <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="权限调整"><ShieldAlert size={16} /></button>
                                            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty state / Pagination Area */}
                <div className="border-t border-slate-100 p-4 flex items-center justify-between text-sm text-slate-500">
                    <span>共 <strong className="text-slate-800">{staffList.length}</strong> 名员工记录</span>
                    {/* Pagination mockup */}
                    <div className="flex gap-1">
                        <button className={`w-8 h-8 flex items-center justify-center rounded-lg ${isCampusAdmin ? 'bg-cyan-600' : 'bg-blue-600'} text-white font-bold`}>1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold">2</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
