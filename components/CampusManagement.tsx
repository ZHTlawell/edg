
import React, { useState, useMemo } from 'react';
import { Building2, Search, Plus, MapPin, Users, Phone, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../store';

export const CampusManagement: React.FC = () => {
    const { currentUser } = useStore();
    const isCampusAdmin = currentUser?.role === 'campus_admin';
    const myCampusName = currentUser?.campus;

    const [searchTerm, setSearchTerm] = useState('');

    const initialCampuses = [
        { id: '1', name: '总校区', address: '上海市浦东新区世纪大道100号', manager: '张静', phone: '021-55551234', students: 1250, status: '营业中' },
        { id: '2', name: '浦东校区', address: '上海市浦东新区张江高科路888号', manager: '李建国', phone: '021-55555678', students: 840, status: '营业中' },
        { id: '3', name: '静安校区', address: '上海市静安区南京西路1500号', manager: '王芳', phone: '021-55559012', students: 620, status: '装修改造' },
    ];

    const filteredCampuses = useMemo(() => {
        let list = initialCampuses;
        if (isCampusAdmin && myCampusName) {
            list = list.filter(c => c.name === myCampusName);
        }
        if (searchTerm) {
            list = list.filter(c =>
                c.name.includes(searchTerm) ||
                c.manager.includes(searchTerm)
            );
        }
        return list;
    }, [isCampusAdmin, myCampusName, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">校区档案</h1>
                    <p className="text-sm text-slate-500 mt-1">管理各分校区基础信息、负责人及营业状态</p>
                </div>
                {!isCampusAdmin && (
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 self-start md:self-auto">
                        <Plus size={18} />
                        <span>新增校区</span>
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="搜索校区名称或负责人..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 font-medium text-slate-700">
                    <option value="all">所有状态</option>
                    <option value="active">营业中</option>
                    <option value="closing">已停业</option>
                    <option value="renovating">装修改造</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCampuses.map(campus => (
                    <div key={campus.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${campus.status === '营业中' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        {campus.name}
                                        {campus.id === '1' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">HQ</span>}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="truncate max-w-[200px] sm:max-w-xs">{campus.address}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${campus.status === '营业中' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {campus.status}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50/50 flex flex-wrap gap-y-4 gap-x-8">
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-400 font-medium text-xs">负责人</p>
                                <p className="font-bold text-slate-700 flex items-center gap-1.5"><Users size={14} className="text-blue-500" /> {campus.manager}</p>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-400 font-medium text-xs">联系电话</p>
                                <p className="font-bold text-slate-700 flex items-center gap-1.5"><Phone size={14} className="text-indigo-500" /> {campus.phone}</p>
                            </div>
                            <div className="space-y-1 text-sm ml-auto text-right">
                                <p className="text-slate-400 font-medium text-xs">在读学员数</p>
                                <p className="font-bold text-slate-900 text-lg">{campus.students.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="px-6 py-3 border-t border-slate-50 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"><Edit2 size={16} /></button>
                            {!isCampusAdmin && (
                                <button className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {filteredCampuses.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">未找到相关校区信息</p>
                </div>
            )}
        </div>
    );
};
