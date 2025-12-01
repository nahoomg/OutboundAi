'use client';

import { Search, RefreshCw, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead, LeadStatus } from './types';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onViewDraft: (lead: Lead) => void;
  onEditLead: (lead: Lead, e: React.MouseEvent) => void;
}

export default function LeadsTable({ leads, isLoading, onViewDraft, onEditLead }: LeadsTableProps) {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 animate-spin text-white" />
        </div>
        <p className="font-medium text-white">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-600" />
        </div>
        <p className="font-medium text-white mb-1">No leads match your filters</p>
        <p className="text-sm text-slate-500">Try adjusting your filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px] scrollbar-hide">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-slate-900/80 sticky top-0">
            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Industry/Tags</th>
            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">AI Score</th>
            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onViewDraft={onViewDraft} onEditLead={onEditLead} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LeadRowProps {
  lead: Lead;
  onViewDraft: (lead: Lead) => void;
  onEditLead: (lead: Lead, e: React.MouseEvent) => void;
}

function LeadRow({ lead, onViewDraft, onEditLead }: LeadRowProps) {
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="p-4">
        <div className="font-bold text-white">{lead.company}</div>
        <div className="text-xs text-slate-500">{lead.domain}</div>
      </td>
      <td className="p-4">
        <div className="flex gap-1 flex-wrap">
          {lead.techStack.slice(0, 2).map(t => (
            <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/5">{t}</span>
          ))}
          {lead.techStack.length > 2 && <span className="text-xs text-slate-500">+{lead.techStack.length - 2}</span>}
        </div>
      </td>
      <td className="p-4">
        <ScoreBar score={lead.score} />
      </td>
      <td className="p-4">
        <StatusBadge status={lead.status} />
      </td>
      <td className="p-4 flex items-center gap-2">
        <button
          onClick={(e) => onEditLead(lead, e)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Edit Lead"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onViewDraft(lead)}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Draft
        </button>
      </td>
    </tr>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", score > 80 ? "bg-emerald-500" : score > 50 ? "bg-yellow-500" : "bg-red-500")}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400">{score}%</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    DISCOVERED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ANALYZING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    QUALIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UNQUALIFIED: 'bg-red-500/10 text-red-400 border-red-500/20',
    CONTACTED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    REPLIED: 'bg-green-500/10 text-green-400 border-green-500/20',
    UNREACHABLE: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium border", styles[status])}>
      {status}
    </span>
  );
}
