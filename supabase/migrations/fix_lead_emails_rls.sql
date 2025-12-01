-- Fix RLS policies for lead_emails table to allow webhook inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert lead emails" ON lead_emails;
DROP POLICY IF EXISTS "Users can view their lead emails" ON lead_emails;
DROP POLICY IF EXISTS "Users can insert their lead emails" ON lead_emails;

-- Ensure RLS is enabled
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role (webhooks, API) to do everything
CREATE POLICY "Service role full access"
ON lead_emails
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow authenticated users to view emails for their leads
CREATE POLICY "Users can view their lead emails"
ON lead_emails FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT l.id FROM leads l
    INNER JOIN campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy 3: Allow authenticated users to insert emails for their leads  
CREATE POLICY "Users can insert their lead emails"
ON lead_emails FOR INSERT
TO authenticated
WITH CHECK (
  lead_id IN (
    SELECT l.id FROM leads l
    INNER JOIN campaigns c ON l.campaign_id = c.id
    WHERE c.user_id = auth.uid()
  )
);
