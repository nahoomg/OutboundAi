import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip auth check if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next();
    }

    // Create response early to set cookies
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    try {
        // Create Supabase client with cookie handling
        const supabase = await createServerClient();

        // Refresh session if expired
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            return response;
        }

        // Protected routes: /dashboard/*
        if (pathname.startsWith('/dashboard')) {
            if (!session) {
                const loginUrl = new URL('/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
        }

        // Auth routes: /login, /signup
        if (pathname === '/login' || pathname === '/signup') {
            if (session) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        return response;
    } catch (error) {
        return response;
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/signup',
    ],
};
