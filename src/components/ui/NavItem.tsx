'use client';

import { cn } from './utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

export function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
        active
          ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(
          "transition-colors duration-200",
          active ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"
        )}>
          {icon}
        </span>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge ? (
        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/30">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
