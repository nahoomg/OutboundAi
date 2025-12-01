// Database type definitions

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type LeadStatus = 'DISCOVERED' | 'ANALYZING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONTACTED' | 'REPLIED' | 'UNREACHABLE' | 'BOOKED';

export interface Campaign {
    id: string;
    user_id: string;
    name: string;
    icp_description: string;
    value_prop: string;
    industry?: string;
    target_company_size?: string;
    target_location?: string;
    pain_points?: string[];
    tech_stack_filter?: string[];
    target_persona?: string;
    status: CampaignStatus;
    created_at: string;
    updated_at: string;
}

export interface Lead {
    id: string;
    campaign_id: string;
    user_id: string; // User who owns this lead
    domain: string;
    company_name?: string;
    status: LeadStatus;
    ai_score?: number;
    ai_reasoning?: string;
    email_draft?: string;
    contact_email?: string;
    tech_stack?: string[];
    scraped_content?: string;
    last_reply_text?: string;
    last_reply_date?: string;
    booked_date?: string;
    meeting_link?: string;
    meeting_notes?: string;
    created_at: string;
    updated_at: string;
}

// Input types for creating records
export interface CreateCampaignInput {
    name: string;
    icp_description: string;
    value_prop: string;
    industry?: string;
    target_company_size?: string;
    target_location?: string;
    pain_points?: string[];
    tech_stack_filter?: string[];
    target_persona?: string;
}

export interface CreateLeadInput {
    campaign_id: string;
    domain: string;
    company_name?: string;
}

// Gemini AI response types
export interface QualificationResult {
    isFit: boolean;
    score: number;
    reason: string;
    techStack?: string[];
}

export interface EmailDraft {
    subject: string;
    body: string;
}

export interface MeetingIntent {
    hasProposedTime: boolean;
    proposedDate: string | null;
    proposedTime: string | null;
    suggestedResponse: string;
}

// Google Search result type
export interface SearchResult {
    domain: string;
    url?: string;
    title: string;
    snippet: string;
}

export interface UserSettings {
    id: string;
    user_id: string;
    email_alias?: string;
    sending_email?: string;
    google_refresh_token?: string;
    google_calendar_enabled?: boolean;
    gmail_sync_enabled?: boolean;
    email_signature?: string;
    default_send_schedule?: string;
    notify_on_reply?: boolean;
    notify_on_booking?: boolean;
    notify_daily_summary?: boolean;
    max_leads_per_campaign?: number;
    email_followup_delay_days?: number;
    created_at: string;
    updated_at: string;
}

export interface EmailExtractionResult {
    company_website: string;
    company_name: string;
    sender_name: string;
    email_summary: string;
}
