'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Mail, Clock, ChevronRight, X, Info, Loader2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { getAppointments } from '@/app/actions/calendar';

interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail?: string;
  date: string;
  time?: string;
  meetingLink?: string;
  meetLink?: string;
  status: string;
  domain?: string;
  title?: string;
  attendeeName?: string;
  attendee?: string;
  notes?: string;
}

interface AppointmentsViewProps {
  userId: string;
}

export default function AppointmentsView({ userId }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const result = await getAppointments(userId);
        if (result.success && result.appointments) {
          setAppointments(result.appointments);
        }
      } catch (error) {} finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
    const interval = setInterval(fetchAppointments, 60000);
    
    const handleAppointmentCreated = () => fetchAppointments();
    window.addEventListener('appointmentCreated', handleAppointmentCreated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentCreated', handleAppointmentCreated);
    };
  }, [userId]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const selectedDayAppointments = appointments.filter(apt =>
    new Date(apt.date).toDateString() === selectedDate.toDateString()
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <p className="text-slate-400 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-fade-in">
      <div className="flex-1 flex flex-col gap-4">
        <CalendarHeader
          monthName={monthName}
          upcomingCount={upcomingAppointments.length}
          view={view}
          setView={setView}
          onPrev={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
          onNext={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
          onToday={() => setSelectedDate(new Date())}
        />
        <CalendarGrid
          daysInMonth={daysInMonth}
          startingDayOfWeek={startingDayOfWeek}
          selectedDate={selectedDate}
          appointments={appointments}
          onSelectDate={setSelectedDate}
          onSelectAppointment={setSelectedAppointment}
        />
      </div>

      <AppointmentsSidebar
        selectedDate={selectedDate}
        selectedDayAppointments={selectedDayAppointments}
        upcomingAppointments={upcomingAppointments}
        onSelectAppointment={setSelectedAppointment}
      />

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

function CalendarHeader({ monthName, upcomingCount, view, setView, onPrev, onNext, onToday }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{monthName}</h2>
          <p className="text-sm text-slate-400">{upcomingCount} upcoming {upcomingCount === 1 ? 'meeting' : 'meetings'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/5">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 capitalize",
                  view === v ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onPrev} className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl text-xs transition-all duration-200 flex items-center gap-1 border border-white/5">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <button onClick={onToday} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all duration-200">
              Today
            </button>
            <button onClick={onNext} className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl text-xs transition-all duration-200 flex items-center gap-1 border border-white/5">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({ daysInMonth, startingDayOfWeek, selectedDate, appointments, onSelectDate, onSelectAppointment }: any) {
  return (
    <div className="flex-1 glass-card rounded-2xl p-4 overflow-auto">
      <div className="grid grid-cols-7 gap-1 min-w-[600px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day}</div>
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square min-h-[70px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const dayAppointments = appointments.filter((apt: any) => new Date(apt.date).toDateString() === date.toDateString());
          const isPast = date < new Date() && !isToday;

          return (
            <div
              key={day}
              onClick={() => onSelectDate(date)}
              className={cn(
                "aspect-square min-h-[70px] p-1.5 rounded-xl cursor-pointer transition-all duration-200 border",
                isSelected && "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20",
                !isSelected && isToday && "border-emerald-500/50 bg-emerald-500/10",
                !isSelected && !isToday && dayAppointments.length > 0 && "border-purple-500/30 bg-purple-500/5",
                !isSelected && !isToday && dayAppointments.length === 0 && "border-transparent bg-slate-800/20 hover:bg-slate-800/40 hover:border-white/10",
                isPast && "opacity-50"
              )}
            >
              <div className="flex flex-col h-full">
                <span className={cn(
                  "text-xs font-bold mb-1 w-6 h-6 rounded-full flex items-center justify-center",
                  isToday && "bg-emerald-500 text-white",
                  isSelected && !isToday && "bg-indigo-500 text-white",
                  !isToday && !isSelected && "text-slate-400"
                )}>
                  {day}
                </span>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {dayAppointments.slice(0, 2).map((apt: any) => (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt); }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white truncate font-medium hover:opacity-80 transition-opacity"
                    >
                      {apt.title?.slice(0, 12) || 'Meeting'}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-[9px] text-indigo-400 font-medium">+{dayAppointments.length - 2}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentsSidebar({ selectedDate, selectedDayAppointments, upcomingAppointments, onSelectAppointment }: any) {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-4">
      {selectedDayAppointments.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {selectedDayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => onSelectAppointment(apt)}
                className="p-3 bg-slate-800/30 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{apt.title || apt.leadName}</div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                    apt.status === 'confirmed' || apt.status === 'accepted' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {apt.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {apt.time || new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 glass-card rounded-2xl p-5 overflow-hidden flex flex-col">
        <h3 className="text-sm font-bold text-white mb-4 shrink-0">Upcoming Meetings</h3>

        {upcomingAppointments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No upcoming meetings</p>
            <p className="text-slate-600 text-xs mt-1">Booked meetings will appear here</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            {upcomingAppointments.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => onSelectAppointment(apt)}
                className="p-4 bg-slate-800/30 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">{apt.title || apt.leadName}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                    (apt.status === 'confirmed' || apt.status === 'accepted') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  )}>
                    {apt.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={10} className="text-indigo-400" />
                    <span>{new Date(apt.date).toLocaleDateString()} • {apt.time || new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {(apt.attendeeName || apt.leadEmail) && (
                    <div className="flex items-center gap-2">
                      <Mail size={10} className="text-purple-400" />
                      <span>{apt.attendeeName || apt.leadEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-6 max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{appointment.title || appointment.leadName}</h3>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase inline-block border",
              (appointment.status === 'confirmed' || appointment.status === 'accepted') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            )}>
              {appointment.status === 'confirmed' || appointment.status === 'accepted' ? '✓ Confirmed' : '⏱ Pending'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-white/5">
            <Calendar size={18} className="text-indigo-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white">
                {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {appointment.time || new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>

          {(appointment.attendeeName || appointment.leadEmail || appointment.attendee) && (
            <div className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-white/5">
              <Mail size={18} className="text-emerald-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white">{appointment.attendeeName || appointment.leadName}</div>
                <div className="text-xs text-slate-400 mt-1">{appointment.attendee || appointment.leadEmail}</div>
              </div>
            </div>
          )}

          {appointment.notes && (
            <div className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-white/5">
              <Info size={18} className="text-purple-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white mb-1">Notes</div>
                <div className="text-xs text-slate-400">{appointment.notes}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {(appointment.meetLink || appointment.meetingLink) && (
            <a
              href={appointment.meetLink || appointment.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 text-center"
            >
              Join Meeting
            </a>
          )}
          <button className="px-4 py-3 border border-white/10 hover:bg-white/5 text-slate-300 text-sm font-semibold rounded-xl transition-all duration-200">
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
