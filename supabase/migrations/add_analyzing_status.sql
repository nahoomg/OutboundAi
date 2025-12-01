-- Migration to add 'ANALYZING' status to lead_status enum
-- Run this in your Supabase SQL Editor or via CLI

-- Add the new value to the existing enum
ALTER TYPE lead_status ADD VALUE 'ANALYZING' AFTER 'DISCOVERED';
