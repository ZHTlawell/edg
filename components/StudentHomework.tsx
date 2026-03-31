import { ElmIcon } from './ElmIcon';
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { BookOpen, FileText, UploadCloud, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentHomework: React.FC = () => {
    const { currentUser, homeworks, homeworkSubmissions, classes, submitHomework, addToast } = useStore();
    const [selectedHomework, setSelectedHomework] = useState<string | null>(null);
    const [submissionContent, setSubmissionContent] = useState('');

    // Find the student's binded class(es)
    // Usually student belongs to one class in this demo
    const myClasses = useMemo(() => {
        // Very naive matching for demo: if student is in a class, they'd have an asset account or we just show matching classes by campus/status
        // Actually, we can just show homeworks where class name matches student.className if available
        // Or we just show all homeworks for demo purposes, filtering by student's class name.
        return classes || []; // Let's filter below instead
    }, [classes]);

    const myHomeworks = useMemo(() => {
        // In real life, filter by the class IDs the student is enrolled in.
        // For demo, just show all active homeworks
        return (homeworks || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [homeworks]);

    const handleSubmit = (hwId: string) => {
        if (typeof submitHomework !== 'function') {
            alert('检测到系统内核热更新缓存，请按 F5 或 Cmd+R 强制刷新页面后重试！');
            return;
        }

        if (!submissionContent.trim()) {
            addToast?.('请填写作业内容或提交代码链接', 'warning');
            return;
        }
        submitHomework({
            homework_id: hwId,
            student_id: currentUser?.bindStudentId || 'S10001',
            content: submissionContent,
        });
        setSubmissionContent('');
        setSelectedHomework(null);
    };

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-inner">
                        <ElmIcon name="reading" size={16} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">我的作业</h1>
                        <p className="text-sm text-slate-500 font-medium">查看教师布置的课后作业并在线提交，巩固学习成果。</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {myHomeworks.map(hw => {
                    const mySubmission = (homeworkSubmissions || []).find(s =>
                        s.homework_id === hw.id &&
                        (s.student_id === currentUser?.bindStudentId || (s as any).user_id === currentUser?.id)
                    );
                    const isGraded = mySubmission?.status === 'graded';
                    const isSubmitted = !!mySubmission;

                    return (
                        <div key={hw.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-8 transition-all hover:shadow-md">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={"px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full " + (isGraded ? 'bg-indigo-50 text-indigo-600' : isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600')}>
                                        {isGraded ? '已批改' : isSubmitted ? '待批改' : '待提交'}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-800">{hw.title}</h3>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {hw.content}
                                </p>
                                <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><ElmIcon name="clock" size={16} /> 截止: {hw.deadline}</span>
                                    <span className="flex items-center gap-1.5"><ElmIcon name="document" size={16} /> 满分 100分</span>
                                </div>
                            </div>

                            <div className="w-full md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 space-y-4">
                                {isGraded ? (
                                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center space-y-2">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">教师评分</p>
                                        <h4 className="text-3xl font-bold text-indigo-700 font-mono">{mySubmission.score} <span className="text-sm">分</span></h4>
                                        <p className="text-xs text-indigo-600 mt-2 font-medium bg-white px-3 py-2 rounded-xl text-left">
                                            老师寄语：{mySubmission.feedback || '做得不错，继续保持！'}
                                        </p>
                                    </div>
                                ) : isSubmitted ? (
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-center h-full gap-2 text-emerald-600">
                                        <ElmIcon name="circle-check" size={16} />
                                        <p className="text-sm font-bold">作业已提交</p>
                                        <p className="text-[10px] uppercase tracking-widest opacity-60">请等待老师批改</p>
                                    </div>
                                ) : selectedHomework === hw.id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                            rows={4}
                                            placeholder="输入作业解答或粘贴代码仓库链接..."
                                            value={submissionContent}
                                            onChange={e => setSubmissionContent(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => setSelectedHomework(null)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">
                                                取消
                                            </button>
                                            <button onClick={() => handleSubmit(hw.id)} className="flex-[2] py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                                <UploadCloud size={14} /> 确认提交
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <div className="p-3 bg-orange-50 text-orange-500 rounded-full">
                                            <ElmIcon name="warning" size={16} />
                                        </div>
                                        <button
                                            onClick={() => { setSelectedHomework(hw.id); setSubmissionContent(''); }}
                                            className="w-full py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-xl shadow-slate-200 hover:bg-orange-500 hover:shadow-orange-200 transition-all active:scale-95"
                                        >
                                            去完成作业
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {myHomeworks.length === 0 && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400 gap-4 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                            <ElmIcon name="circle-check" size={16} />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-600 mb-1">太棒了，暂无待办作业！</p>
                            <p className="text-xs uppercase tracking-widest opacity-60 font-bold">You are all caught up</p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
