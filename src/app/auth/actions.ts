'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
    const supabase = await createServerClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

export async function signup(formData: FormData) {
    const supabase = await createServerClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                full_name: formData.get('fullName') as string,
            },
        },
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

export async function logout() {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/login');
}
