'use server';

import { db, supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export async function finalizeMeeting(leadId: string, dateTime: string, customMessage?: string) {
  try {
    const lead = await db.leads.getById(leadId);
    if (!lead || !lead.contact_email) {
      return { success: false, error: 'Lead not found or missing contact email' };
    }

    const leadName = lead.company_name || lead.domain;
    const { createBooking } = await import('@/lib/services/calendar');
    const calendarResult = await createBooking(lead.contact_email, leadName, dateTime, 30);

    if (!calendarResult.success) {
      return { success: false, error: calendarResult.error || 'Failed to create calendar event' };
    }

    const { sendEmail: sendEmailService } = await import('@/lib/services/resend');
    const meetingDate = new Date(dateTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

    const emailBody = customMessage || `Hi ${leadName},\n\nGreat! I've confirmed our meeting for ${formattedDate} at ${formattedTime}.\n\n${calendarResult.meetLink ? `Join the meeting: ${calendarResult.meetLink}` : 'You should receive a calendar invitation shortly.'}\n\nLooking forward to our conversation!\n\nBest regards`;

    await sendEmailService({ to: lead.contact_email, subject: `Meeting Confirmed: ${formattedDate}`, body: emailBody });
    await db.leads.update(leadId, { status: 'REPLIED', meeting_link: calendarResult.meetLink || undefined });

    return { success: true, meetLink: calendarResult.meetLink, message: 'Meeting booked successfully!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeBooking(userId: string, leadId: string, dateTime: string, customMessage?: string) {
  try {
    const lead = await db.leads.getById(leadId);
    if (!lead || !lead.contact_email) {
      return { success: false, error: 'Lead not found or missing contact email' };
    }

    const leadName = lead.company_name || lead.domain || 'Prospect';
    const { createMeeting } = await import('@/lib/services/calendar');
    const calendarResult = await createMeeting(userId, lead.contact_email, leadName, dateTime, 30);

    if (!calendarResult.success) {
      return { success: false, error: calendarResult.error || 'Failed to create calendar event' };
    }

    const meetingDate = new Date(dateTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

    const emailSubject = `✅ Meeting Confirmed - ${formattedDate}`;
    const emailBody = customMessage || `Hi ${leadName},\n\nPerfect! I've added our meeting to the calendar.\n\n📅 **Date:** ${formattedDate}\n⏰ **Time:** ${formattedTime}\n${calendarResult.meetLink ? `🔗 **Join Link:** ${calendarResult.meetLink}` : ''}\n\nYou'll receive a calendar invitation with all the details. Looking forward to speaking with you!\n\nBest regards`;

    const { sendEmail: sendEmailService } = await import('@/lib/services/resend');
    await sendEmailService({ to: lead.contact_email, subject: emailSubject, body: emailBody });

    await db.leads.update(leadId, { status: 'BOOKED', meeting_link: calendarResult.meetLink || calendarResult.eventLink || undefined });

    return { success: true, meetLink: calendarResult.meetLink, eventLink: calendarResult.eventLink, message: 'Meeting booked successfully and confirmation sent!' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to book meeting' };
  }
}

export async function createProposal(leadId: string, startTime: Date, duration: number = 30) {
  try {
    const lead = await db.leads.getById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const campaign = await db.campaigns.getById(lead.campaign_id);
    if (!campaign) return { success: false, error: 'Campaign not found' };

    const { data: proposal, error } = await supabaseAdmin
      .from('meeting_proposals')
      .insert({ lead_id: leadId, user_id: campaign.user_id, proposed_start_time: startTime.toISOString(), duration_minutes: duration, status: 'PENDING' })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return { success: true, proposalId: proposal.id, url: `${appUrl}/meet/confirm/${proposal.id}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeMeetingProposal(proposalId: string) {
  try {
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('meeting_proposals')
      .select(`*, leads (id, contact_email, company_name, domain)`)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) return { success: false, error: 'Proposal not found' };
    if (proposal.status === 'ACCEPTED') return { success: false, error: 'Meeting already confirmed' };

    const lead = proposal.leads;
    if (!lead || !lead.contact_email) return { success: false, error: 'Lead contact email not found' };

    const leadName = lead.company_name || lead.domain || 'Prospect';
    const { createMeeting } = await import('@/lib/services/calendar');
    const calendarResult = await createMeeting(proposal.user_id, lead.contact_email, leadName, proposal.proposed_start_time, proposal.duration_minutes);

    if (!calendarResult.success) return { success: false, error: calendarResult.error || 'Failed to create calendar event' };

    await supabaseAdmin.from('meeting_proposals').update({ status: 'ACCEPTED' }).eq('id', proposalId);
    await db.leads.update(lead.id, { status: 'BOOKED', meeting_link: calendarResult.meetLink || calendarResult.eventLink || undefined });

    return { success: true, meetLink: calendarResult.meetLink, eventLink: calendarResult.eventLink, message: 'Meeting confirmed successfully!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMeetingAction(leadId: string, startTime: Date, durationMinutes: number = 30) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: 'Not authenticated. Please log in again.' };

    const lead = await db.leads.getById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const leadEmail = lead.contact_email;
    const leadName = lead.company_name || lead.domain;

    if (!leadEmail) return { success: false, error: 'Lead email not found' };

    const { createMeeting } = await import('@/lib/services/calendar');
    const calendarResult = await createMeeting(user.id, leadEmail, leadName, startTime.toISOString(), durationMinutes);

    if (!calendarResult.success || !calendarResult.eventLink) {
      return { success: false, error: calendarResult.error || 'Failed to create calendar event' };
    }

    await supabaseAdmin.from('leads').update({ status: 'BOOKED', booked_date: startTime.toISOString(), meeting_link: calendarResult.eventLink }).eq('id', leadId);

    const formattedDate = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

    return { success: true, meetingLink: calendarResult.eventLink, formattedTime: `${formattedDate} at ${formattedTime}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAppointments(userId: string) {
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'BOOKED')
      .not('booked_date', 'is', null)
      .order('booked_date', { ascending: true });

    if (error) return { success: false, error: error.message, appointments: [] };

    const appointments = (leads || []).map((lead: any) => ({
      id: lead.id,
      leadId: lead.id,
      leadName: lead.company_name || lead.domain,
      leadEmail: lead.contact_email,
      date: lead.booked_date,
      meetingLink: lead.meeting_link,
      status: 'accepted',
      domain: lead.domain
    }));

    return { success: true, appointments };
  } catch (error: any) {
    return { success: false, error: error.message, appointments: [] };
  }
}
