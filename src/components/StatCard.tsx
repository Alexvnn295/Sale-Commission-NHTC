import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  subValueColor?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  subValueColor = 'text-slate-500',
  icon: Icon,
  iconColor,
  iconBg,
  id
}) => {
  return (
    <div
      id={id}
      className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex items-start justify-between hover:shadow-md hover:border-slate-200 transition-all duration-200"
    >
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-500 block">{title}</span>
        <h3 className="text-2xl font-bold text-slate-850 tracking-tight">{value}</h3>
        {subValue && (
          <p className={`text-xs ${subValueColor} font-medium`}>{subValue}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
