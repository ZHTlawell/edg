import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Calendar, User, Phone, Download, Image as ImageIcon, BarChart2, Target, UserCog, GraduationCap, Building2, Search, Filter } from 'lucide-react';
import { useStore } from '../store';
import { exportCSV } from '../../utils/exportCSV';

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
}

interface CampusDetailProps {
    campus: Campus;
    onBack: () => void;
}

const DocCard: React.FC<{ label: string }> = ({ label }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 aspect-square justify-center hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group">
        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center group-hover:border-blue-200 transition-all">
            <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
        </div>
        <span className="text-xs text-slate-500 font-medium text-center">{label}</span>
    </div>
);

const TABS = ['基本资料', '教职员工', '班级学员'];

// 教职员工数据（按 campus_id 匹配）
const allStaff = [
    // 浦东校区
    { id: 's1', name: '赵校长', role: '校区负责人', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '138****6001', status: '在职' },
    { id: 's2', name: '张明', role: '全栈开发讲师', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '139****6002', status: '在职' },
    { id: 's3', name: '李华', role: 'UI/UX设计讲师', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '137****6003', status: '在职' },
    { id: 's4', name: '王丽', role: '教务专员', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '186****6004', status: '在职' },
    { id: 's5', name: '刘伟', role: '财务出纳', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '135****6005', status: '在职' },
    { id: 's6', name: '陈思', role: '班主任', campus_id: 'CAMPUS_PUDONG', campus: '浦东校区', phone: '188****6006', status: '在职' },
    // 徐汇校区
    { id: 's7', name: '周主任', role: '校区负责人', campus_id: 'CAMPUS_XUHUI', campus: '徐汇校区', phone: '138****7001', status: '在职' },
    { id: 's8', name: '孙涛', role: 'Python讲师', campus_id: 'CAMPUS_XUHUI', campus: '徐汇校区', phone: '139****7002', status: '在职' },
    { id: 's9', name: '马芳', role: '产品经理讲师', campus_id: 'CAMPUS_XUHUI', campus: '徐汇校区', phone: '137****7003', status: '在职' },
    { id: 's10', name: '黄琳', role: '教务专员', campus_id: 'CAMPUS_XUHUI', campus: '徐汇校区', phone: '186****7004', status: '在职' },
];

// 校区证照数据
const campusCerts: Record<string, { name: string; no: string; expiry: string; status: '有效' | '即将到期' | '待办理' }[]> = {
    CAMPUS_PUDONG: [
        { name: '营业执照', no: '91310115MA1K****', expiry: '2028-12-31', status: '有效' },
        { name: '办学许可证', no: '教民1310115****', expiry: '2027-06-30', status: '有效' },
        { name: '消防合格证', no: '沪消验字[2024]****', expiry: '2026-09-15', status: '即将到期' },
        { name: '卫生许可证', no: '沪卫许可字****', expiry: '2027-03-20', status: '有效' },
        { name: '场地租赁登记', no: '沪房租备****', expiry: '2029-01-01', status: '有效' },
        { name: '税务登记证', no: '沪税登字****', expiry: '长期有效', status: '有效' },
    ],
    CAMPUS_XUHUI: [
        { name: '营业执照', no: '91310104MA1G****', expiry: '2029-06-30', status: '有效' },
        { name: '办学许可证', no: '教民1310104****', expiry: '2027-12-31', status: '有效' },
        { name: '消防合格证', no: '沪消验字[2025]****', expiry: '2027-05-10', status: '有效' },
        { name: '卫生许可证', no: '', expiry: '', status: '待办理' },
        { name: '场地租赁登记', no: '沪房租备****', expiry: '2028-08-01', status: '有效' },
        { name: '税务登记证', no: '沪税登字****', expiry: '长期有效', status: '有效' },
    ],
};

export const CampusDetail: React.FC<CampusDetailProps> = ({ campus, onBack }) => {
    const [activeTab, setActiveTab] = useState('基本资料');
    const [searchTerm, setSearchTerm] = useState('');
    const { students } = useStore();

    const monthlyLessons = Math.round(campus.students * 2.76);

    const STATUS_STYLE: Record<Campus['status'], string> = {
        '正常运营': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        '维护中': 'bg-amber-50 text-amber-500 border border-amber-100',
        '已停业': 'bg-slate-100 text-slate-500 border border-slate-200',
    };

    // Filter staff for this campus (按 campus_id 或 campus 名匹配)
    const staffList = useMemo(() => {
        return allStaff.filter(s =>
            (s.campus_id === campus.id || s.campus === campus.name) &&
            (s.name.includes(searchTerm) || s.role.includes(searchTerm) || s.phone.includes(searchTerm))
        );
    }, [campus.name, searchTerm]);

    // Filter students for this campus
    const campusStudents = useMemo(() => {
        return (students || []).filter(s => {
            // 按 campus_id 或 campus 名匹配
            const matchCampus = s.campus_id === campus.id || s.campus === campus.id || s.campus === campus.name;
            const matchSearch = !searchTerm || s.name.includes(searchTerm) || (s.className && s.className.includes(searchTerm)) || s.phone.includes(searchTerm);
            return matchCampus && matchSearch;
        });
    }, [students, campus.id, campus.name, searchTerm]);

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                返回校区列表
            </button>

            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left: identity */}
                    <div className="flex gap-4 flex-1">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                            <ElmIcon name="location" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h1 className="text-xl font-bold text-slate-900">{campus.name}</h1>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[campus.status]}`}>
                                    {campus.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <ElmIcon name="location" size={16} />
                                    上海市徐汇区桥路1号港汇中心广场
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <ElmIcon name="calendar" size={16} />
                                    成立时间：2018-05-12
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <ElmIcon name="user" size={16} />
                                    分校长：{campus.manager}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Phone size={13} className="text-slate-400" />
                                    联系电话：021-6488XXXX
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: export + stats */}
                    <div className="flex flex-col gap-4 lg:items-end shrink-0">
                        <button
                            onClick={() => {
                                const headers = ['校区', '在读人数', '在教职员工', '本月课消', '月营收'];
                                const rows = [[campus.name, String(campusStudents.length || campus.students), String(staffList.length), String(monthlyLessons), `¥${campus.monthlyRevenue.toLocaleString()}`]];
                                exportCSV(`校区报表_${campus.name}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-100"
                        >
                            <ElmIcon name="download" size={16} />
                            导出报表
                        </button>
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { label: '当前在读人数', value: campusStudents.length > 0 ? campusStudents.length.toString() : campus.students.toLocaleString() },
                                { label: '在教职员工', value: staffList.length.toString() },
                                { label: '本月课消数', value: monthlyLessons.toLocaleString() },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <p className="text-[11px] text-slate-400 mb-1">{s.label}</p>
                                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-0">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === tab
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab}
                        {tab === '教职员工' && allStaff.filter(s => s.campus_id === campus.id || s.campus === campus.name).length > 0 && (
                            <span className="ml-1.5 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                                {allStaff.filter(s => s.campus_id === campus.id || s.campus === campus.name).length}
                            </span>
                        )}
                        {tab === '班级学员' && (students || []).filter(s => s.campus_id === campus.id || s.campus === campus.id || s.campus === campus.name).length > 0 && (
                            <span className="ml-1.5 bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full">
                                {(students || []).filter(s => s.campus_id === campus.id || s.campus === campus.id || s.campus === campus.name).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab: 基本资料 */}
            {activeTab === '基本资料' && (
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
                    <div className="space-y-5">
                        {/* 运营负责人 */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ElmIcon name="user" size={16} />
                                <h2 className="font-bold text-slate-800">运营负责人</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { role: '正校长', name: '张文杰', phone: '138****0011' },
                                    { role: '教学副校长', name: '李雨婷', phone: '139****5566' },
                                    { role: '行政总监', name: '刘美玲', phone: '137****9988' },
                                    { role: '教务主管', name: '赵大勇', phone: '186****1122' },
                                ].map(p => (
                                    <div key={p.role} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <p className="text-xs text-slate-400 font-medium mb-1">{p.role}</p>
                                        <p className="font-bold text-slate-800 text-sm">{p.name}（{p.phone}）</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 证照信息 */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 size={16} className="text-blue-500" />
                                <h2 className="font-bold text-slate-800">证照信息</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(campusCerts[campus.id] || [{ name: '营业执照', no: '', expiry: '', status: '待办理' as const }, { name: '办学许可证', no: '', expiry: '', status: '待办理' as const }]).map(cert => (
                                    <div key={cert.name} className={`p-4 rounded-xl border ${cert.status === '有效' ? 'bg-emerald-50/50 border-emerald-100' : cert.status === '即将到期' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-bold text-slate-700">{cert.name}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cert.status === '有效' ? 'bg-emerald-100 text-emerald-600' : cert.status === '即将到期' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                                {cert.status}
                                            </span>
                                        </div>
                                        {cert.no ? (
                                            <>
                                                <p className="text-xs text-slate-400 font-mono">{cert.no}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">有效期至：{cert.expiry}</p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">暂未上传</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: 教职员工 */}
            {activeTab === '教职员工' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserCog size={18} className="text-blue-500" />
                            <h2 className="font-bold text-slate-800 uppercase tracking-tight">校区人员花名册</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <ElmIcon name="search" size={16} />
                                <input
                                    type="text"
                                    placeholder="搜索姓名/岗位..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium w-40"
                                />
                            </div>
                            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">管理档案</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">姓名</th>
                                    <th className="px-6 py-3">岗位</th>
                                    <th className="px-6 py-3">联系方式</th>
                                    <th className="px-6 py-3">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staffList.map(staff => (
                                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{staff.role}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{staff.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                {staff.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {staffList.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">暂无分配至该校区的员工记录</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: 班级学员 */}
            {activeTab === '班级学员' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GraduationCap size={18} className="text-blue-500" />
                            <h2 className="font-bold text-slate-800 uppercase tracking-tight">在读学员名单</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <ElmIcon name="search" size={16} />
                                <input
                                    type="text"
                                    placeholder="搜索姓名/班级..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium w-40"
                                />
                            </div>
                            <button className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-1.5 rounded-lg transition-colors"><ElmIcon name="operation" size={16} /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">学员姓名</th>
                                    <th className="px-6 py-3">所在班级</th>
                                    <th className="px-6 py-3">剩余课时</th>
                                    <th className="px-6 py-3">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campusStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                    <p className="text-[10px] text-slate-400">{student.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.className}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-bold ${student.balanceLessons <= 3 ? 'text-red-500' : 'text-slate-700'}`}>
                                                {student.balanceLessons} 课时
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${student.status === 'active' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                {student.status === 'active' ? '在读' : '已毕业'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {campusStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">暂无该校区的在读学员记录</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};
