import { supabaseAdmin } from '@/lib/supabase/admin';
import { finalizeMeetingProposal } from '@/app/actions/calendar';
import { redirect } from 'next/navigation';
import { CalendarCheck, Clock, User, CheckCircle2 } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getProposal(id: string) {
    const { data, error } = await supabaseAdmin
        .from('meeting_proposals')
        .select(`
            *,
            leads (
                id,
                contact_email,
                company_name,
                domain
            )
        `)
        .eq('id', id)
        .single();

    return { data, error };
}

async function getUserName(userId: string) {
    const { data } = await supabaseAdmin
        .from('user_settings')
        .select('sending_email')
        .eq('user_id', userId)
        .single();

    // Extract name from email or use default
    const email = data?.sending_email || 'Your Contact';
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return name;
}

export default async function MeetingConfirmationPage({ params }: PageProps) {
    const { id } = await params;
    const { data: proposal, error } = await getProposal(id);

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Meeting Not Found</h1>
                    <p className="text-slate-400">This meeting invitation is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    const lead = proposal.leads;
    const userName = await getUserName(proposal.user_id);
    const meetingDate = new Date(proposal.proposed_start_time);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    async function handleConfirmation(formData: FormData) {
        'use server';
        const proposalId = formData.get('proposalId') as string;
        await finalizeMeetingProposal(proposalId);
        redirect(`/meet/confirm/${proposalId}?confirmed=true`);
    }

    const isConfirmed = proposal.status === 'ACCEPTED';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Meeting Invitation
                        </h1>
                        <p className="text-indigo-100 text-lg">
                            {userName} would like to meet with you
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Meeting Details */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CalendarCheck className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Date</h3>
                                    <p className="text-slate-300">{formattedDate}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Time</h3>
                                    <p className="text-slate-300">{formattedTime}</p>
                                    <p className="text-sm text-slate-400 mt-1">Duration: {proposal.duration_minutes} minutes</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">With</h3>
                                    <p className="text-slate-300">{userName}</p>
                                    <p className="text-sm text-slate-400 mt-1">{lead.company_name || lead.domain}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {isConfirmed ? (
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 text-center">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Meeting Confirmed! 🎉</h3>
                                <p className="text-slate-300">
                                    A calendar invitation has been sent to your email. We look forward to speaking with you!
                                </p>
                            </div>
                        ) : (
                            <form action={handleConfirmation} className="space-y-4">
                                <input type="hidden" name="proposalId" value={id} />
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                                >
                                    <CalendarCheck className="w-6 h-6" />
                                    Confirm Booking
                                </button>
                                <p className="text-sm text-slate-400 text-center">
                                    By confirming, you'll receive a calendar invitation at {lead.contact_email}
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-slate-400 text-sm">
                        Powered by <span className="text-white font-semibold">Smart Scheduler</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
