'use client';

import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead } from './types';
import { getInitials, getSentimentBadge } from './utils';

interface ConversationListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
}

export default function ConversationList({ leads, selectedLeadId, onSelectLead }: ConversationListProps) {
  return (
    <div className="col-span-1 glass-card rounded-2xl overflow-hidden flex flex-col">
      <div className="p-5 border-b border-white/5">
        <h3 className="font-bold text-white text-sm">
          Conversations
          <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">
            {leads.length}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {leads.length === 0 ? (
          <EmptyState />
        ) : (
          leads.map((lead) => (
            <ConversationItem
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadId === lead.id}
              onClick={() => onSelectLead(lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center text-slate-500">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-slate-600" />
      </div>
      <p className="font-medium text-white mb-1">No replies yet</p>
      <p className="text-sm text-slate-500">Start a campaign to get leads!</p>
    </div>
  );
}

interface ConversationItemProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ lead, isSelected, onClick }: ConversationItemProps) {
  const replySnippet = (lead.last_reply_text || lead.reply_body || 'No message').slice(0, 60);
  const timeAgo = lead.last_reply_date
    ? formatDistanceToNow(new Date(lead.last_reply_date), { addSuffix: true })
    : 'Unknown';

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 border-b border-white/5 cursor-pointer transition-all duration-200',
        isSelected ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-white/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-indigo-500/25">
          {getInitials(lead.company_name || lead.domain)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-white truncate text-sm">
              {lead.company_name || lead.domain}
            </h4>
            <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{timeAgo}</span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{replySnippet}...</p>
          {getSentimentBadge(lead.status)}
        </div>
      </div>
    </div>
  );
}
