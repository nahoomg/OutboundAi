export type LeadStatus = 'DISCOVERED' | 'ANALYZING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONTACTED' | 'REPLIED' | 'UNREACHABLE';

export interface Lead {
  id: string;
  campaign_id: string;
  company: string;
  domain: string;
  techStack: string[];
  score: number;
  status: LeadStatus;
  emailDraft?: string;
  contact_email?: string;
  last_reply_text?: string;
}

export interface Campaign {
  id: string;
  name: string;
  industry?: string;
  status: string;
  created_at: string;
  target_location?: string;
}

export interface LeadsViewProps {
  leads: Lead[];
  userId: string;
}

export interface EditFormData {
  company: string;
  contact_email: string;
  domain: string;
  status: LeadStatus;
}
