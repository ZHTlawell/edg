
import { ElmIcon } from './ElmIcon';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

// StatCard component used in the Dashboard to display key metrics
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
