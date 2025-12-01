import { createClient } from '@supabase/supabase-js';
import type { Campaign, Lead, UserSettings } from '@/types/database';

export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null as any;

export const db = {
  campaigns: {
    async getAll(userId: string) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },

    async getById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Campaign;
    },

    async create(campaign: Partial<Campaign>) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },

    async update(id: string, updates: Partial<Campaign>) {
      const { data, error } = await supabaseAdmin
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },

    async delete(id: string) {
      const { error } = await supabaseAdmin.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  leads: {
    async getByCampaign(campaignId: string) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },

    async getById(id: string) {
      const { data, error } = await supabaseAdmin.from('leads').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Lead;
    },

    async create(lead: Partial<Lead>) {
      const { data, error } = await supabaseAdmin.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data as Lead;
    },

    async update(id: string, updates: Partial<Lead>) {
      const { data, error } = await supabaseAdmin.from('leads').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Lead;
    },

    async upsert(lead: Partial<Lead>) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(lead, { onConflict: 'campaign_id,domain' })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },

    async getByEmail(email: string) {
      const { data, error } = await supabaseAdmin.from('leads').select('*').eq('contact_email', email).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Lead | null;
    },

    async getByStatus(status: string) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    }
  },

  userSettings: {
    async getByUserId(userId: string) {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSettings | null;
    },

    async create(settings: Partial<UserSettings>) {
      const { data, error } = await supabaseAdmin.from('user_settings').insert(settings).select().single();
      if (error) throw error;
      return data as UserSettings;
    },

    async update(userId: string, updates: Partial<UserSettings>) {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as UserSettings;
    },

    async upsert(settings: Partial<UserSettings>) {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data as UserSettings;
    }
  }
};
