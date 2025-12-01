'use server';

import { db, supabaseAdmin } from '@/lib/supabase/admin';
import type { Campaign, CreateCampaignInput } from '@/types/database';
import { generateSearchQuery, findLeads } from '@/lib/services/google-search';
import { logCampaignProgress } from '@/lib/services/campaign-logger';
import { runWithRetry, processBatch } from '@/lib/utils/rate-limiter';
import { qualifyLead, generateEmailDraft } from '@/lib/services/gemini-agent';
import { scrapeWebsite, extractCompanyName } from '@/lib/services/scraper';

// Config for batch processing
const BATCH_CONCURRENCY = 2; 
const BATCH_DELAY_MS = 3000; 
const QUALIFICATION_THRESHOLD = 60; 

async function ensureUserInitialized(userId: string) {
  try {
    const settings = await db.userSettings.getByUserId(userId);
    if (!settings || !settings.email_alias || !settings.sending_email) {
      const alias = `user_${userId.substring(0, 8)}@nahom.tech`;
      await db.userSettings.upsert({
        user_id: userId,
        email_alias: settings?.email_alias || alias,
        sending_email: settings?.sending_email || 'unknown',
        gmail_sync_enabled: settings?.gmail_sync_enabled || false
      });
    }
  } catch (error) {}
}

export async function createCampaign(userId: string, input: CreateCampaignInput) {
  try {
    await ensureUserInitialized(userId);
    const campaign = await db.campaigns.create({
      user_id: userId,
      name: input.name,
      icp_description: input.icp_description,
      value_prop: input.value_prop,
      tech_stack_filter: input.tech_stack_filter,
      target_persona: input.target_persona,
      status: 'DRAFT'
    });
    return { success: true, campaign };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startCampaign(campaignId: string) {
  try {
    const campaign = await db.campaigns.getById(campaignId);
    if (!campaign) return { success: false, error: 'Campaign not found' };

    await db.campaigns.update(campaignId, { status: 'ACTIVE' });
    await logCampaignProgress(campaignId, 'STARTING', `Starting campaign: ${campaign.name}`);

    const searchQuery = generateSearchQuery(
      campaign.icp_description,
      campaign.industry,
      campaign.target_location,
      campaign.target_company_size
    );

    await logCampaignProgress(campaignId, 'SEARCHING', `Searching for leads with query: ${searchQuery}`);
    const searchResults = await findLeads(searchQuery);
    
    await logCampaignProgress(campaignId, 'DISCOVERED', `Found ${searchResults.length} potential companies to analyze`, {
      total: searchResults.length
    });

    const createdLeads = await createLeadsFromSearch(campaignId, campaign.user_id, searchResults);
    processLeadsInBackground(campaignId, createdLeads);

    return {
      success: true,
      message: `Campaign started! Processing ${createdLeads.length} leads in the background.`,
      count: createdLeads.length
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createLeadsFromSearch(campaignId: string, userId: string, searchResults: any[]) {
  const createdLeads: any[] = [];
  for (const result of searchResults) {
    try {
      const lead = await db.leads.upsert({
        campaign_id: campaignId,
        user_id: userId,
        domain: result.domain,
        company_name: result.title,
        status: 'DISCOVERED'
      });
      createdLeads.push(lead);
    } catch (error) {}
  }
  return createdLeads;
}

async function processLeadsInBackground(campaignId: string, leads: any[]) {
  const totalLeads = leads.length;
  let processedCount = 0;
  let qualifiedCount = 0;
  let failedCount = 0;

  await logCampaignProgress(campaignId, 'QUALIFYING', `Starting batch processing of ${totalLeads} leads (${BATCH_CONCURRENCY} at a time)`, {
    processed: 0,
    total: totalLeads
  });

  // Use batch processing for parallel execution with controlled concurrency
  const { results, errors } = await processBatch(
    leads,
    async (lead) => {
      // Process single lead with network resilience
      return await runWithRetry(
        () => processSingleLead(lead.id, campaignId),
        {
          maxRetries: 2,
          baseDelayMs: 2000,
          service: 'campaign-processor',
          skipOnFailure: true // Fail fast on network errors, don't block other leads
        }
      );
    },
    {
      concurrency: BATCH_CONCURRENCY,
      delayBetweenBatches: BATCH_DELAY_MS,
      onItemComplete: async (lead, result, error, index) => {
        processedCount++;
        
        if (error) {
          failedCount++;
          try {
            await db.leads.update(lead.id, { 
              status: 'UNREACHABLE', 
              ai_reasoning: `Processing error: ${error.message}` 
            });
          } catch (e) {}
          
          await logCampaignProgress(campaignId, 'QUALIFYING', `⚠️ Skipped ${lead.domain} (error)`, {
            processed: processedCount,
            total: totalLeads,
            failed: failedCount
          });
        } else {
          // Check if lead was qualified (we'll check the DB)
          try {
            const updatedLead = await db.leads.getById(lead.id);
            if (updatedLead?.status === 'QUALIFIED') {
              qualifiedCount++;
            }
          } catch (e) {
            // Ignore errors checking status
          }
          
          await logCampaignProgress(campaignId, 'QUALIFYING', `Processed ${processedCount}/${totalLeads}: ${lead.domain}`, {
            processed: processedCount,
            total: totalLeads,
            qualified: qualifiedCount,
            failed: failedCount
          });
        }
      }
    }
  );

  // Final summary
  const successCount = totalLeads - failedCount;
  
  await logCampaignProgress(campaignId, 'COMPLETED', 
    `✅ Campaign completed! Processed ${successCount}/${totalLeads} leads successfully. ${qualifiedCount} qualified, ${failedCount} failed.`, 
    {
      processed: totalLeads,
      total: totalLeads,
      qualified: qualifiedCount,
      failed: failedCount,
      success: successCount
    }
  );

  // Update campaign status
  await db.campaigns.update(campaignId, { status: 'COMPLETED' });
}

async function processSingleLead(leadId: string, campaignId: string): Promise<{ qualified: boolean }> {
  const lead = await db.leads.getById(leadId);
  if (!lead) return { qualified: false };
  
  const campaign = await db.campaigns.getById(lead.campaign_id);
  if (!campaign) return { qualified: false };

  const scrapedContent = await scrapeWebsite(lead.domain);
  
  if (!scrapedContent.success) {
    await db.leads.update(leadId, { 
      status: 'UNREACHABLE', 
      ai_reasoning: `Website unreachable: ${scrapedContent.error}` 
    });
    return { qualified: false };
  }

  // Step 2: Extract company name
  const companyName = extractCompanyName(scrapedContent, lead.domain);
  await db.leads.update(leadId, { 
    company_name: companyName, 
    scraped_content: scrapedContent.textContent.slice(0, 1000) 
  });

  const qualification = await runWithRetry(
    () => qualifyLead(lead.domain, scrapedContent, campaign.icp_description, campaign.tech_stack_filter),
    { service: 'gemini-qualify', maxRetries: 2, skipOnFailure: true }
  );
  
  await db.leads.update(leadId, { 
    ai_score: qualification.score, 
    ai_reasoning: qualification.reason, 
    tech_stack: qualification.techStack, 
    status: qualification.isFit && qualification.score >= QUALIFICATION_THRESHOLD ? 'QUALIFIED' : 'UNQUALIFIED' 
  });

  if (qualification.isFit && qualification.score >= QUALIFICATION_THRESHOLD) {
    
    try {
      const emailDraft = await runWithRetry(
        () => generateEmailDraft(lead.domain, companyName, scrapedContent, campaign.value_prop, qualification.reason),
        { service: 'gemini-draft', maxRetries: 2, skipOnFailure: true }
      );
      
      // Add lead tier based on score for prioritization
      const tier = qualification.score >= 90 ? '🔥 HOT' : qualification.score >= 80 ? '⭐ WARM' : '📋 COOL';
      
      await db.leads.update(leadId, { 
        email_draft: `Subject: ${emailDraft.subject}\n\n${emailDraft.body}\n\n---\nLead Tier: ${tier} | Score: ${qualification.score}` 
      });
    } catch (error) {
      await db.leads.update(leadId, { 
        email_draft: `[Draft generation failed - please write manually]\n\nCompany: ${companyName}\nScore: ${qualification.score}\nReason: ${qualification.reason}` 
      });
    }
    
    return { qualified: true };
  }

  return { qualified: false };
}

export async function getAllCampaigns(userId: string) {
  try {
    const campaigns = await db.campaigns.getAll(userId);
    return { success: true, campaigns };
  } catch (error: any) {
    return { success: false, error: error.message, campaigns: [] };
  }
}

export async function updateCampaign(campaignId: string, updates: Partial<CreateCampaignInput>) {
  try {
    const campaign = await db.campaigns.update(campaignId, updates);
    return { success: true, campaign };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCampaign(campaignId: string) {
  try {
    await db.campaigns.delete(campaignId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaignLeadCount(campaignId: string) {
  try {
    const leads = await db.leads.getByCampaign(campaignId);
    return { success: true, count: leads.length };
  } catch (error: any) {
    return { success: false, count: 0 };
  }
}

export async function getCampaignStats(campaignId: string) {
  try {
    const leads = await db.leads.getByCampaign(campaignId);
    const qualifiedLeads = leads.filter(l => l.ai_score);
    
    const stats = {
      total: leads.length,
      discovered: leads.filter(l => l.status === 'DISCOVERED').length,
      qualified: leads.filter(l => l.status === 'QUALIFIED').length,
      unqualified: leads.filter(l => l.status === 'UNQUALIFIED').length,
      contacted: leads.filter(l => l.status === 'CONTACTED').length,
      replied: leads.filter(l => l.status === 'REPLIED').length,
      unreachable: leads.filter(l => l.status === 'UNREACHABLE').length,
      avgScore: qualifiedLeads.length > 0 
        ? qualifiedLeads.reduce((sum, l) => sum + (l.ai_score || 0), 0) / qualifiedLeads.length 
        : 0
    };

    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardStats(userId: string) {
  try {
    // Get all leads for this user (via campaigns since leads don't have direct user_id)
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);
    
    if (campaignsError) throw campaignsError;

    const campaignIds = campaigns?.map((c: { id: string }) => c.id) || [];
    
    let totalLeads = 0;
    let qualifiedLeads = 0;
    let bookedMeetings = 0;

    // Only query leads if user has campaigns
    if (campaignIds.length > 0) {
      const { data: leads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('id, status, ai_score')
        .in('campaign_id', campaignIds);
      
      if (leadsError) throw leadsError;

      totalLeads = leads?.length || 0;
      qualifiedLeads = leads?.filter((l: { status: string; ai_score: number | null }) => 
        l.status === 'QUALIFIED' || (l.ai_score && l.ai_score >= 70)
      ).length || 0;
    }

    // Try to get meetings count (table may not exist yet)
    try {
      const { data: meetings, error: meetingsError } = await supabaseAdmin
        .from('meetings')
        .select('id, status')
        .eq('user_id', userId);
      
      if (!meetingsError && meetings) {
        bookedMeetings = meetings.filter((m: { status: string }) => 
          m.status === 'scheduled' || m.status === 'confirmed' || m.status === 'pending'
        ).length;
      }
    } catch {}

    const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    return {
      success: true,
      stats: {
        discovered: totalLeads,
        qualifiedRate: qualificationRate,
        qualified: qualifiedLeads,
        booked: bookedMeetings
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message, stats: { discovered: 0, qualifiedRate: 0, qualified: 0, booked: 0 } };
  }
}
