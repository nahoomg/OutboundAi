'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Target, Users, Mail, Calendar, Settings, Zap, LogOut, Play, Square } from 'lucide-react';
import { cn, NavItem } from '@/components/ui';
import { startCampaign, getCampaignStats, getLeads, getInbox, getAllCampaigns, getCampaignLeadCount, getDashboardStats } from '../actions';
import { logout } from '../auth/actions';
import { createClient } from '@/lib/supabase/client';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import CampaignsView from './components/CampaignsView';
import InboxView from './components/InboxView';
import AppointmentsView from './components/AppointmentsView';
import SettingsView from './components/SettingsView';

const supabase = createClient();

type View = 'DASHBOARD' | 'CAMPAIGNS' | 'LEADS' | 'INBOX' | 'APPOINTMENTS' | 'SETTINGS';
type LogType = 'SEARCH' | 'GEMINI' | 'SUCCESS' | 'INFO';
type LeadStatus = 'DISCOVERED' | 'ANALYZING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONTACTED' | 'REPLIED' | 'UNREACHABLE';

interface Lead { id: string; campaign_id: string; company: string; domain: string; techStack: string[]; score: number; status: LeadStatus; emailDraft?: string; }
interface Email { id: string; sender: string; subject: string; preview: string; fullBody: string; sentiment: string; timestamp: string; isReply?: boolean; }
interface Log { id: string; timestamp: string; type: LogType; message: string; }

export default function OutboundAI() {
  const [activeView, setActiveView] = useState<View>('DASHBOARD');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, discovered: 0, qualifiedRate: 0, booked: 0 });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [emails, setEmails] = useState<Email[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); setUserEmail(user.email || null); }
    });
  }, []);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;
    const result = await getAllCampaigns(userId);
    if (result.success && result.campaigns) {
      setCampaigns(result.campaigns);
      const counts: Record<string, number> = {};
      for (const c of result.campaigns) {
        const r = await getCampaignLeadCount(c.id);
        if (r.success) counts[c.id] = r.count;
      }
      setLeadCounts(counts);
    }
  }, [userId]);

  // Fetch global dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (!userId) return;
    const result = await getDashboardStats(userId);
    if (result.success && result.stats) {
      setStats(prev => ({
        ...prev,
        discovered: result.stats.discovered,
        qualifiedRate: result.stats.qualifiedRate,
        booked: result.stats.booked
      }));
    }
  }, [userId]);

  useEffect(() => { if (userId) fetchCampaigns(); }, [userId, fetchCampaigns]);
  useEffect(() => { if (userId) fetchDashboardStats(); }, [userId, fetchDashboardStats]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // Real-time subscription for global stats
  useEffect(() => {
    if (!userId) return;

    // Subscribe to leads table changes (all leads, we filter via campaigns on fetch)
    const leadsChannel = supabase.channel('dashboard-leads-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' }, 
        () => {
          // Refetch stats when any leads change
          fetchDashboardStats();
        }
      ).subscribe();

    // Subscribe to campaigns changes (to track new campaigns)
    const campaignsChannel = supabase.channel('dashboard-campaigns-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns', filter: `user_id=eq.${userId}` }, 
        () => {
          fetchDashboardStats();
          fetchCampaigns();
        }
      ).subscribe();

    // Poll for stats every 5 seconds as backup (for qualification rate updates)
    const pollInterval = setInterval(() => {
      fetchDashboardStats();
    }, 5000);

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(campaignsChannel);
      clearInterval(pollInterval);
    };
  }, [userId, fetchDashboardStats, fetchCampaigns]);

  useEffect(() => {
    if (activeView !== 'INBOX' || !userId) return;
    const fetchInbox = async () => { const r = await getInbox(userId); if (r.success) setEmails(r.emails || []); };
    fetchInbox();
    const i = setInterval(fetchInbox, 30000);
    return () => clearInterval(i);
  }, [activeView, userId]);

  useEffect(() => {
    if (!activeCampaignId) return;
    (async () => {
      const statsRes = await getCampaignStats(activeCampaignId);
      if (statsRes.success && statsRes.stats) {
        setStats({ total: statsRes.stats.total, discovered: statsRes.stats.discovered, qualifiedRate: statsRes.stats.total > 0 ? Math.round((statsRes.stats.qualified / statsRes.stats.total) * 100) : 0, booked: statsRes.stats.replied });
      }
      const leadsRes = await getLeads(activeCampaignId);
      if (leadsRes.success) setLeads(leadsRes.leads.map((l: any) => ({ id: l.id, campaign_id: l.campaign_id, company: l.company_name || l.domain, domain: l.domain, techStack: l.tech_stack || [], score: l.ai_score || 0, status: l.status as LeadStatus, emailDraft: l.email_draft })));
      const { data: initLogs } = await supabase.from('campaign_logs').select('*').eq('campaign_id', activeCampaignId).order('created_at', { ascending: true });
      setCampaignLogs(initLogs || []);
      if (initLogs?.length) { const last = initLogs[initLogs.length - 1]; if (last.metadata?.processed !== undefined) setProgress({ processed: last.metadata.processed, total: last.metadata.total }); }
    })();

    const leadsChannel = supabase.channel('leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `campaign_id=eq.${activeCampaignId}` }, (p) => {
      if (p.eventType === 'INSERT') { const n = p.new as any; setLeads(prev => [{ id: n.id, campaign_id: n.campaign_id, company: n.company_name || n.domain, domain: n.domain, techStack: n.tech_stack || [], score: n.ai_score || 0, status: n.status as LeadStatus, emailDraft: n.email_draft }, ...prev]); setStats(prev => ({ ...prev, total: prev.total + 1, discovered: prev.discovered + 1 })); }
      else if (p.eventType === 'UPDATE') { const u = p.new as any; setLeads(prev => prev.map(l => l.id === u.id ? { ...l, company: u.company_name || u.domain, techStack: u.tech_stack || [], score: u.ai_score || 0, status: u.status as LeadStatus, emailDraft: u.email_draft } : l)); }
    }).subscribe();
    const logsChannel = supabase.channel('logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_logs', filter: `campaign_id=eq.${activeCampaignId}` }, (p) => { const n = p.new; setCampaignLogs(prev => [...prev, n]); if (n.metadata?.processed !== undefined) setProgress({ processed: n.metadata.processed, total: n.metadata.total }); }).subscribe();
    return () => { supabase.removeChannel(leadsChannel); supabase.removeChannel(logsChannel); };
  }, [activeCampaignId]);

  const addLog = (type: LogType, message: string) => setLogs(prev => [...prev.slice(-50), { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date().toLocaleTimeString(), type, message }]);

  const handleCampaignCreated = async (id: string) => {
    await fetchCampaigns(); setActiveCampaignId(id); setActiveView('DASHBOARD'); setIsAgentActive(true);
    addLog('INFO', '🚀 Starting campaign...');
    startCampaign(id).then(r => { if (r.success) { addLog('SUCCESS', '✅ Campaign started!'); addLog('INFO', `📊 Found ${r.count || 0} leads.`); } else addLog('INFO', `❌ Failed: ${r.error}`); });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 noise-bg">
      <div className="flex h-full w-full text-slate-200 font-sans selection:bg-indigo-500/30">
        <Sidebar activeView={activeView} setActiveView={setActiveView} userEmail={userEmail} qualifiedCount={leads.filter(l => l.status === 'QUALIFIED').length} inboxCount={emails.filter(e => e.isReply).length} />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <BackgroundGradients />
          <Header activeView={activeView} isAgentActive={isAgentActive} setIsAgentActive={setIsAgentActive} activeCampaignId={activeCampaignId} startCampaign={startCampaign} addLog={addLog} />
          <div className="flex-1 overflow-auto p-6 z-10">
            {activeView === 'DASHBOARD' && <DashboardView stats={stats} logs={logs} logsEndRef={logsEndRef} isAgentActive={isAgentActive} hasActiveCampaign={!!activeCampaignId} onStartCampaign={() => activeCampaignId ? setIsAgentActive(!isAgentActive) : setActiveView('CAMPAIGNS')} onClearLogs={() => { setLogs([]); setCampaignLogs([]); }} campaigns={campaigns} leadCounts={leadCounts} setActiveCampaignId={setActiveCampaignId} startCampaignAction={startCampaign} addLog={addLog} campaignLogs={campaignLogs} progress={progress} />}
            {activeView === 'CAMPAIGNS' && <CampaignsView onCampaignCreated={handleCampaignCreated} onCampaignDeleted={fetchCampaigns} userId={userId || ''} />}
            {activeView === 'LEADS' && <LeadsView leads={leads} userId={userId || ''} />}
            {activeView === 'INBOX' && <InboxView emails={emails} userId={userId || ''} onRefresh={async () => { if (userId) { const r = await getInbox(userId); if (r.success) setEmails(r.emails || []); } }} />}
            {activeView === 'APPOINTMENTS' && <AppointmentsView userId={userId || ''} />}
            {activeView === 'SETTINGS' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeView, setActiveView, userEmail, qualifiedCount, inboxCount }: any) {
  return (
    <aside className="w-72 border-r border-white/10 flex flex-col glass shrink-0">
      <Link href="/" className="p-5 flex items-center gap-3 border-b border-white/10 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo group-hover:scale-105 transition-transform duration-300"><Zap className="w-5 h-5 text-white" /></div>
        <div className="flex flex-col"><span className="font-bold text-lg tracking-tight text-white">OutboundAI</span><span className="text-[10px] text-indigo-400 font-medium">Sales Automation</span></div>
      </Link>
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 py-2 mb-2"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Main Menu</span></div>
        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
        <NavItem icon={<Target size={18} />} label="Campaigns" active={activeView === 'CAMPAIGNS'} onClick={() => setActiveView('CAMPAIGNS')} />
        <NavItem icon={<Users size={18} />} label="Leads" active={activeView === 'LEADS'} onClick={() => setActiveView('LEADS')} badge={qualifiedCount} />
        <NavItem icon={<Mail size={18} />} label="Inbox" active={activeView === 'INBOX'} onClick={() => setActiveView('INBOX')} badge={inboxCount} />
        <NavItem icon={<Calendar size={18} />} label="Appointments" active={activeView === 'APPOINTMENTS'} onClick={() => setActiveView('APPOINTMENTS')} />
      </nav>
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/10"><span className="text-white text-sm font-bold">{userEmail?.charAt(0).toUpperCase() || 'U'}</span></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{userEmail?.split('@')[0] || 'User'}</p><p className="text-[10px] text-slate-400 truncate">{userEmail || ''}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveView('SETTINGS')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200 border border-white/5 hover:border-white/10"><Settings size={16} /><span className="text-xs font-medium">Settings</span></button>
          <button onClick={() => logout()} className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 border border-white/5 hover:border-red-500/30"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

function BackgroundGradients() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
    </div>
  );
}

function Header({ activeView, isAgentActive, setIsAgentActive, activeCampaignId, startCampaign, addLog }: any) {
  const titles = { DASHBOARD: { title: 'Mission Control', desc: 'Monitor your outbound activity' }, CAMPAIGNS: { title: 'Campaigns', desc: 'Create and manage campaigns' }, LEADS: { title: 'Lead Pipeline', desc: 'Track and qualify prospects' }, INBOX: { title: 'Inbox', desc: 'Manage conversations' }, APPOINTMENTS: { title: 'Appointments', desc: 'Schedule and track meetings' }, SETTINGS: { title: 'Settings', desc: 'Configure your account' } } as const;
  const { title, desc } = titles[activeView as keyof typeof titles];
  return (
    <header className="sticky top-0 h-16 border-b border-white/10 flex items-center justify-between px-6 z-50 glass">
      <div className="flex items-center gap-4">
        <div><h2 className="text-lg font-bold text-white">{title}</h2><p className="text-xs text-slate-500">{desc}</p></div>
        {activeView === 'DASHBOARD' && <div className={cn("px-4 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 transition-all duration-300", isAgentActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 glow-emerald" : "bg-slate-800/50 border-slate-700 text-slate-400")}><div className={cn("w-2 h-2 rounded-full", isAgentActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />{isAgentActive ? "Agent Active" : "Agent Idle"}</div>}
      </div>
      {activeView === 'DASHBOARD' && <button onClick={async () => { const newState = !isAgentActive; setIsAgentActive(newState); if (newState && activeCampaignId) { addLog('INFO', '🚀 Starting discovery...'); const r = await startCampaign(activeCampaignId); if (r.success) addLog('SUCCESS', `✅ Found ${r.count} leads.`); else { addLog('INFO', `❌ ${r.error}`); setIsAgentActive(false); } } else addLog('INFO', '⏸️ Paused.'); }} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300", isAgentActive ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 glow-indigo")}>{isAgentActive ? <><Square size={16} /> Stop</> : <><Play size={16} fill="currentColor" /> Start Discovery</>}</button>}
    </header>
  );
}
