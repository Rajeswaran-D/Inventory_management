import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'indigo' 
}) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800',
  };

  return (
    <Card className="hover-card relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] blur-3xl scale-150 rotate-45 group-hover:scale-110 transition-transform duration-700">
         <Icon className="w-32 h-32" />
      </div>

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={cn("p-4 rounded-3xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-indigo-500/10 shadow-current/10", colors[color])}>
          <Icon className="w-8 h-8" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 group-hover:scale-105",
            trend === 'up' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}%
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-surface-500 dark:text-surface-400 text-xs font-black uppercase tracking-widest mb-3 opacity-70">
           {title}
        </h3>
        <p className="text-4xl font-black text-surface-900 dark:text-white tracking-tighter leading-tight drop-shadow-sm group-hover:text-indigo-600 transition-colors duration-300">
           {value}
        </p>
      </div>
    </Card>
  );
};
