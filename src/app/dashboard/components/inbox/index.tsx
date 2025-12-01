'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { extractLatestMessage, formatEmailBody } from '@/lib/utils/emailParser';
import { Lead, Message, StoredEmail, InboxViewProps } from './types';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

export default function InboxView({ onRefresh, userId }: InboxViewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  const supabase = createClient();
  const selectedLead = selectedLeadId ? leads.find((lead) => lead.id === selectedLeadId) || null : null;

  const fetchLeads = useCallback(async () => {
    try {
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId);

      if (campaignsError || !campaigns || campaigns.length === 0) {
        setLeads([]);
        setIsLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('campaign_id', campaignIds);

      if (leadsError) {
        setLeads([]);
        setIsLoading(false);
        return;
      }

      const filteredLeads = (allLeads || [])
        .filter(lead => lead.status === 'REPLIED' || lead.status === 'INTERESTED' || lead.status === 'BOOKED')
        .sort((a, b) => {
          const dateA = a.last_reply_date ? new Date(a.last_reply_date).getTime() : 0;
          const dateB = b.last_reply_date ? new Date(b.last_reply_date).getTime() : 0;
          return dateB - dateA;
        });

      setLeads(filteredLeads);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  const fetchConversation = useCallback(async (leadId: string) => {
    const { data: storedEmails, error } = await supabase
      .from('lead_emails')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (error) return;

    const lead = leads.find(l => l.id === leadId);
    const messages: Message[] = [];

    if (lead?.email_draft) {
      messages.push({
        id: 'draft',
        type: 'agent',
        sender: 'You',
        subject: `Outreach to ${lead.company_name}`,
        body: formatEmailBody(lead.email_draft),
        timestamp: lead.created_at,
      });
    }

    if (storedEmails) {
      storedEmails.forEach((email: StoredEmail) => {
        const body = email.sender_type === 'lead' ? extractLatestMessage(email.body) : email.body;
        messages.push({
          id: email.id,
          type: email.sender_type,
          sender: email.sender_type === 'agent' ? 'You' : (lead?.company_name || 'Lead'),
          subject: email.subject || 'No Subject',
          body: formatEmailBody(body),
          timestamp: email.created_at,
        });
      });
    }

    if ((!storedEmails || storedEmails.length === 0) && lead?.reply_body) {
      messages.push({
        id: 'legacy_reply',
        type: 'lead',
        sender: lead.company_name || lead.domain,
        subject: lead.reply_subject || 'Re: Your email',
        body: formatEmailBody(extractLatestMessage(lead.reply_body)),
        timestamp: lead.last_reply_date || lead.created_at,
      });
    }

    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setConversation(messages);
  }, [leads, supabase]);

  useEffect(() => {
    fetchLeads();

    const leadsChannel = supabase
      .channel('inbox-leads-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe();

    const emailsChannel = supabase
      .channel('inbox-emails-conversation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_emails' }, () => {
        if (selectedLeadId) fetchConversation(selectedLeadId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, [userId, selectedLeadId, fetchLeads, fetchConversation, supabase]);

  useEffect(() => {
    if (selectedLeadId) fetchConversation(selectedLeadId);
    else setConversation([]);
  }, [selectedLeadId, fetchConversation]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedLead || isSending) return;

    const messageContent = replyMessage;
    setIsSending(true);

    const optimisticId = 'opt-' + Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      type: 'agent',
      sender: 'You',
      subject: `Re: ${selectedLead.reply_subject || 'Conversation'}`,
      body: formatEmailBody(messageContent),
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => [...prev, optimisticMessage]);
    setReplyMessage('');

    try {
      const response = await fetch('/api/email/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id, message: messageContent }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      const data = await response.json();
      if (data.email) {
        setConversation(prev => prev.map(m =>
          m.id === optimisticId
            ? { id: data.email.id, type: 'agent', sender: 'You', subject: data.email.subject, body: formatEmailBody(data.email.body), timestamp: data.email.created_at }
            : m
        ));
      } else {
        await fetchConversation(selectedLead.id);
      }
      onRefresh?.();
    } catch {
      setConversation(prev => prev.filter(m => m.id !== optimisticId));
      setReplyMessage(messageContent);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedLead || isSuggesting) return;

    const lastLeadMessage = [...conversation].reverse().find(m => m.type === 'lead');
    if (!lastLeadMessage) {
      alert('No lead message to reply to!');
      return;
    }

    setIsSuggesting(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: selectedLead.company_name,
          companyName: selectedLead.company_name,
          lastMessage: lastLeadMessage.body,
          conversationHistory: conversation
        }),
      });

      const data = await response.json();
      if (data.suggestion) setReplyMessage(data.suggestion);
    } catch {
      alert('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!selectedDate || !selectedTime || !selectedLead || isCreatingProposal) return;

    setIsCreatingProposal(true);
    try {
      const meetingDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const { createMeetingAction } = await import('@/app/actions');
      const result = await createMeetingAction(selectedLead.id, meetingDateTime, duration);

      if (!result?.success || !result.meetingLink) {
        throw new Error(result?.error || 'Failed to create meeting');
      }

      // Generate a confirmation email to send to the lead
      const confirmationEmail = `Hi ${selectedLead.company_name || 'there'},

Great! I've scheduled our meeting for ${result.formattedTime}.

You should receive a calendar invite shortly. You can also join directly via this link:
${result.meetingLink}

Looking forward to speaking with you!

Best regards`;

      // Set the confirmation email in the reply box
      setReplyMessage(confirmationEmail);
      
      // Close the scheduler but keep the conversation visible
      setShowScheduler(false);
      setSelectedDate('');
      setSelectedTime('');
      
      // Dispatch event for appointments view
      window.dispatchEvent(new CustomEvent('appointmentCreated'));
      
      // Don't call fetchLeads() here as it would remove the BOOKED lead from view
      // The user can still send the confirmation email before navigating away

    } catch (error) {
      alert(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingProposal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 font-medium">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ConversationList
        leads={leads}
        selectedLeadId={selectedLeadId}
        onSelectLead={setSelectedLeadId}
      />
      <ChatWindow
        lead={selectedLead}
        conversation={conversation}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        isSending={isSending}
        isSuggesting={isSuggesting}
        showScheduler={showScheduler}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        duration={duration}
        isCreatingProposal={isCreatingProposal}
        onRefreshConversation={() => { fetchLeads(); if (selectedLead) fetchConversation(selectedLead.id); }}
        onSendReply={handleSendReply}
        onAiSuggest={handleAiSuggest}
        onToggleScheduler={() => setShowScheduler(!showScheduler)}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onDurationChange={setDuration}
        onCreateMeeting={handleCreateMeeting}
      />
    </div>
  );
}
