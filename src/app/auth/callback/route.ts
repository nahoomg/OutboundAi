import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function generateEmailAlias(email: string): string {
    const username = email.split('@')[0].toLowerCase();
    // Clean username to only allow alphanumeric and dots
    const cleanUsername = username.replace(/[^a-z0-9.]/g, '');
    return `${cleanUsername}@nahom.tech`;
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
        }

        const session = data.session;
        const user = data.user;

        if (session && user) {
            const providerRefreshToken = session.provider_refresh_token;
            const providerToken = session.provider_token;

            // Get existing settings to check if alias already exists
            const { data: existingSettings } = await supabase
                .from('user_settings')
                .select('email_alias, sending_email')
                .eq('user_id', user.id)
                .single();

            // Generate email alias from user's email if not already set
            let emailAlias = existingSettings?.email_alias;
            let sendingEmail = existingSettings?.sending_email;

            if (!emailAlias || emailAlias.startsWith('user_')) {
                const userEmail = user.email || '';
                const proposedAlias = generateEmailAlias(userEmail);
                
                // Check if this alias is already taken by another user
                const { data: existingAlias } = await supabase
                    .from('user_settings')
                    .select('user_id')
                    .eq('email_alias', proposedAlias)
                    .neq('user_id', user.id)
                    .single();

                if (!existingAlias) {
                    emailAlias = proposedAlias;
                } else {
                    emailAlias = `${userEmail.split('@')[0]}_${user.id.substring(0, 4)}@nahom.tech`;
                }
            }

            // Set sending_email to user's actual email if not set
            if (!sendingEmail || sendingEmail === 'unknown') {
                sendingEmail = user.email || '';
            }

            const settingsToUpsert: Record<string, any> = {
                user_id: user.id,
                email_alias: emailAlias,
                sending_email: sendingEmail,
                updated_at: new Date().toISOString()
            };

            if (providerRefreshToken) {
                settingsToUpsert.google_refresh_token = providerRefreshToken;
            }

            const { error: upsertError } = await supabase
                .from('user_settings')
                .upsert(settingsToUpsert, {
                    onConflict: 'user_id'
                });
        }
    }

    const dashboardUrl = `${origin}/dashboard`;
    return NextResponse.redirect(dashboardUrl);
}
