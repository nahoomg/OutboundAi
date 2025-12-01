import { createServerClient } from '@/lib/supabase/server';

export type CampaignLogStage =
    | 'STARTING'
    | 'SEARCHING'
    | 'DISCOVERED'
    | 'QUALIFYING'
    | 'QUALIFIED'
    | 'DRAFTING'
    | 'COMPLETED'
    | 'ERROR';

export interface CampaignLogMetadata {
    processed?: number;
    total?: number;
    success?: number;
    failed?: number;
    score?: number;
    domain?: string;
    [key: string]: any;
}

/**
 * Log campaign progress for real-time updates
 * @param campaignId - Campaign ID
 * @param stage - Current stage of campaign
 * @param message - Progress message
 * @param metadata - Additional metadata (counts, scores, etc.)
 */
export async function logCampaignProgress(
    campaignId: string,
    stage: CampaignLogStage,
    message: string,
    metadata?: CampaignLogMetadata
) {
    try {
        const supabase = await createServerClient();

        const logEntry = {
            campaign_id: campaignId,
            stage,
            message,
            metadata: metadata || {},
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('campaign_logs')
            .insert(logEntry);
    } catch (error) {}
}

/**
 * Get all logs for a campaign
 */
export async function getCampaignLogs(campaignId: string) {
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from('campaign_logs')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true });

        if (error) {
            return [];
        }

        return data || [];
    } catch (error) {
        return [];
    }
}
