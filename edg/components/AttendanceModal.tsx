/**
 * AttendanceModal.tsx
 * ---------------------------------------------------------------
 * 考勤登记弹窗（单个课次）。
 * 加载班级成员 + 已批准请假列表，逐人勾选出勤/迟到/缺席/请假，
 * 并设置扣课时，提交后写入考勤记录。
 * 使用位置：AttendanceDashboard、ScheduleManagement 等点击「登记」后弹出。
 * ---------------------------------------------------------------
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle2, UserCheck, UserX, Clock, Save, Info, Users, Search } from 'lucide-react';
import { useStore } from '../store';
import { AttendStatus } from '../types';
import api from '../utils/api';

// props：isOpen 控制显隐；onClose 关闭回调；lesson 传入当前课次基本信息
interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: {
        id: string;
        className: string;
        courseName: string;
        date: string;
        time: string;
        class_id?: string;
        course_id?: string;
    };
}

// 班级成员渲染用的最简结构（含余量课时，用于界面显示）
interface ClassMember {
    id: string;
    name: string;
    phone?: string;
    balanceLessons?: number;
}

/**
 * AttendanceModal —— 考勤登记弹窗
 * 关键状态：
 *  - classStudents 班级学员列表（含余量课时）
 *  - attendanceMap 学员 id -> {出勤状态, 扣课时}
 *  - searchTerm 学员名字搜索
 * 打开时拉取班级成员与已批准的请假单；提交通过 submitAttendance 写库。
 */
export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, lesson }) => {
    const { submitAttendance, currentUser } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [classStudents, setClassStudents] = useState<ClassMember[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendStatus, deductHours: number }>>({});

    // Fetch class members + approved leaves when modal opens
    useEffect(() => {
        if (!isOpen || !lesson.class_id) return;
        setLoadingStudents(true);
        Promise.all([
            api.get(`/api/teaching/class-members/${lesson.class_id}`).then(r => r.data || []).catch(() => []),
            api.get(`/api/teaching/leave/by-lesson/${lesson.id}`).then(r => r.data || []).catch(() => []),
        ])
            .then(([membersRaw, approvedLeaves]) => {
                const members: ClassMember[] = (membersRaw as any[]).map((m: any) => ({
                    id: m.student_id || m.id,
                    name: m.student?.name || m.name || '未知',
                    phone: m.student?.phone || m.phone,
                    balanceLessons: m.remainingQty ?? 0,
                }));
                setClassStudents(members);
                const leaveSet = new Set((approvedLeaves as any[]).map((l: any) => l.student_id));
                // 已批准请假的学员默认状态为请假（不扣课时），其他默认出勤
                const map: Record<string, { status: AttendStatus, deductHours: number }> = {};
                members.forEach(s => {
                    if (leaveSet.has(s.id)) {
                        map[s.id] = { status: 'leave', deductHours: 0 };
                    } else {
                        map[s.id] = { status: 'present', deductHours: 1.0 };
                    }
                });
                setAttendanceMap(map);
            })
            .finally(() => setLoadingStudents(false));
    }, [isOpen, lesson.class_id, lesson.id]);

    const filteredStudents = useMemo(() => {
        return classStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [classStudents, searchTerm]);

    const updateStatus = (studentId: string, status: AttendStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: { status, deductHours: status === 'leave' ? 0 : 1.0 }
        }));
    };

    const handleSave = () => {
        const records = Object.entries(attendanceMap).map(([student_id, data]) => ({
            student_id,
            status: data.status,
            deductHours: data.deductHours
        }));

        const campusId = currentUser?.campus_id || currentUser?.campus || '';

        submitAttendance(
            lesson.id,
            lesson.course_id || '',
            lesson.class_id || '',
            campusId,
            records
        );

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                            <ElmIcon name="user" size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">课次考勤录入</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {lesson.className} · {lesson.courseName} · {lesson.date} {lesson.time}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                        <ElmIcon name="close" size={16} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-xs group">
                        <ElmIcon name="search" size={16} />
                        <input
                            type="text"
                            placeholder="搜索学员姓名..."
                            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 出勤: {Object.values(attendanceMap).filter(v => v.status === 'present').length}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 请假: {Object.values(attendanceMap).filter(v => v.status === 'leave').length}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> 缺席: {Object.values(attendanceMap).filter(v => v.status === 'absent').length}
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                    {loadingStudents ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredStudents.map((student) => {
                                const current = attendanceMap[student.id] || { status: 'present', deductHours: 1.0 };
                                return (
                                    <div key={student.id} className={`p-4 rounded-3xl border transition-all flex items-center justify-between group ${current.status === 'present' ? 'bg-white border-slate-100 hover:border-emerald-200' :
                                        current.status === 'leave' ? 'bg-amber-50/30 border-amber-100/50' :
                                            'bg-red-50/30 border-red-100/50'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {student.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{student.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">剩余课时: {student.balanceLessons || 0}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                                            <button
                                                onClick={() => updateStatus(student.id, 'present')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${current.status === 'present' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <UserCheck size={12} /> 出勤
                                            </button>
                                            <button
                                                onClick={() => updateStatus(student.id, 'leave')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${current.status === 'leave' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <ElmIcon name="clock" size={16} /> 请假
                                            </button>
                                            <button
                                                onClick={() => updateStatus(student.id, 'absent')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${current.status === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <UserX size={12} /> 缺席
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loadingStudents && filteredStudents.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <div className="p-4 bg-slate-50 rounded-full"><ElmIcon name="user" size={16} /></div>
                            <p className="text-sm font-bold">{classStudents.length === 0 ? '该班级暂无学员' : '无匹配搜索结果'}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl text-[11px] font-medium text-blue-700 max-w-md">
                        <Info size={16} className="shrink-0" />
                        <span>考勤提交后将自动锁定相关学员的拟消课状态。点击底部按钮完成点名录入。</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-8 py-3 text-sm font-bold text-slate-500 hover:text-slate-900">取消</button>
                        <button
                            onClick={handleSave}
                            disabled={classStudents.length === 0}
                            className="px-12 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Save size={18} /> 确认提交考勤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
