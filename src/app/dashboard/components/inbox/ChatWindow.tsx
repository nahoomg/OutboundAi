'use client';

import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { RotateCw, User, Bot, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead, Message } from './types';
import { getInitials } from './utils';
import ReplyComposer from './ReplyComposer';

interface ChatWindowProps {
  lead: Lead | null;
  conversation: Message[];
  replyMessage: string;
  setReplyMessage: (msg: string) => void;
  isSending: boolean;
  isSuggesting: boolean;
  showScheduler: boolean;
  selectedDate: string;
  selectedTime: string;
  duration: number;
  isCreatingProposal: boolean;
  onRefreshConversation: () => void;
  onSendReply: () => void;
  onAiSuggest: () => void;
  onToggleScheduler: () => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  onCreateMeeting: () => void;
}

export default function ChatWindow({
  lead,
  conversation,
  replyMessage,
  setReplyMessage,
  isSending,
  isSuggesting,
  showScheduler,
  selectedDate,
  selectedTime,
  duration,
  isCreatingProposal,
  onRefreshConversation,
  onSendReply,
  onAiSuggest,
  onToggleScheduler,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onCreateMeeting,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!lead) {
    return (
      <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-lg font-bold text-white mb-2">Select a conversation</p>
            <p className="text-sm text-slate-500">Choose a lead from the left to view the conversation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
      <ChatHeader lead={lead} onRefresh={onRefreshConversation} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {conversation.length === 0 ? (
          <div className="text-center text-slate-500 mt-12">
            <p className="font-medium">No messages in this conversation yet</p>
          </div>
        ) : (
          conversation.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ReplyComposer
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        isSending={isSending}
        isSuggesting={isSuggesting}
        showScheduler={showScheduler}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        duration={duration}
        isCreatingProposal={isCreatingProposal}
        hasLeadMessages={conversation.some(m => m.type === 'lead')}
        onSendReply={onSendReply}
        onAiSuggest={onAiSuggest}
        onToggleScheduler={onToggleScheduler}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        onDurationChange={onDurationChange}
        onCreateMeeting={onCreateMeeting}
      />
    </div>
  );
}

function ChatHeader({ lead, onRefresh }: { lead: Lead; onRefresh: () => void }) {
  return (
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
          {getInitials(lead.company_name || lead.domain)}
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{lead.company_name || lead.domain}</h3>
          <p className="text-sm text-slate-500">{lead.contact_email || lead.domain}</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
        title="Refresh conversation"
      >
        <RotateCw size={18} />
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.type === 'agent';

  return (
    <div className={cn('flex gap-3', isAgent ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
        isAgent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25' : 'bg-slate-700'
      )}>
        {isAgent ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
      </div>

      <div className={cn(
        'max-w-2xl rounded-2xl px-5 py-4 shadow-lg',
        isAgent ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-slate-800/80 text-slate-100 border border-white/10'
      )}>
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <span className={cn('font-semibold text-sm', isAgent ? 'text-indigo-100' : 'text-slate-300')}>
            {message.sender}
          </span>
          <span className={cn('text-[10px]', isAgent ? 'text-indigo-200' : 'text-slate-500')}>
            {format(new Date(message.timestamp), 'MMM d, h:mm a')}
          </span>
        </div>

        <div className={cn('text-xs font-medium mb-2 pb-2 border-b', isAgent ? 'text-indigo-100 border-white/20' : 'text-slate-400 border-white/5')}>
          {message.subject}
        </div>

        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</div>
      </div>
    </div>
  );
}
