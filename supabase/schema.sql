-- OutboundAI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE lead_status AS ENUM ('DISCOVERED', 'ANALYZING', 'QUALIFIED', 'UNQUALIFIED', 'CONTACTED', 'REPLIED', 'UNREACHABLE');

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    icp_description TEXT NOT NULL,
    value_prop TEXT NOT NULL,
    industry VARCHAR(100),
    target_company_size VARCHAR(50),
    target_location VARCHAR(200),
    pain_points TEXT[],
    tech_stack_filter TEXT[],
    target_persona VARCHAR(255),
    status campaign_status DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,
    company_name VARCHAR(255),
    status lead_status DEFAULT 'DISCOVERED',
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_reasoning TEXT,
    email_draft TEXT,
    contact_email VARCHAR(255),
    tech_stack TEXT[],
    scraped_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, domain)
);

-- Create indexes for performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns"
    ON campaigns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
    ON campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
    ON campaigns FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
    ON campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view leads from their campaigns"
    ON leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = leads.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert leads to their campaigns"
    ON leads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = leads.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update leads from their campaigns"
    ON leads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = leads.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete leads from their campaigns"
    ON leads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = leads.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );
