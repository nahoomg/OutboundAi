-- Create meeting_proposals table
CREATE TABLE IF NOT EXISTS meeting_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    proposed_start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_meeting_proposals_lead_id ON meeting_proposals(lead_id);
CREATE INDEX idx_meeting_proposals_user_id ON meeting_proposals(user_id);
CREATE INDEX idx_meeting_proposals_status ON meeting_proposals(status);

-- Enable RLS
ALTER TABLE meeting_proposals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own proposals
CREATE POLICY "Users can insert their own proposals"
    ON meeting_proposals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own proposals"
    ON meeting_proposals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: PUBLIC READ ACCESS for confirmation page (lead side)
-- This allows anyone with the proposal ID to view it (no auth required)
CREATE POLICY "Public can view proposals by ID"
    ON meeting_proposals
    FOR SELECT
    USING (true);

-- Policy: Public can update proposal status (for confirmation)
CREATE POLICY "Public can update proposal status to ACCEPTED"
    ON meeting_proposals
    FOR UPDATE
    USING (true)
    WITH CHECK (status = 'ACCEPTED');
