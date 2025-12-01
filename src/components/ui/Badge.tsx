'use client';

import { cn } from './utils';

type LeadStatus = 'DISCOVERED' | 'ANALYZING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONTACTED' | 'REPLIED' | 'UNREACHABLE';
type EmailSentiment = 'POSITIVE' | 'OOO' | 'NOT_INTERESTED' | 'WAITING';

interface BadgeProps {
  text: string;
  color: 'blue' | 'purple' | 'white';
}

interface StatusBadgeProps {
  status: LeadStatus;
}

interface SentimentBadgeProps {
  sentiment: EmailSentiment;
}

const badgeColors = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  white: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

const statusStyles = {
  DISCOVERED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  ANALYZING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  QUALIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UNQUALIFIED: 'bg-red-500/10 text-red-400 border-red-500/20',
  CONTACTED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REPLIED: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  UNREACHABLE: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

const sentimentStyles = {
  POSITIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OOO: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  NOT_INTERESTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  WAITING: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

export function Badge({ text, color }: BadgeProps) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", badgeColors[color])}>
      {text}
    </span>
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", statusStyles[status] || statusStyles.DISCOVERED)}>
      {status}
    </span>
  );
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", sentimentStyles[sentiment] || sentimentStyles.WAITING)}>
      {sentiment}
    </span>
  );
}
