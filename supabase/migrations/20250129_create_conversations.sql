-- Create conversations table for email threading
-- Simple, no RLS issues, easy to query

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'lead')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS entirely (server-side only access)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_created ON conversations(lead_id, created_at ASC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();
