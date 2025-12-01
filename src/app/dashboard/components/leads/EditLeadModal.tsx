'use client';

import { X } from 'lucide-react';
import { Lead, EditFormData, LeadStatus } from './types';

interface EditLeadModalProps {
  formData: EditFormData;
  onFormChange: (data: EditFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditLeadModal({ formData, onFormChange, onSave, onClose }: EditLeadModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div className="w-[420px] glass-card rounded-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Edit Lead</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <FormField
            label="Company Name"
            value={formData.company}
            onChange={(value) => onFormChange({ ...formData, company: value })}
          />

          <FormField
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(value) => onFormChange({ ...formData, contact_email: value })}
          />

          <FormField
            label="Domain"
            value={formData.domain}
            onChange={(value) => onFormChange({ ...formData, domain: value })}
          />

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => onFormChange({ ...formData, status: e.target.value as LeadStatus })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
            >
              <option value="DISCOVERED">Discovered</option>
              <option value="ANALYZING">Analyzing</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="UNQUALIFIED">Unqualified</option>
              <option value="CONTACTED">Contacted</option>
              <option value="REPLIED">Replied</option>
              <option value="UNREACHABLE">Unreachable</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-800/50 text-slate-300 rounded-xl font-semibold hover:bg-slate-700/50 border border-white/10 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}

function FormField({ label, value, type = 'text', onChange }: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
      />
    </div>
  );
}
