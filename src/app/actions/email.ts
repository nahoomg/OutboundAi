'use server';

import { db, supabaseAdmin } from '@/lib/supabase/admin';

async function ensureUserInitialized(userId: string) {
  try {
    const settings = await db.userSettings.getByUserId(userId);
    if (!settings || !settings.email_alias) {
      const alias = `user_${userId.substring(0, 8)}@nahom.tech`;
      await db.userSettings.upsert({
        user_id: userId,
        email_alias: settings?.email_alias || alias,
        gmail_sync_enabled: settings?.gmail_sync_enabled || false
      });
    }
  } catch (error) {}
}

export async function sendLeadEmail(leadId: string, targetEmail?: string) {
    try {
        const lead = await db.leads.getById(leadId);
        if (!lead || !lead.email_draft) {
          return { success: false, error: 'Lead not found or missing email data' };
        }

        const campaign = await db.campaigns.getById(lead.campaign_id);
        if (!campaign) throw new Error('Campaign not found');

        await ensureUserInitialized(campaign.user_id);

        const userSettings = await db.userSettings.getByUserId(campaign.user_id);
        const fromEmail = userSettings?.email_alias;
        let senderName: string | undefined;
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(campaign.user_id);
          senderName = user?.user_metadata?.full_name;
        } catch (error) {}
        if (!senderName) {
          const sendingEmail = userSettings?.sending_email;
          if (sendingEmail && sendingEmail !== 'unknown' && sendingEmail.includes('@')) {
            const emailUsername = sendingEmail.split('@')[0];
            senderName = emailUsername
              .replace(/[._]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          } else if (fromEmail) {
            const aliasUsername = fromEmail.split('@')[0];
            senderName = aliasUsername.charAt(0).toUpperCase() + aliasUsername.slice(1);
          }
        }
        const replyToEmail = (userSettings?.sending_email && userSettings.sending_email !== 'unknown' && userSettings.sending_email.includes('@')) 
          ? userSettings.sending_email 
          : fromEmail;
        let recipientEmail = lead.contact_email;
        if (targetEmail && targetEmail !== lead.contact_email) {
          await db.leads.update(leadId, { contact_email: targetEmail });
          recipientEmail = targetEmail;
        }
        if (!recipientEmail) return { success: false, error: 'No contact email available' };
        const lines = lead.email_draft.split('\n');
        const subject = lines[0].replace('Subject: ', '');
        const body = lines.slice(2).join('\n');
        const { sendEmail: sendEmailService } = await import('@/lib/services/resend');
        const emailResult = await sendEmailService({ 
          to: recipientEmail, 
          from: fromEmail, 
          fromName: senderName,
          subject, 
          body,
          replyTo: replyToEmail
        });
        if (!emailResult.success) return { success: false, error: emailResult.error };
        await db.leads.update(leadId, { status: 'CONTACTED' });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
}

export async function getInbox(userId: string) {
  try {
    await ensureUserInitialized(userId);
    const userCampaigns = await db.campaigns.getAll(userId);
    const campaignIds = userCampaigns.map(c => c.id);
    if (campaignIds.length === 0) return { success: true, emails: [] };
    const allLeads: any[] = [];
    for (const campaignId of campaignIds) {
      const campaignLeads = await db.leads.getByCampaign(campaignId);
      const relevantLeads = campaignLeads.filter(
        lead => lead.status === 'CONTACTED' || lead.status === 'REPLIED'
      );
      allLeads.push(...relevantLeads);
    }
    allLeads.sort((a, b) => {
      if (a.status === 'REPLIED' && b.status !== 'REPLIED') return -1;
      if (a.status !== 'REPLIED' && b.status === 'REPLIED') return 1;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
    const emails = allLeads.map(lead => {
      const isReply = lead.status === 'REPLIED';
      const draftSubject = lead.email_draft ? lead.email_draft.split('\n')[0].replace('Subject: ', '') : 'Outreach';
      const draftBody = lead.email_draft ? lead.email_draft.split('\n\n').slice(1).join('\n\n') : '';
      return {
        id: lead.id,
        sender: lead.company_name || lead.domain,
        subject: isReply ? (lead.reply_subject || `Re: ${draftSubject}`) : draftSubject,
        preview: isReply ? (lead.reply_body?.slice(0, 100) + '...' || 'New reply') : (draftBody.slice(0, 100) + '...'),
        fullBody: isReply ? (lead.reply_body || 'Reply received') : draftBody,
        sentiment: (lead.status === 'REPLIED' ? 'POSITIVE' : 'WAITING') as 'POSITIVE' | 'OOO' | 'NOT_INTERESTED' | 'WAITING',
        timestamp: new Date(lead.updated_at || lead.created_at).toISOString(),
        booked: false,
        isReply: isReply,
        lead_id: lead.id,
        domain: lead.domain,
        contact_email: lead.contact_email
      };
    });
    return { success: true, emails };
  } catch (error: any) {
    return { success: false, error: error.message, emails: [] };
  }
}

export async function analyzeMeetingIntent(emailBody: string) {
  try {
    const { extractMeetingIntent } = await import('@/lib/services/gemini-agent');
    const intent = await extractMeetingIntent(emailBody);
    return { success: true, intent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
