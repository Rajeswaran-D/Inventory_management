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
  color = 'green' 
}) => {
  const getColorStyles = (color) => {
    if (color === 'green') {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--primary)',
        borderColor: 'var(--primary)'
      };
    }
    if (color === 'emerald') {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--primary)',
        borderColor: 'var(--primary)'
      };
    }
    if (color === 'rose') {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#DC2626',
        borderColor: '#DC2626'
      };
    }
    if (color === 'amber') {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#F59E0B',
        borderColor: '#F59E0B'
      };
    }
    return {};
  };

  const trendColor = trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  const trendTextColor = trend === 'up' ? 'var(--primary)' : '#DC2626';

  return (
    <Card className="hover-card relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] blur-3xl scale-150 rotate-45 group-hover:scale-110 transition-transform duration-700">
         <Icon className="w-32 h-32" />
      </div>

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div 
          className="p-4 rounded-3xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-current/10"
          style={getColorStyles(color)}
        >
          <Icon className="w-8 h-8" />
        </div>
        {trend && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 group-hover:scale-105 border"
            style={{
              backgroundColor: trendColor,
              color: trendTextColor,
              borderColor: trendTextColor
            }}
          >
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}%
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-xs font-black uppercase tracking-widest mb-3 opacity-70" style={{ color: 'var(--text-secondary)' }}>
           {title}
        </h3>
        <p 
          className="text-4xl font-black tracking-tighter leading-tight drop-shadow-sm group-hover:transition-colors group-hover:duration-300"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'var(--text-primary)';
          }}
        >
           {value}
        </p>
      </div>
    </Card>
  );
};
