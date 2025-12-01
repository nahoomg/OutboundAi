'use client';

import { Folder, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Campaign } from './types';

interface CampaignFoldersProps {
  campaigns: Campaign[];
  leadCounts: Record<string, number>;
  onSelectCampaign: (campaign: Campaign) => void;
}

export default function CampaignFolders({ campaigns, leadCounts, onSelectCampaign }: CampaignFoldersProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6">
          <Folder className="w-10 h-10 text-slate-600" />
        </div>
        <p className="text-lg font-bold text-white mb-2">No campaigns yet</p>
        <p className="text-sm text-slate-500">Create a campaign to start discovering leads</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(campaign => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          leadCount={leadCounts[campaign.id] || 0}
          onClick={() => onSelectCampaign(campaign)}
        />
      ))}
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  leadCount: number;
  onClick: () => void;
}

function CampaignCard({ campaign, leadCount, onClick }: CampaignCardProps) {
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Folder className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
              {campaign.name}
            </h3>
            <p className="text-xs text-slate-500">{campaign.industry || 'General'}</p>
          </div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="space-y-3 text-sm p-4 bg-slate-800/30 rounded-xl border border-white/5 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Leads</span>
          <span className="font-mono text-white font-bold">{leadCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Location</span>
          <span className="text-slate-300">{campaign.target_location || 'Any'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Created</span>
          <span className="text-slate-300">{new Date(campaign.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <button className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-400 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-indigo-500/20">
        <Eye size={16} />
        View Leads
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
      status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      status === 'PAUSED' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      status === 'DRAFT' && "bg-slate-500/10 text-slate-400 border-slate-500/20"
    )}>
      {status}
    </span>
  );
}
