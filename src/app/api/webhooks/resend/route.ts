import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { analyzeReplySentiment } from '@/lib/services/gemini-agent';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        if (payload.type !== 'email.received') {
            return NextResponse.json({ message: 'Ignored event type' }, { status: 200 });
        }

        const { to, from, subject, email_id } = payload.data;
        const recipient = Array.isArray(to) ? to[0] : to;
        const sender = from;

        let body = '';

        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const { data: emailData, error: emailError } = await resend.emails.receiving.get(email_id);

                if (emailError) {
                    if (attempt < maxRetries) {
                        await new Promise(r => setTimeout(r, 1000 * attempt));
                        continue;
                    }
                } else {
                    body = (emailData as any).text || (emailData as any).html || '';
                    break;
                }
            } catch (fetchError: any) {
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                    continue;
                }
            }
        }

        if (!body) {
            body = `(Email body unavailable - Subject: ${subject})`;
        }

        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('user_settings')
            .select('user_id')
            .or(`receiving_email.eq.${recipient},email_alias.eq.${recipient}`)
            .maybeSingle();

        if (settingsError || !settings) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = settings.user_id;

        const parts = sender.split('@');
        const senderDomain = parts.length > 1 ? parts[1] : sender;

        let { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('id, campaign_id, company_name, domain, contact_email, campaigns!inner(user_id)')
            .eq('campaigns.user_id', userId)
            .ilike('contact_email', sender)
            .limit(1)
            .maybeSingle();

        if (!lead && !leadError) {
            const domainResult = await supabaseAdmin
                .from('leads')
                .select('id, campaign_id, company_name, domain, contact_email, campaigns!inner(user_id)')
                .eq('campaigns.user_id', userId)
                .ilike('domain', `%${senderDomain}%`)
                .limit(1)
                .maybeSingle();
            
            lead = domainResult.data;
            leadError = domainResult.error;
        }

        if (leadError) {
            return NextResponse.json({ message: 'Database error' }, { status: 500 });
        }

        if (!lead) {
            return NextResponse.json({ message: 'Lead not found, email logged' }, { status: 200 });
        }

        const sentiment = await analyzeReplySentiment(body);

        const { error: updateError } = await supabaseAdmin
            .from('leads')
            .update({
                status: 'REPLIED',
                contact_email: sender,
                updated_at: new Date().toISOString(),
                reply_subject: subject || 'No subject',
                reply_body: body,
                last_reply_text: body.substring(0, 200),
                last_reply_date: new Date().toISOString(),
            })
            .eq('id', lead.id);

        if (updateError) {
            return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        const { error: insertError } = await supabaseAdmin
            .from('lead_emails')
            .insert({
                lead_id: lead.id,
                sender_type: 'lead',
                subject: subject,
                body: body,
            });

        return NextResponse.json({ success: true, leadId: lead.id, sentiment }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}