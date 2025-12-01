'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Download } from 'lucide-react';
import { getAllCampaigns, getCampaignLeadCount, sendLeadEmail, regenerateEmailDraft, getLeads, updateLead } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Lead, Campaign, LeadsViewProps, EditFormData, LeadStatus } from './types';
import CampaignFolders from './CampaignFolders';
import LeadsTable from './LeadsTable';
import LeadFilters from './LeadFilters';
import EmailDraftDrawer from './EmailDraftDrawer';
import EditLeadModal from './EditLeadModal';

export default function LeadsView({ leads, userId }: LeadsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignLeadCounts, setCampaignLeadCounts] = useState<Record<string, number>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedTo, setEditedTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [fetchedLeads, setFetchedLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isEditingLeadDetails, setIsEditingLeadDetails] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    company: '',
    contact_email: '',
    domain: '',
    status: 'DISCOVERED'
  });

  const parseEmailDraft = (draft: string | undefined) => {
    if (!draft) return { subject: '', body: '' };
    const lines = draft.split('\n');
    const subject = lines[0]?.replace('Subject: ', '') || '';
    const body = lines.slice(2).join('\n') || '';
    return { subject, body };
  };

  useEffect(() => {
    if (selectedLead?.emailDraft) {
      const { subject, body } = parseEmailDraft(selectedLead.emailDraft);
      setEditedSubject(subject);
      setEditedBody(body);
    }
    setEditedTo(selectedLead?.contact_email || selectedLead?.domain || '');
    setIsEditing(false);
    setMessage(null);
  }, [selectedLead]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const result = await getAllCampaigns(userId);
    if (result.success && result.campaigns) {
      setCampaigns(result.campaigns);
      const counts: Record<string, number> = {};
      for (const campaign of result.campaigns) {
        const countResult = await getCampaignLeadCount(campaign.id);
        if (countResult.success) counts[campaign.id] = countResult.count;
      }
      setCampaignLeadCounts(counts);
    }
  };

  useEffect(() => {
    if (!selectedCampaign) {
      setFetchedLeads([]);
      return;
    }

    const loadLeads = async () => {
      setIsLoadingLeads(true);
      const result = await getLeads(selectedCampaign.id);
      if (result.success && result.leads) {
        const mappedLeads: Lead[] = result.leads.map((l: any) => ({
          id: l.id,
          campaign_id: l.campaign_id,
          company: l.company_name || l.domain,
          domain: l.domain,
          techStack: l.tech_stack || [],
          score: l.ai_score || 0,
          status: l.status as LeadStatus,
          emailDraft: l.email_draft,
          contact_email: l.contact_email
        }));
        setFetchedLeads(mappedLeads);
      }
      setIsLoadingLeads(false);
    };
    loadLeads();
  }, [selectedCampaign]);

  const baseLeads = selectedCampaign ? fetchedLeads : leads;

  const filteredLeads = baseLeads.filter(lead => {
    if (scoreFilter !== 'all') {
      if (scoreFilter === 'high' && lead.score < 80) return false;
      if (scoreFilter === 'medium' && (lead.score < 50 || lead.score >= 80)) return false;
      if (scoreFilter === 'low' && lead.score >= 50) return false;
    }
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    return true;
  });

  const handleEditClick = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLeadId(lead.id);
    setEditFormData({ company: lead.company, contact_email: lead.contact_email || '', domain: lead.domain, status: lead.status });
    setIsEditingLeadDetails(true);
  };

  const handleSaveLeadDetails = async () => {
    if (!editingLeadId) return;
    const result = await updateLead(editingLeadId, { company_name: editFormData.company, contact_email: editFormData.contact_email, domain: editFormData.domain, status: editFormData.status });
    if (result.success) {
      setMessage({ type: 'success', text: 'Lead updated successfully!' });
      setFetchedLeads(prev => prev.map(l => l.id === editingLeadId ? { ...l, ...editFormData } : l));
      setIsEditingLeadDetails(false);
      setEditingLeadId(null);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update lead' });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLead) return;
    setIsSending(true);
    setMessage(null);
    const result = await sendLeadEmail(selectedLead.id, editedTo);
    if (result.success) {
      setMessage({ type: 'success', text: 'Email sent successfully!' });
      setFetchedLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, contact_email: editedTo, status: 'CONTACTED' as LeadStatus } : l));
      setTimeout(() => setSelectedLead(null), 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send email' });
    }
    setIsSending(false);
  };

  const handleRegenerateEmail = async () => {
    if (!selectedLead) return;
    setIsRegenerating(true);
    setMessage(null);
    const result = await regenerateEmailDraft(selectedLead.id);
    if (result.success && result.draft) {
      setSelectedLead({ ...selectedLead, emailDraft: result.draft });
      const { subject, body } = parseEmailDraft(result.draft);
      setEditedSubject(subject);
      setEditedBody(body);
      setMessage({ type: 'success', text: 'Email draft regenerated!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to regenerate draft' });
    }
    setIsRegenerating(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    const updatedDraft = `Subject: ${editedSubject}\n\n${editedBody}`;
    setSelectedLead({ ...selectedLead, emailDraft: updatedDraft, contact_email: editedTo });
    const result = await updateLead(selectedLead.id, { email_draft: updatedDraft, contact_email: editedTo });
    if (result.success) {
      setMessage({ type: 'success', text: 'Draft saved!' });
      setFetchedLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, emailDraft: updatedDraft, contact_email: editedTo } : l));
    } else {
      setMessage({ type: 'error', text: 'Failed to save changes to database' });
    }
    setIsEditing(false);
  };

  const handleExport = () => {
    if (!filteredLeads.length) return;
    const headers = ['Company Name', 'Domain', 'Contact Email', 'Status', 'AI Score', 'Tech Stack', 'Last Reply Text'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.company || ''}"`,
        `"${lead.domain || ''}"`,
        `"${lead.contact_email || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.score || 0}"`,
        `"${(lead.techStack || []).join(', ')}"`,
        `"${(lead.last_reply_text || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!selectedCampaign) {
    return (
      <div className="min-h-full flex flex-col">
        <CampaignFolders campaigns={campaigns} leadCounts={campaignLeadCounts} onSelectCampaign={setSelectedCampaign} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedCampaign(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-white rounded-xl transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Back to Campaigns
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all duration-200",
            showFilters ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white" : "bg-slate-800/50 hover:bg-slate-700/50 border-white/10 text-white"
          )}
        >
          <Filter size={16} />
          Filters
          {(scoreFilter !== 'all' || statusFilter !== 'all') && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
              {[scoreFilter !== 'all' ? 1 : 0, statusFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b)}
            </span>
          )}
        </button>

        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-white rounded-xl transition-all duration-200"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {showFilters && (
        <LeadFilters
          scoreFilter={scoreFilter}
          statusFilter={statusFilter}
          totalLeads={baseLeads.length}
          filteredCount={filteredLeads.length}
          onScoreChange={setScoreFilter}
          onStatusChange={setStatusFilter}
          onClear={() => { setScoreFilter('all'); setStatusFilter('all'); }}
        />
      )}

      <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">
        <LeadsTable leads={filteredLeads} isLoading={isLoadingLeads} onViewDraft={setSelectedLead} onEditLead={handleEditClick} />
      </div>

      {isEditingLeadDetails && (
        <EditLeadModal formData={editFormData} onFormChange={setEditFormData} onSave={handleSaveLeadDetails} onClose={() => setIsEditingLeadDetails(false)} />
      )}

      {selectedLead && (
        <EmailDraftDrawer
          lead={selectedLead}
          editedTo={editedTo}
          editedSubject={editedSubject}
          editedBody={editedBody}
          isEditing={isEditing}
          isSending={isSending}
          isRegenerating={isRegenerating}
          message={message}
          onClose={() => setSelectedLead(null)}
          onToChange={setEditedTo}
          onSubjectChange={setEditedSubject}
          onBodyChange={setEditedBody}
          onStartEdit={() => setIsEditing(true)}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setIsEditing(false)}
          onSendEmail={handleSendEmail}
          onRegenerateEmail={handleRegenerateEmail}
        />
      )}
    </div>
  );
}
