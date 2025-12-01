'use client';

import { X, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead } from './types';

interface EmailDraftDrawerProps {
  lead: Lead;
  editedTo: string;
  editedSubject: string;
  editedBody: string;
  isEditing: boolean;
  isSending: boolean;
  isRegenerating: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
  onToChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSendEmail: () => void;
  onRegenerateEmail: () => void;
}

export default function EmailDraftDrawer({
  lead,
  editedTo,
  editedSubject,
  editedBody,
  isEditing,
  isSending,
  isRegenerating,
  message,
  onClose,
  onToChange,
  onSubjectChange,
  onBodyChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSendEmail,
  onRegenerateEmail,
}: EmailDraftDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-end bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-[500px] h-full glass-card rounded-l-2xl p-8 shadow-2xl animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Email Draft</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
            {isEditing ? (
              <input
                type="email"
                value={editedTo}
                onChange={(e) => onToChange(e.target.value)}
                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
              />
            ) : (
              <div
                onClick={onStartEdit}
                className="mt-2 cursor-text hover:bg-slate-800/30 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-white/10"
              >
                <p className="text-white font-semibold">{lead.company}</p>
                <p className="text-sm text-slate-400">{editedTo}</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
              />
            ) : (
              <p
                onClick={onStartEdit}
                className="text-white mt-2 p-4 bg-slate-800/30 border border-white/5 rounded-xl cursor-text hover:border-white/10 transition-all duration-200"
              >
                {editedSubject || 'No subject'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => onBodyChange(e.target.value)}
                rows={12}
                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none transition-all duration-200"
              />
            ) : (
              <div
                onClick={onStartEdit}
                className="mt-2 p-4 bg-slate-800/30 border border-white/5 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto cursor-text hover:border-white/10 transition-all duration-200 scrollbar-hide"
              >
                {editedBody || 'Draft pending...'}
              </div>
            )}
          </div>

          {message && (
            <div className={cn(
              "p-4 rounded-xl text-sm font-medium flex items-center gap-2",
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            )}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={onSaveEdit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25"
                >
                  Save Changes
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-3 bg-slate-800/50 text-slate-300 rounded-xl font-semibold hover:bg-slate-700/50 border border-white/10 transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSendEmail}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                  {isSending ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  onClick={onRegenerateEmail}
                  disabled={isRegenerating}
                  className="px-4 py-3 bg-slate-800/50 text-slate-300 rounded-xl font-semibold hover:bg-slate-700/50 disabled:opacity-50 border border-white/10 transition-all duration-200"
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
