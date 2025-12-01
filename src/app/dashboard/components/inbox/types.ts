export interface Lead {
  id: string;
  company_name: string;
  domain: string;
  status: string;
  reply_subject: string | null;
  reply_body: string | null;
  last_reply_text: string | null;
  last_reply_date: string | null;
  contact_email: string | null;
  email_draft: string | null;
  created_at: string;
}

export interface StoredEmail {
  id: string;
  lead_id: string;
  sender_type: 'agent' | 'lead';
  subject: string;
  body: string;
  created_at: string;
}

export interface Message {
  id: string;
  type: 'agent' | 'lead';
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface InboxViewProps {
  emails: any[];
  onRefresh?: () => void;
  userId: string;
}
