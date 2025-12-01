-- Campaign Logs table for real-time progress tracking
-- Run this in your Supabase SQL Editor

-- Create enum for log stages
DO $$ BEGIN
    CREATE TYPE campaign_log_stage AS ENUM (
        'STARTING',
        'SEARCHING', 
        'DISCOVERED',
        'QUALIFYING',
        'QUALIFIED',
        'DRAFTING',
        'COMPLETED',
        'ERROR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Campaign Logs table
CREATE TABLE IF NOT EXISTS campaign_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON campaign_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_stage ON campaign_logs(stage);

-- Enable RLS
ALTER TABLE campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_logs
-- Allow users to view logs from their campaigns
CREATE POLICY "Users can view logs from their campaigns"
    ON campaign_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_logs.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

-- Allow inserts (server actions need to insert logs)
CREATE POLICY "Allow insert for authenticated users"
    ON campaign_logs FOR INSERT
    WITH CHECK (true);

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role has full access"
    ON campaign_logs
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Users can delete logs from their campaigns
CREATE POLICY "Users can delete logs from their campaigns"
    ON campaign_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_logs.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

-- Enable realtime for campaign_logs
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_logs;