/**
 * StatCard.tsx - 仪表盘通用统计卡片
 *
 * 所在模块：工作台 / Dashboard 等指标面板
 * 功能：展示单个 KPI（标签、数值、趋势百分比、图标）
 * 使用方：Dashboard / StatisticsOverview / TeacherStats 等
 */

import { ElmIcon } from './ElmIcon';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard Props
 * - label: 指标名称（如"本月新增学员"）
 * - value: 当前数值（字符串，已格式化）
 * - change: 变化量文本（如"+12%"）
 * - trend: 趋势方向，用于决定颜色和图标
 * - icon: 左上角图标 ReactNode
 * - iconBg: 图标容器背景色 class
 */
interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

/** StatCard 组件：纯展示型，根据 trend 切换正负趋势样式 */
export const StatCard: React.FC<StatCardProps> = ({
  label, 
  value, 
  change, 
  trend, 
  icon, 
  iconBg 
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'
        }`}>
          {trend === 'up' && <ElmIcon name="trend-charts" size={16} />}
          {trend === 'down' && <ElmIcon name="data-analysis" size={16} />}
          {trend === 'neutral' && <Minus size={16} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
    </div>
  );
};
