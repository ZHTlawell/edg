
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Users,
  Filter,
  ChevronRight,
  Home
} from 'lucide-react';
import { Course, CourseStatus } from '../types';
import { CourseFormModal } from './CourseFormModal';

const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    name: '高级UI/UX设计实战',
    description: '深度讲解现代产品设计流程与工具使用。',
    instructor: '李老师',
    totalLessons: 32,
    startDate: '2024-05-20',
    status: 'ongoing',
    category: '设计',
  },
  {
    id: '2',
    name: '全栈开发：从入门到架构',
    description: '涵盖前端React与后端Node.js的全栈开发知识。',
    instructor: '张教授',
    totalLessons: 48,
    startDate: '2024-06-15',
    status: 'pending',
    category: '编程',
  },
  {
    id: '3',
    name: '商业数据分析大师班',
    description: '使用Python与Tableau进行深度商业洞察。',
    instructor: '陈首席',
    totalLessons: 24,
    startDate: '2024-04-10',
    status: 'completed',
    category: '数据',
  }
];

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这门课程吗？此操作不可撤销。')) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleSave = (course: Course) => {
    if (editingCourse) {
      setCourses(courses.map(c => c.id === course.id ? course : c));
    } else {
      setCourses([{ ...course, id: Date.now().toString() }, ...courses]);
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'ongoing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">进行中</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">已完成</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">筹备中</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={16} className="text-slate-500" />
        <a href="#" className="hover:text-blue-600 transition-colors">首页</a>
        <ChevronRight size={14} />
        <span className="text-slate-600 font-medium">课程管理</span>
      </nav>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">课程管理</h1>
          <p className="text-sm text-slate-500">发布、编辑和查看所有教育培训课程。</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          新增课程
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索课程名称、讲师..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={16} />
          筛选条件
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">课程名称</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">主讲人</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">总课时</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">开课时间</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{course.name}</span>
                        <span className="text-xs text-slate-400 line-clamp-1">{course.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                          {course.instructor.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-600">{course.instructor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {course.totalLessons} 节
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {course.startDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(course)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <span>未找到符合条件的课程</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CourseFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingCourse}
        />
      )}
    </div>
  );
};
