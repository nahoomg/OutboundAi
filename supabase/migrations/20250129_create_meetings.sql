-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  location TEXT,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmation_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own meetings"
ON meetings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create meetings"
ON meetings FOR INSERT  
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
ON meetings FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_confirmation_token ON meetings(confirmation_token);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
