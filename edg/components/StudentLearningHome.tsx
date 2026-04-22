/**
 * StudentLearningHome.tsx - 学员端"我的课程"学习主页
 *
 * 所在模块：学员端 -> 开始学习
 * 功能：
 *   - 展示学员已购课程（按 asset 资产账户聚合），支持搜索、跳转到课程学习详情
 * 使用方：学员端顶级学习入口
 */
import { ElmIcon } from './ElmIcon';
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, PlayCircle, Trophy,
  ChevronRight, Calendar, Star, Search
} from 'lucide-react';
import api from '../utils/api';
import { API_BASE } from '../utils/config';

/** 学习主页 Props：选择课程时回调课程 ID */
interface Props {
  onSelectCourse: (id: string) => void;
}

/** 已购课程（按资产账户聚合）结构 */
interface StudyCourse {
  asset_id: string;
  remaining_qty: number;
  total_qty: number;
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

/**
 * StudentLearningHome 主组件
 * - 拉取 /api/course-catalog/my-courses，对同 course.id 去重
 * - 顶部展示累计课时，支持按名称搜索
 */
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

  const filtered = React.useMemo(() => {
    const seen = new Set<string>();
    return (courses || []).filter(c => {
      if (seen.has(c.course.id)) return false;
      seen.add(c.course.id);
      return c.course.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [courses, search]);

  const totalLessons = (courses || []).reduce((sum, c) => sum + (c.total_qty || c.course.standard?.total_lessons || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <PlayCircle size={28} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">在线学习中心</h1>
            <p className="text-sm text-slate-400">选择课程开始学习，随时随地掌握新技能</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">已购课程</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">已购 {courses.length} 门课程</p>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">总课时</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">共 {totalLessons} 课时</p>
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
                      src={`${API_BASE}${item.course.standard.cover_url}`}
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
                        剩余{item.remaining_qty}/{item.total_qty || item.course.standard?.total_lessons || 0}课时
                      </span>
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
