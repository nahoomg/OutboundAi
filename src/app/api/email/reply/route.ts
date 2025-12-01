import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/services/resend';

export async function POST(request: Request) {
    try {
        const { leadId, message } = await request.json();

        // Validate input
        if (!leadId || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: leadId and message' },
                { status: 400 }
            );
        }

        // Fetch lead details
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Fetch user settings to get the email alias and sending email
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('user_settings')
            .select('email_alias, sending_email')
            .eq('user_id', lead.user_id)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'User settings not found' },
                { status: 404 }
            );
        }

        const fromEmail = settings.email_alias || 'noreply@example.com';
        const toEmail = lead.contact_email || `${lead.domain}`;
        const subject = lead.reply_subject ? `Re: ${lead.reply_subject}` : `Re: Your inquiry`;

        // Get sender display name from user's profile (full_name in user_metadata)
        let senderName: string | undefined;
        
        try {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(lead.user_id);
            senderName = user?.user_metadata?.full_name;
        } catch (error) {
            // Could not fetch user profile, will use fallback
        }
        
        // Fallback: extract name from email if no profile name
        if (!senderName) {
            const sendingEmail = settings.sending_email;
            if (sendingEmail && sendingEmail !== 'unknown' && sendingEmail.includes('@')) {
                const emailUsername = sendingEmail.split('@')[0];
                senderName = emailUsername
                    .replace(/[._]/g, ' ')
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            } else if (fromEmail) {
                const aliasUsername = fromEmail.split('@')[0];
                senderName = aliasUsername.charAt(0).toUpperCase() + aliasUsername.slice(1);
            }
        }

        // Send email via Resend
        const emailResult = await sendEmail({
            to: toEmail,
            from: fromEmail,
            fromName: senderName,
            subject,
            body: message,
            replyTo: fromEmail,
        });

        if (!emailResult.success) {
            return NextResponse.json(
                { error: emailResult.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        // Save to lead_emails table for history
        const { data: insertedEmail, error: insertError } = await supabaseAdmin
            .from('lead_emails')
            .insert({
                lead_id: leadId,
                sender_type: 'agent',
                subject: subject,
                body: message,
            })
            .select()
            .single();

        if (insertError) {
            // We don't fail the request since the email was sent
        }

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully',
            email: insertedEmail
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
