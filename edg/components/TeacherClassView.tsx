import React, { useState, useMemo } from 'react';
import { ElmIcon } from './ElmIcon';
import { Search, ChevronDown, ChevronRight as ChevRight, Users } from 'lucide-react';
import { useStore } from '../store';

export const TeacherClassView: React.FC = () => {
    const { classes, currentUser } = useStore();
    const teacherId = (currentUser as any)?.teacherId;
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // 教师端 fetchClasses 返回扁平结构：每个 item = 一个班级+课程+教师
    // 结构：{ id, name, campus_id, capacity, enrolled, course, teacher, teacher_id, students, assignments? }
    const myClasses = useMemo(() => {
        return (classes || []).filter((cls: any) => {
            // 扁平结构：直接有 teacher_id（来自 getClassesByTeacher）
            if (cls.teacher_id === teacherId || cls.teacher?.id === teacherId) return true;
            // 嵌套结构（admin/campus_admin 视角）：assignments 数组
            if (cls.assignments?.some((a: any) => a.teacher_id === teacherId || a.teacher?.id === teacherId)) return true;
            return false;
        }).map((cls: any) => {
            const course = cls.course || cls.assignments?.find((a: any) => a.teacher_id === teacherId)?.course;
            const students = (cls.students || []).map((e: any) => e.student || e);
            return {
                id: cls.id,
                name: cls.name,
                campus: cls.campus_id || '—',
                course: course?.name || '未分配课程',
                capacity: cls.capacity || 0,
                enrolled: cls.enrolled || students.length,
                students,
            };
        });
    }, [classes, teacherId]);

    const filteredClasses = useMemo(() => {
        if (!searchTerm) return myClasses;
        const kw = searchTerm.toLowerCase();
        return myClasses.filter(c =>
            c.name.toLowerCase().includes(kw) ||
            c.course.toLowerCase().includes(kw) ||
            c.students.some((s: any) => s.name?.toLowerCase().includes(kw))
        );
    }, [myClasses, searchTerm]);

    const toggle = (id: string) => setExpanded(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    const totalStudents = myClasses.reduce((sum, c) => sum + c.enrolled, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的班级学员</h1>
                <p className="text-sm text-slate-500">管理您负责的 {myClasses.length} 个班级，共 {totalStudents} 名学员</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="搜索班级、课程或学员姓名..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm shadow-sm"
                />
            </div>

            {filteredClasses.length === 0 ? (
                <div className="py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                    <Users size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm font-bold text-slate-400">
                        {myClasses.length === 0 ? '暂无分配的班级' : '无匹配结果'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredClasses.map(cls => {
                        const isOpen = expanded.has(cls.id);
                        return (
                            <div key={cls.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Class header */}
                                <button onClick={() => toggle(cls.id)}
                                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-800">{cls.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><ElmIcon name="reading" size={14} /> {cls.course}</span>
                                                <span className="flex items-center gap-1"><ElmIcon name="user" size={14} /> {cls.enrolled}/{cls.capacity} 人</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls.enrolled >= cls.capacity ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {cls.enrolled >= cls.capacity ? '已满' : '招生中'}
                                        </span>
                                        {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevRight size={16} className="text-slate-400" />}
                                    </div>
                                </button>

                                {/* Student list */}
                                {isOpen && (
                                    <div className="border-t border-slate-50">
                                        {cls.students.length === 0 ? (
                                            <div className="px-6 py-8 text-center text-slate-400 text-sm italic">该班级暂无学员</div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <tr>
                                                        <th className="px-6 py-3">学员</th>
                                                        <th className="px-6 py-3">联系电话</th>
                                                        <th className="px-6 py-3">状态</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {cls.students.map((s: any) => (
                                                        <tr key={s.id} className="hover:bg-slate-50/30">
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                                        {s.name?.charAt(0) || '?'}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-slate-500">{s.phone || '—'}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' || s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {s.status === 'ACTIVE' || s.status === 'active' ? '在读' : s.status || '—'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
