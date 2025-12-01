-- Create lead_emails table for conversation history
CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'lead')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role (webhooks, API) to insert
CREATE POLICY "Service role can insert lead emails"
ON lead_emails FOR INSERT
TO service_role
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to view emails for their leads
CREATE POLICY "Users can view their lead emails"
ON lead_emails FOR SELECT
USING (
  lead_id IN (
    SELECT l.id FROM leads l
    INNER JOIN campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- RLS Policy: Allow authenticated users to insert emails for their leads  
CREATE POLICY "Users can insert their lead emails"
ON lead_emails FOR INSERT
WITH CHECK (
  lead_id IN (
    SELECT l.id FROM leads l
    INNER JOIN campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_created_at ON lead_emails(created_at DESC);
