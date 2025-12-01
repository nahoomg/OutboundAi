'use client';

import { Send, Sparkles, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import MeetingScheduler from './MeetingScheduler';

interface ReplyComposerProps {
  replyMessage: string;
  setReplyMessage: (msg: string) => void;
  isSending: boolean;
  isSuggesting: boolean;
  showScheduler: boolean;
  selectedDate: string;
  selectedTime: string;
  duration: number;
  isCreatingProposal: boolean;
  hasLeadMessages: boolean;
  onSendReply: () => void;
  onAiSuggest: () => void;
  onToggleScheduler: () => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  onCreateMeeting: () => void;
}

export default function ReplyComposer({
  replyMessage,
  setReplyMessage,
  isSending,
  isSuggesting,
  showScheduler,
  selectedDate,
  selectedTime,
  duration,
  isCreatingProposal,
  hasLeadMessages,
  onSendReply,
  onAiSuggest,
  onToggleScheduler,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onCreateMeeting,
}: ReplyComposerProps) {
  return (
    <div className="sticky bottom-0 bg-slate-900/95 border-t border-white/5 p-4 backdrop-blur-md z-10">
      {showScheduler && (
        <MeetingScheduler
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          duration={duration}
          isCreating={isCreatingProposal}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          onDurationChange={onDurationChange}
          onCreate={onCreateMeeting}
          onClose={onToggleScheduler}
        />
      )}

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply... (Cmd/Ctrl + Enter to send)"
            rows={3}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none pr-14 transition-all duration-200"
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSendReply();
              }
            }}
          />
          <button
            onClick={onAiSuggest}
            disabled={isSuggesting || !hasLeadMessages}
            className="absolute right-3 bottom-3 p-2.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate AI Reply Suggestion"
          >
            {isSuggesting ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
          </button>
        </div>
        <button
          onClick={onSendReply}
          disabled={!replyMessage.trim() || isSending}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 h-full shadow-lg shadow-indigo-500/25"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send size={16} />
              Send
            </>
          )}
        </button>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleScheduler}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
              showScheduler
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-white/10"
            )}
          >
            <CalendarPlus size={14} />
            Schedule
          </button>
          <p className="text-xs text-slate-500 font-medium">{replyMessage.length} characters</p>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <Sparkles size={12} className="text-indigo-400" /> AI suggestions available
        </p>
      </div>
    </div>
  );
}
