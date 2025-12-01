'use client';

import { CalendarPlus } from 'lucide-react';

interface MeetingSchedulerProps {
  selectedDate: string;
  selectedTime: string;
  duration: number;
  isCreating: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  onCreate: () => void;
  onClose: () => void;
}

export default function MeetingScheduler({
  selectedDate,
  selectedTime,
  duration,
  isCreating,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onCreate,
  onClose,
}: MeetingSchedulerProps) {
  return (
    <div className="mb-4 p-5 bg-slate-800/30 border border-indigo-500/20 rounded-2xl animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <CalendarPlus size={14} className="text-white" />
          </div>
          Schedule Meeting
        </h4>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
        <select
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all duration-200"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </div>

      <button
        onClick={onCreate}
        disabled={!selectedDate || !selectedTime || isCreating}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
      >
        {isCreating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <CalendarPlus size={16} />
            Create Meeting
          </>
        )}
      </button>
    </div>
  );
}
