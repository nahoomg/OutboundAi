-- Add reply_sentiment column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reply_sentiment TEXT;

-- Add comment
COMMENT ON COLUMN leads.reply_sentiment IS 'AI-analyzed sentiment of the reply: POSITIVE_INTEREST, REQUESTING_INFO, OBJECTION, OOO, NEGATIVE';
