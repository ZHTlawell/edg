import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, PlayCircle, Trophy,
  ChevronRight, Calendar, Star, Search
} from 'lucide-react';
import api from '../utils/api';

interface Props {
  onSelectCourse: (id: string) => void;
}

interface StudyCourse {
  asset_id: string;
  remaining_qty: number;
  course: {
    id: string;
    name: string;
    standard?: {
      cover_url?: string;
      description?: string;
      total_lessons: number;
    }
  }
}

export const StudentLearningHome: React.FC<Props> = ({ onSelectCourse }) => {
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/course-catalog/my-courses')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (courses || []).filter(c =>
    c.course.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">今天想学习什么？</h1>
          <p className="text-indigo-100 opacity-90">坚持每天进步一点点，终将成就非凡。</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <p className="text-xs text-indigo-200">已购课程</p>
            <p className="text-2xl font-bold">{courses.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <p className="text-xs text-indigo-200">已获勋章</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </div>

      {/* Course List Wrapper */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ElmIcon name="reading" size={16} />
            我的课程
          </h2>
          <div className="relative">
            <ElmIcon name="search" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索课程名称..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-64 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.asset_id}
                onClick={() => onSelectCourse(item.course.id)}
                className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Cover Image */}
                <div className="h-40 bg-slate-100 relative">
                  {item.course.standard?.cover_url ? (
                    <img
                      src={`http://localhost:3001${item.course.standard.cover_url}`}
                      alt={item.course.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <ElmIcon name="reading" size={16} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                      <PlayCircle className="text-white" size={32} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.course.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {item.course.standard?.description || '暂无课程描述'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ElmIcon name="calendar" size={16} />
                        剩余{item.remaining_qty}课时
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                      <Star size={10} fill="currentColor" />
                      官方认证
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <ElmIcon name="reading" size={16} />
            </div>
            <p className="text-slate-400 font-medium">暂无已购买课程</p>
          </div>
        )}
      </div>
    </div>
  );
};
