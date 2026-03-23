import { ElmIcon } from './ElmIcon';
import React, { useState } from 'react';
import { HelpCircle, Search, BookOpen, MessageCircle, FileText, ChevronRight, PlayCircle, Lightbulb } from 'lucide-react';

export const HelpCenter: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        { q: '如何给学员配置请假与补课单？', a: '在教务桌面选择【学员列表】，进入学员详情点击排课调整后即可生成请假补课挂单记录。' },
        { q: '财务模块如何配置聚合收款码和发票税点？', a: '需要在【系统设置】下的付款网关填入企业支付通道的密钥。发票模块支持对接航信电子票接口。' },
        { q: '排课冲突时，系统是如何告警提示的？', a: '在建立新班级拉入课表时，若遇到场地(教室)冲突、讲师冲突，系统会使用橙色底纹高亮警告并拦截发布。' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <ElmIcon name="help-filled" size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">帮助中心</h1>
                    <p className="text-slate-500 text-sm">快速查找产品手册、教学视频，或向您的专属顾问提问求助。</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: <ElmIcon name="reading" size={16} />, title: '新手入驻指南', desc: '5分钟快速梳理基础机构与系统数据结构设定', color: 'blue' },
                    { icon: <PlayCircle size={24} />, title: '视频点播教程', desc: '手把手操作录屏，掌握极速排课与订单收取的姿势', color: 'indigo' },
                    { icon: <ElmIcon name="chat-round" size={16} />, title: '联系在线客服', desc: '工作日 9:00 - 18:00 提供真人企业微信服务支持', color: 'emerald' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between h-full">
                        <div className="space-y-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg tracking-tight">{item.title}</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                            <span>前往查看</span>
                            <ElmIcon name="arrow-right" size={16} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggested FAQs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Lightbulb size={20} className="text-amber-500" />
                    <h2 className="font-bold text-slate-800 text-lg">大家常问的热门问题</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800 text-[15px]">{faq.q}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
                    <button className="text-blue-600 font-bold text-sm hover:underline hover:text-blue-800 transition-colors flex items-center justify-center gap-1 mx-auto">
                        <ElmIcon name="document" size={16} /> 浏览所有全量常见问答题库
                    </button>
                </div>
            </div>
        </div>
    );
};
