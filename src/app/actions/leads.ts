'use server';

import { db } from '@/lib/supabase/admin';
import type { Lead } from '@/types/database';
import { qualifyLead, generateEmailDraft } from '@/lib/services/gemini-agent';
import { scrapeWebsite, extractCompanyName } from '@/lib/services/scraper';
import { logCampaignProgress } from '@/lib/services/campaign-logger';

export async function processLead(leadId: string) {
  try {
    const lead = await db.leads.getById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const campaign = await db.campaigns.getById(lead.campaign_id);
    if (!campaign) return { success: false, error: 'Campaign not found' };

    await logCampaignProgress(lead.campaign_id, 'QUALIFYING', `Analyzing website: ${lead.domain}`);
    const scrapedContent = await scrapeWebsite(lead.domain);

    if (!scrapedContent.success) {
      await db.leads.update(leadId, {
        status: 'UNREACHABLE',
        ai_reasoning: `Website unreachable: ${scrapedContent.error}`
      });
      return { success: false, error: scrapedContent.error };
    }

    const companyName = extractCompanyName(scrapedContent, lead.domain);
    await db.leads.update(leadId, {
      company_name: companyName,
      scraped_content: scrapedContent.textContent.slice(0, 1000)
    });

    await logCampaignProgress(lead.campaign_id, 'QUALIFYING', `AI analyzing fit for ${companyName}...`);
    const qualification = await qualifyLead(
      lead.domain,
      scrapedContent,
      campaign.icp_description,
      campaign.tech_stack_filter
    );

    await db.leads.update(leadId, {
      ai_score: qualification.score,
      ai_reasoning: qualification.reason,
      tech_stack: qualification.techStack,
      status: qualification.isFit && qualification.score >= 60 ? 'QUALIFIED' : 'UNQUALIFIED'
    });

    if (qualification.isFit && qualification.score >= 60) {
      await logCampaignProgress(lead.campaign_id, 'DRAFTING', `Drafting personalized email for ${companyName}`);
      const emailDraft = await generateEmailDraft(
        lead.domain,
        companyName,
        scrapedContent,
        campaign.value_prop,
        qualification.reason
      );

      await db.leads.update(leadId, {
        email_draft: `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
      });

      await logCampaignProgress(lead.campaign_id, 'QUALIFIED', `Qualified ${companyName} (Score: ${qualification.score})`, {
        score: qualification.score,
        domain: lead.domain
      });
    } else {
      await logCampaignProgress(lead.campaign_id, 'COMPLETED', `Skipped ${companyName} - Low score (${qualification.score})`, {
        score: qualification.score,
        domain: lead.domain
      });
    }

    return { success: true, qualification };
  } catch (error: any) {
    try {
      await db.leads.update(leadId, {
        status: 'UNREACHABLE',
        ai_reasoning: `Processing error: ${error.message}`
      });
    } catch {}
    return { success: false, error: error.message };
  }
}

export async function getLeads(campaignId: string) {
  try {
    const leads = await db.leads.getByCampaign(campaignId);
    return { success: true, leads };
  } catch (error: any) {
    return { success: false, error: error.message, leads: [] };
  }
}

export async function updateLead(leadId: string, updates: Partial<any>) {
  try {
    await db.leads.update(leadId, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function regenerateEmailDraft(leadId: string) {
  try {
    const lead = await db.leads.getById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const campaign = await db.campaigns.getById(lead.campaign_id);
    if (!campaign) return { success: false, error: 'Campaign not found' };

    if (!lead.scraped_content) return { success: false, error: 'No scraped content available' };

    const emailDraft = await generateEmailDraft(
      lead.domain,
      lead.company_name || lead.domain,
      {
        success: true,
        url: lead.domain,
        textContent: lead.scraped_content,
        title: lead.company_name || '',
        method: 'LOCAL_CHEERIO'
      },
      campaign.value_prop,
      lead.ai_reasoning || 'Qualified lead'
    );

    await db.leads.update(leadId, {
      email_draft: `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
    });

    return {
      success: true,
      draft: `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
