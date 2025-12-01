'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);
    const hasProcessed = useRef(false); // Prevent double processing

    // Ensure we're on the client
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || hasProcessed.current) {
            return;
        }

        console.log('[Auth Handler] Running on client-side');
        console.log('[Auth Handler] Current URL:', window.location.href);

        const supabase = createClient();

        // Check for authorization code in URL (PKCE flow - preferred)
        const code = searchParams.get('code');
        if (code) {
            hasProcessed.current = true; // Mark as processed immediately
            console.log('[Auth Handler] 🔑 Authorization code detected!');
            console.log('[Auth Handler] 🔄 Exchanging code for session...');

            supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
                if (error) {
                    console.error('[Auth Handler] ❌ Error exchanging code:', error);
                    console.error('[Auth Handler] Error details:', error.message);

                    // If code is invalid/expired, redirect to login
                    if (error.message?.includes('invalid') || error.message?.includes('expired')) {
                        console.log('[Auth Handler] Code invalid, redirecting to login...');
                        window.location.href = '/login';
                    }
                    return;
                }

                console.log('[Auth Handler] ✅ Session created successfully!');
                console.log('[Auth Handler] User:', data.user?.email);
                console.log('[Auth Handler] Access token:', data.session?.access_token ? 'present' : 'missing');

                // Verify session is actually stored
                const { data: sessionCheck } = await supabase.auth.getSession();
                console.log('[Auth Handler] Session verification:', sessionCheck.session ? 'OK ✅' : 'FAILED ❌');

                if (!sessionCheck.session) {
                    console.error('[Auth Handler] ❌ Session not stored properly!');
                    window.location.href = '/login';
                    return;
                }

                console.log('[Auth Handler] 🚀 Redirecting to dashboard in 1 second...');

                // Wait for cookies to be set
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            }).catch(err => {
                console.error('[Auth Handler] ❌ Exception:', err);
                window.location.href = '/login';
            });
            return;
        }

        // Fallback: Check for tokens in hash fragment (implicit flow)
        const hash = window.location.hash;
        if (hash) {
            hasProcessed.current = true;
            console.log('[Auth Handler] Hash fragment detected (implicit flow)');

            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
                console.log('[Auth Handler] 🔄 Setting session with tokens...');

                supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                }).then(({ data, error }) => {
                    if (error) {
                        console.error('[Auth Handler] ❌ Error setting session:', error);
                        window.location.href = '/login';
                        return;
                    }

                    console.log('[Auth Handler] ✅ Session set successfully!');
                    console.log('[Auth Handler] User:', data.user?.email);
                    console.log('[Auth Handler] 🚀 Redirecting to dashboard...');

                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                }).catch(err => {
                    console.error('[Auth Handler] ❌ Exception:', err);
                    window.location.href = '/login';
                });
            }
        }
    }, [isClient, searchParams, router]);

    return null; // This component doesn't render anything
}
