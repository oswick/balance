'use server';

import type { SmartBuySuggestionInput, SmartBuySuggestionOutput } from '@/ai/flows/smart-buy-suggestion';
import { createServerClient } from './supabase/server';
import { cookies } from 'next/headers';

export async function getSmartBuySuggestion(input: SmartBuySuggestionInput): Promise<SmartBuySuggestionOutput> {
    try {
        // Dynamically import the flow only when the function is called on the server
        const { smartBuySuggestion } = await import('@/ai/flows/smart-buy-suggestion');
        const result = await smartBuySuggestion(input);
        return result;
    } catch (error) {
        console.error("Error getting smart buy suggestion:", error);
        return { suggestion: "Sorry, I couldn't generate a suggestion at this time. Please check your input data or try again later." };
    }
}

export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'User not authenticated or could not be fetched.' };
    }

    try {
        // Usar la función de Supabase en lugar del service role key
        const { data, error } = await supabase
            .rpc('delete_user_account');

        if (error) {
            console.error('Error calling delete_user_account function:', error);
            return { success: false, error: error.message || 'Failed to delete account.' };
        }

        // La función retorna un JSON con success y error/message
        if (data && data.success) {
            return { success: true };
        } else {
            return { success: false, error: data?.error || 'Unknown error occurred.' };
        }
    } catch (error: any) {
        console.error('Exception in deleteUserAccount:', error);
        return { success: false, error: error.message || 'Failed to delete account.' };
    }
}

export async function deleteUserDataOnly(): Promise<{ success: boolean; error?: string }> {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'User not authenticated or could not be fetched.' };
    }

    try {
        // Usar la función que solo elimina datos, no la cuenta de auth
        const { data, error } = await supabase
            .rpc('delete_user_data_only');

        if (error) {
            console.error('Error calling delete_user_data_only function:', error);
            return { success: false, error: error.message || 'Failed to delete user data.' };
        }

        if (data && data.success) {
            return { success: true };
        } else {
            return { success: false, error: data?.error || 'Unknown error occurred.' };
        }
    } catch (error: any) {
        console.error('Exception in deleteUserDataOnly:', error);
        return { success: false, error: error.message || 'Failed to delete user data.' };
    }
}

export async function doesUserExist(email: string): Promise<boolean> {
    // Esta función requiere el service role key, así que mantenemos el manejo de error
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Server environment is not configured for this action.');
        return false;
    }

    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(email);
        if (error) {
            if (error.name === 'UserNotFoundError') {
                return false; // User does not exist
            }
            console.error("Error checking if user exists:", error);
            return false; // Treat errors as user not existing to be safe
        }
        return !!data.user;
    } catch (e) {
        console.error("Exception in doesUserExist:", e);
        return false;
    }
}