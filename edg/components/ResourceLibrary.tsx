
import { ElmIcon } from './ElmIcon';
import React, { useState, useRef } from 'react';
import {
    FileText,
    Video,
    Image as ImageIcon,
    MoreHorizontal,
    Download,
    Search,
    Plus,
    Filter,
    FolderOpen,
    ChevronRight,
    BookOpen
} from 'lucide-react';

const MOCK_RESOURCES = [
    { id: 'RES001', name: 'UI设计基础讲义.pdf', type: 'document', size: '4.2 MB', date: '2024-05-12', category: '讲义', downloads: 128 },
    { id: 'RES002', name: 'Figma实战视频教程 - 第一章.mp4', type: 'video', size: '128 MB', date: '2024-05-15', category: '视频', downloads: 85 },
    { id: 'RES003', name: '原子化设计资产包.zip', type: 'archive', size: '15.6 MB', date: '2024-05-18', category: '素材', downloads: 210 },
    { id: 'RES004', name: '交互设计规范手册.pdf', type: 'document', size: '8.4 MB', date: '2024-05-20', category: '讲义', downloads: 54 },
    { id: 'RES005', name: '色彩搭配方案参考图.jpg', type: 'image', size: '2.1 MB', date: '2024-05-21', category: '素材', downloads: 142 },
];

export const ResourceLibrary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            alert(`模拟上传文件: ${file.name}\n大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            // Reset input so the same file can be selected again
            event.target.value = '';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'document': return <ElmIcon name="document" size={16} />;
            case 'video': return <Video size={20} className="text-purple-500" />;
            case 'image': return <ImageIcon size={20} className="text-emerald-500" />;
            default: return <FolderOpen size={20} className="text-amber-500" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>教务管理</span>
                        <ElmIcon name="arrow-right" size={16} />
                        <span className="text-slate-600">资源库</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <ElmIcon name="reading" size={16} /> 教学资源管理
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.zip,.png,.jpg,.jpeg,.docx"
                        className="hidden"
                    />
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <ElmIcon name="plus" size={16} /> 上传新资源
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <ElmIcon name="search" size={16} />
                    <input
                        type="text"
                        placeholder="搜索资源名称、类别或关键词..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                        <ElmIcon name="operation" size={16} /> 筛选
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-mono">
                        分类: 全部
                    </button>
                </div>
            </div>

            {/* Resources Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">资源名称</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">类型</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">文件大小</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">下载量</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">上传日期</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {MOCK_RESOURCES.map((res) => (
                            <tr key={res.id} className="hover:bg-indigo-50/5 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">{getIcon(res.type)}</div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{res.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg uppercase tracking-tight">{res.category}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-bold text-slate-500 font-mono">{res.size}</span>
                                </td>
                                <td className="px-8 py-5 text-center px-8">
                                    <span className="text-xs font-bold text-slate-900">{res.downloads}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <span className="text-xs font-bold text-slate-400 font-mono">{res.date}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="下载"><ElmIcon name="download" size={16} /></button>
                                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><ElmIcon name="more-filled" size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 bg-slate-50/20 border-t border-slate-50 flex items-center justify-center">
                    <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">加载更多资源档案...</button>
                </div>
            </div>
        </div>
    );
};
