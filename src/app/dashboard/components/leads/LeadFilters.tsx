'use client';

import { cn } from '@/lib/utils';
import { LeadStatus } from './types';

interface LeadFiltersProps {
  scoreFilter: 'all' | 'high' | 'medium' | 'low';
  statusFilter: LeadStatus | 'all';
  totalLeads: number;
  filteredCount: number;
  onScoreChange: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  onStatusChange: (filter: LeadStatus | 'all') => void;
  onClear: () => void;
}

export default function LeadFilters({
  scoreFilter,
  statusFilter,
  totalLeads,
  filteredCount,
  onScoreChange,
  onStatusChange,
  onClear
}: LeadFiltersProps) {
  const scoreOptions = [
    { value: 'all', label: 'All' },
    { value: 'high', label: 'High (80-100)' },
    { value: 'medium', label: 'Medium (50-79)' },
    { value: 'low', label: 'Low (<50)' }
  ] as const;

  return (
    <div className="mb-6 p-5 glass-card rounded-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-white">Filter Leads</h3>
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Score</label>
          <div className="flex gap-2">
            {scoreOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onScoreChange(option.value)}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  scoreFilter === option.value
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-white/5"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as LeadStatus | 'all')}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="all">All Statuses</option>
            <option value="DISCOVERED">Discovered</option>
            <option value="ANALYZING">Analyzing</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="UNREACHABLE">Unreachable</option>
          </select>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-white/5">
        <p className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredCount}</span> of{' '}
          <span className="font-bold text-white">{totalLeads}</span> leads
        </p>
      </div>
    </div>
  );
}
