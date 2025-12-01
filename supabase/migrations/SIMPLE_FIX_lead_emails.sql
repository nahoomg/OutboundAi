-- Simple fix: Disable RLS on lead_emails
-- This table is only accessed server-side with service_role, so RLS isn't needed

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'lead')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS completely (since we only use service_role)
ALTER TABLE lead_emails DISABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_created_at ON lead_emails(created_at DESC);
