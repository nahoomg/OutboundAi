'use client';

import React, { useState } from 'react';
import { Search, Cpu, Calendar, Terminal, Target, Users, Plus, Play, Square, Rocket, Globe, Sparkles, Mail, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn, StatCard } from '@/components/ui';

interface Log {
  id: string;
  timestamp: string;
  type: 'SEARCH' | 'GEMINI' | 'SUCCESS' | 'INFO';
  message: string;
}

interface CampaignLog {
  id: string;
  stage: string;
  message: string;
  created_at: string;
  metadata?: { processed?: number; total?: number };
}

interface DashboardViewProps {
  stats: { discovered: number; qualifiedRate: number; booked: number };
  logs: Log[];
  logsEndRef: React.RefObject<HTMLDivElement | null>;
  isAgentActive: boolean;
  hasActiveCampaign: boolean;
  onStartCampaign: () => void;
  onClearLogs: () => void;
  campaigns?: any[];
  leadCounts?: Record<string, number>;
  setActiveCampaignId: (id: string) => void;
  startCampaignAction: (id: string) => Promise<any>;
  addLog: (type: Log['type'], message: string) => void;
  campaignLogs?: CampaignLog[];
  progress?: { processed: number; total: number };
}

export default function DashboardView({
  stats, logs, logsEndRef, isAgentActive, hasActiveCampaign, onStartCampaign, onClearLogs,
  campaigns = [], leadCounts = {}, setActiveCampaignId, startCampaignAction, addLog,
  campaignLogs = [], progress = { processed: 0, total: 0 }
}: DashboardViewProps) {
  const [runningCampaigns, setRunningCampaigns] = useState<Set<string>>(new Set());
  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <StatsRow stats={stats} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <AgentTerminal
          campaignLogs={campaignLogs}
          progress={progress}
          percent={percent}
          hasActiveCampaign={hasActiveCampaign}
          onClearLogs={onClearLogs}
          logsEndRef={logsEndRef}
        />
        <CampaignsList
          campaigns={campaigns}
          leadCounts={leadCounts}
          runningCampaigns={runningCampaigns}
          setRunningCampaigns={setRunningCampaigns}
          setActiveCampaignId={setActiveCampaignId}
          startCampaignAction={startCampaignAction}
          addLog={addLog}
          onStartCampaign={onStartCampaign}
        />
      </div>
    </div>
  );
}

function StatsRow({ stats }: { stats: DashboardViewProps['stats'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      <StatCard title="Leads Discovered" value={stats.discovered} icon={<Search className="text-blue-400" size={20} />} color="blue" isLive={true} />
      <StatCard title="Qualification Rate" value={`${stats.qualifiedRate}%`} icon={<Cpu className="text-purple-400" size={20} />} color="purple" isLive={true} />
      <StatCard title="Meetings Booked" value={stats.booked} icon={<Calendar className="text-emerald-400" size={20} />} color="emerald" isLive={true} />
    </div>
  );
}

function AgentTerminal({ campaignLogs, progress, percent, hasActiveCampaign, onClearLogs, logsEndRef }: any) {
  return (
    <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col">
      <ProgressBar percent={percent} />
      <TerminalHeader onClearLogs={onClearLogs} />
      <TerminalBody campaignLogs={campaignLogs} hasActiveCampaign={hasActiveCampaign} logsEndRef={logsEndRef} />
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full px-5 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">Campaign Progress</span>
        <span className="text-xs text-indigo-400 font-bold">{percent}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-800/50 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TerminalHeader({ onClearLogs }: { onClearLogs: () => void }) {
  return (
    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-sm font-mono text-slate-300">agent.logs</span>
        </div>
      </div>
      <button onClick={onClearLogs} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/5">
        Clear
      </button>
    </div>
  );
}

function TerminalBody({ campaignLogs, hasActiveCampaign, logsEndRef }: any) {
  if (campaignLogs.length === 0) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
          <Cpu size={24} className="text-slate-600" />
        </div>
        <p className="text-slate-500 text-sm font-medium">{hasActiveCampaign ? 'Agent is idle' : 'No active campaign'}</p>
        <p className="text-slate-600 text-xs mt-1">{hasActiveCampaign ? 'Start discovery to see activity' : 'Create a campaign to begin'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
      {campaignLogs.map((log: CampaignLog) => <LogEntry key={log.id} log={log} />)}
      <div ref={logsEndRef} />
    </div>
  );
}

function LogEntry({ log }: { log: CampaignLog }) {
  const style = getLogStyle(log.stage);
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg animate-slide-in-right", style.bg)}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-semibold uppercase text-slate-500">{log.stage}</span>
          {log.metadata?.processed !== undefined && log.metadata?.total !== undefined && (
            <span className="text-[10px] text-indigo-400 font-mono">[{log.metadata.processed}/{log.metadata.total}]</span>
          )}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{log.message}</p>
        <span className="text-[10px] text-slate-600 mt-1 block font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function getLogStyle(stage: string) {
  const styles: Record<string, { icon: React.ReactNode; bg: string }> = {
    STARTING: { icon: <Rocket size={14} className="text-blue-400" />, bg: 'bg-blue-500/5 border-l-2 border-blue-500/50' },
    SEARCHING: { icon: <Search size={14} className="text-cyan-400" />, bg: 'bg-cyan-500/5 border-l-2 border-cyan-500/50' },
    DISCOVERED: { icon: <Globe size={14} className="text-indigo-400" />, bg: 'bg-indigo-500/5 border-l-2 border-indigo-500/50' },
    QUALIFYING: { icon: <Sparkles size={14} className="text-purple-400" />, bg: 'bg-purple-500/5 border-l-2 border-purple-500/50' },
    QUALIFIED: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, bg: 'bg-emerald-500/5 border-l-2 border-emerald-500/50' },
    DRAFTING: { icon: <Mail size={14} className="text-pink-400" />, bg: 'bg-pink-500/5 border-l-2 border-pink-500/50' },
    COMPLETED: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, bg: 'bg-emerald-500/10 border-l-2 border-emerald-500/50' },
    ERROR: { icon: <AlertCircle size={14} className="text-red-400" />, bg: 'bg-red-500/5 border-l-2 border-red-500/50' }
  };
  return styles[stage] || { icon: <Info size={14} className="text-slate-400" />, bg: 'bg-slate-800/30 border-l-2 border-slate-600/50' };
}

function CampaignsList({ campaigns, leadCounts, runningCampaigns, setRunningCampaigns, setActiveCampaignId, startCampaignAction, addLog, onStartCampaign }: any) {
  const handleRunCampaign = async (campaign: any) => {
    const isRunning = runningCampaigns.has(campaign.id);
    if (isRunning) {
      setRunningCampaigns((prev: Set<string>) => { const next = new Set(prev); next.delete(campaign.id); return next; });
      return;
    }

    setRunningCampaigns((prev: Set<string>) => new Set(prev).add(campaign.id));
    setActiveCampaignId(campaign.id);
    addLog('INFO', `🚀 Starting campaign: ${campaign.name}...`);
    addLog('SEARCH', `🔎 Generating search query...`);

    try {
      const result = await startCampaignAction(campaign.id);
      if (result.success) {
        addLog('SUCCESS', `✅ Campaign started successfully!`);
        addLog('INFO', `📊 Found ${result.count || 0} potential leads. Processing...`);
        addLog('GEMINI', `🤖 Discovery agent is analyzing leads...`);
      } else {
        addLog('INFO', `❌ Failed to start campaign: ${result.error}`);
        setRunningCampaigns((prev: Set<string>) => { const next = new Set(prev); next.delete(campaign.id); return next; });
      }
    } catch (error: any) {
      addLog('INFO', `❌ Error starting campaign: ${error.message}`);
      setRunningCampaigns((prev: Set<string>) => { const next = new Set(prev); next.delete(campaign.id); return next; });
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-base font-bold text-white">Campaigns</h3>
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">{campaigns.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {campaigns.length === 0 ? (
          <EmptyCampaigns onStartCampaign={onStartCampaign} />
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign: any) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                leadCount={leadCounts[campaign.id] || 0}
                isRunning={runningCampaigns.has(campaign.id)}
                onRun={() => handleRunCampaign(campaign)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCampaigns({ onStartCampaign }: { onStartCampaign: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/20">
        <Target size={24} className="text-indigo-400" />
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1">No campaigns yet</p>
      <p className="text-slate-600 text-xs mb-4">Create your first campaign</p>
      <button onClick={onStartCampaign} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2">
        <Plus size={16} />
        New Campaign
      </button>
    </div>
  );
}

function CampaignCard({ campaign, leadCount, isRunning, onRun }: { campaign: any; leadCount: number; isRunning: boolean; onRun: () => void }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-300 group",
      isRunning ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border-emerald-500/30" : "bg-slate-800/30 border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/50"
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate group-hover:text-indigo-400 transition-colors">{campaign.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">{campaign.industry || 'General'}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className={cn("text-[10px] font-medium", campaign.status === 'ACTIVE' ? "text-emerald-400" : "text-slate-500")}>{campaign.status}</span>
          </div>
        </div>
        <button
          onClick={onRun}
          className={cn(
            "p-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center",
            isRunning ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          )}
        >
          {isRunning ? <Square size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500 flex items-center gap-1.5">
          <Users size={10} />
          {leadCount} leads
        </span>
        <span className="text-slate-600">{new Date(campaign.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
