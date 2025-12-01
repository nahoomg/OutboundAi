'use client';

import React, { useState, useEffect } from 'react';
import { User, Zap, Settings, Target, Bell, Shield, AlertTriangle, CheckCircle2, X, Mail, Calendar, FileText, Sparkles, Send, Info, Loader2, AtSign } from 'lucide-react';
import { cn } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'preferences'>('profile');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [company, setCompany] = useState('');
  const [emailAlias, setEmailAlias] = useState('');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setCompany(user.user_metadata?.company || '');
        setUserId(user.id);

        // Fetch email alias from user_settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('email_alias')
          .eq('user_id', user.id)
          .single();

        if (settings?.email_alias) {
          // Extract just the username part (before @nahom.tech)
          const aliasPart = settings.email_alias.split('@')[0];
          setEmailAlias(aliasPart);
        }
      }
    }
    fetchUserData();
  }, []);

  const validateAndCheckAlias = async (alias: string): Promise<boolean> => {
    setAliasError(null);

    // Validate format - alphanumeric, dots, underscores only
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (cleanAlias !== alias.toLowerCase()) {
      setAliasError('Alias can only contain letters, numbers, dots, and underscores');
      return false;
    }

    if (alias.length < 3) {
      setAliasError('Alias must be at least 3 characters');
      return false;
    }

    // Check uniqueness
    const fullAlias = `${alias}@nahom.tech`;
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('email_alias', fullAlias)
      .neq('user_id', userId)
      .single();

    if (existing) {
      setAliasError('This alias is already taken. Please choose another.');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setAliasError(null);

    try {
      // Validate alias if changed
      if (emailAlias) {
        const isValid = await validateAndCheckAlias(emailAlias);
        if (!isValid) {
          setIsSaving(false);
          return;
        }
      }

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: userName, company }
      });

      if (authError) {
        setSaveMessage({ type: 'error', text: 'Failed to save profile changes' });
        setIsSaving(false);
        return;
      }

      // Update email alias in user_settings
      if (emailAlias && userId) {
        const fullAlias = `${emailAlias.toLowerCase()}@nahom.tech`;
        const { error: settingsError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            email_alias: fullAlias,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (settingsError) {
          setSaveMessage({ type: 'error', text: 'Failed to save email alias' });
          setIsSaving(false);
          return;
        }
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
        {activeTab === 'profile' && (
          <ProfileTab
            userName={userName}
            setUserName={setUserName}
            email={email}
            company={company}
            setCompany={setCompany}
            emailAlias={emailAlias}
            setEmailAlias={setEmailAlias}
            aliasError={aliasError}
            isSaving={isSaving}
            saveMessage={saveMessage}
            onSave={handleSaveProfile}
          />
        )}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
      </div>
    </div>
  );
}

function SettingsSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: any) => void }) {
  const tabs = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'integrations', icon: <Zap size={18} />, label: 'Integrations' },
    { id: 'preferences', icon: <Settings size={18} />, label: 'Preferences' }
  ];

  return (
    <div className="w-full lg:w-64 glass-card rounded-2xl p-5 h-fit">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Settings</h3>
      <nav className="space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === tab.id ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ProfileTab({ userName, setUserName, email, company, setCompany, emailAlias, setEmailAlias, aliasError, isSaving, saveMessage, onSave }: any) {
  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Profile Information</h3>
            <p className="text-xs text-slate-500">Manage your personal details</p>
          </div>
        </div>
        <div className="space-y-5">
          <InputField label="Full Name" value={userName} onChange={setUserName} placeholder="Enter your full name" />
          <InputField label="Email Address" value={email} disabled helpText="Email is linked to your Google account" />
          <InputField label="Company" value={company} onChange={setCompany} placeholder="Your Company Name" />

          {/* Email Alias Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Sending Email Alias
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={emailAlias}
                  onChange={(e) => setEmailAlias(e.target.value.toLowerCase())}
                  placeholder="your-name"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 transition-all duration-200 bg-slate-800/50 border focus:outline-none focus:ring-2",
                    aliasError 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
                  )}
                />
              </div>
              <span className="text-slate-400 font-medium whitespace-nowrap">@nahom.tech</span>
            </div>
            {aliasError ? (
              <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                <X size={10} />
                {aliasError}
              </p>
            ) : (
              <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                <AtSign size={10} />
                This is the email address that will appear when you send outbound emails
              </p>
            )}
          </div>

          {saveMessage && (
            <div className={cn(
              "p-4 rounded-xl text-sm font-medium flex items-center gap-2",
              saveMessage.type === 'success' && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
              saveMessage.type === 'error' && "bg-red-500/10 border border-red-500/20 text-red-400"
            )}>
              {saveMessage.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
              {saveMessage.text}
            </div>
          )}

          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Security</h3>
            <p className="text-xs text-slate-500">Manage your password</p>
          </div>
        </div>
        <div className="space-y-5">
          <InputField label="Current Password" type="password" placeholder="••••••••" color="emerald" />
          <InputField label="New Password" type="password" placeholder="••••••••" color="emerald" />
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20">
            Update Password
          </button>
        </div>
      </div>
    </>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: 'Google Workspace', desc: 'Gmail & Calendar integration', icon: <Mail size={28} className="text-white" />, gradient: 'from-red-500 to-orange-500', status: 'Connected', features: ['Inbox synchronization enabled', 'Calendar booking active'] },
    { name: 'Google Gemini', desc: 'AI-powered lead qualification', icon: <Sparkles size={28} className="text-white" />, gradient: 'from-indigo-500 to-purple-500', status: 'Active', note: '⚡ Using Gemini 2.5 Flash for intelligent lead analysis and personalized email generation' },
    { name: 'Resend', desc: 'Email delivery service', icon: <Send size={28} className="text-white" />, gradient: 'from-blue-500 to-cyan-500', status: 'Connected', note: '✉️ Configured for sending high-deliverability outbound emails' }
  ];

  return (
    <div className="space-y-4">
      {integrations.map(int => (
        <div key={int.name} className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", int.gradient)}>
                {int.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{int.name}</h3>
                <p className="text-sm text-slate-500">{int.desc}</p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {int.status}
            </span>
          </div>
          {int.features && (
            <div className="space-y-2.5 text-sm text-slate-400 mb-5 p-4 bg-slate-800/30 rounded-xl border border-white/5">
              {int.features.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
          {int.note && (
            <p className="text-sm text-slate-400 p-4 bg-slate-800/30 rounded-xl border border-white/5">{int.note}</p>
          )}
          {int.name === 'Google Workspace' && (
            <button className="mt-5 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20">
              Reconnect
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Campaign Defaults</h3>
            <p className="text-xs text-slate-500">Default settings for new campaigns</p>
          </div>
        </div>
        <div className="space-y-5">
          <InputField label="Max Leads per Campaign" type="number" defaultValue={30} />
          <InputField label="Email Follow-up Delay (days)" type="number" defaultValue={3} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            <p className="text-xs text-slate-500">Manage email notifications</p>
          </div>
        </div>
        <div className="space-y-4">
          <ToggleOption icon={<Mail size={16} className="text-indigo-400" />} label="Email when lead replies" defaultChecked />
          <ToggleOption icon={<Calendar size={16} className="text-emerald-400" />} label="Email when meeting booked" defaultChecked />
          <ToggleOption icon={<FileText size={16} className="text-amber-400" />} label="Daily campaign summary" />
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
            <p className="text-xs text-red-400/60">Irreversible actions</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-red-500/10">
          <div>
            <div className="text-sm font-semibold text-white mb-1">Delete Account</div>
            <div className="text-xs text-slate-500">Permanently delete your account and all data</div>
          </div>
          <button className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', disabled = false, helpText, defaultValue, color = 'indigo' }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 transition-all duration-200",
          disabled ? "bg-slate-800/30 border border-white/5 text-slate-500 cursor-not-allowed" : `bg-slate-800/50 border border-white/10 focus:outline-none focus:border-${color}-500 focus:ring-2 focus:ring-${color}-500/20`
        )}
      />
      {helpText && (
        <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
          <Info size={10} />
          {helpText}
        </p>
      )}
    </div>
  );
}

function ToggleOption({ icon, label, defaultChecked }: { icon: React.ReactNode; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200">
      <div className="flex items-center gap-3">
        {icon}
        <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">{label}</div>
      </div>
      <div className="relative">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600"></div>
      </div>
    </label>
  );
}
