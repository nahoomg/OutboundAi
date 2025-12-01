-- Enable Realtime for lead_emails table
ALTER PUBLICATION supabase_realtime ADD TABLE lead_emails;

-- Verify it's enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'lead_emails';
