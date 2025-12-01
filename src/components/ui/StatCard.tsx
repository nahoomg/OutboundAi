'use client';

import { cn } from './utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'emerald';
  isLive?: boolean;
}

const gradients = {
  blue: 'from-blue-500/20 to-cyan-500/10',
  purple: 'from-purple-500/20 to-pink-500/10',
  emerald: 'from-emerald-500/20 to-teal-500/10'
};

const glows = {
  blue: 'group-hover:shadow-blue-500/20',
  purple: 'group-hover:shadow-purple-500/20',
  emerald: 'group-hover:shadow-emerald-500/20'
};

export function StatCard({ title, value, trend, trendDirection = 'up', icon, color, isLive = true }: StatCardProps) {
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    : trendDirection === 'down' ? 'text-red-400 bg-red-500/10 border-red-500/20' 
    : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02] cursor-default relative overflow-hidden",
      glows[color]
    )}>
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl bg-gradient-to-br", gradients[color])}>
          {icon}
        </div>
        {trend && (
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1", trendColor)}>
            <TrendIcon size={12} />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  );
}
