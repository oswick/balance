
'use server';

import type { SmartBuySuggestionInput, SmartBuySuggestionOutput } from '@/ai/flows/smart-buy-suggestion';
import { createServerClient } from './supabase/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { BusinessProfile } from '@/types';

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

interface SignUpWithBusinessParams {
    email: string;
    password: string;
    businessProfile: Omit<BusinessProfile, 'id' | 'user_id' | 'created_at'>;
}

export async function signUpWithBusiness(params: SignUpWithBusinessParams): Promise<{ success: boolean; error?: string }> {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
    });

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create user.' };
    }

    const userId = authData.user.id;

    // 2. Create the business profile
    const { error: profileError } = await supabase
        .from('business_profiles')
        .insert({
            user_id: userId,
            ...params.businessProfile
        });

    if (profileError) {
        // Optional: Attempt to clean up the created user if profile creation fails
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin.auth.admin.deleteUser(userId);
        
        return { success: false, error: `Failed to create business profile: ${profileError.message}` };
    }

    return { success: true };
}


export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'User not authenticated or could not be fetched.' };
    }

    // IMPORTANT: Create a Supabase admin client to delete user data
    // This requires the SERVICE_ROLE_KEY which should be stored securely in environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'Server environment is not configured for this action.' };
    }
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // List of tables with user_id foreign key. 
    // This order matters if there are dependencies. Start with tables that are "children".
    const tablesToDeleteFrom = ['sales', 'purchases', 'expenses', 'products', 'suppliers', 'business_profiles'];

    // Delete all records associated with the user
    for (const table of tablesToDeleteFrom) {
        const { error: deleteError } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('user_id', user.id);

        if (deleteError) {
            console.error(`Error deleting from ${table}:`, deleteError);
            return { success: false, error: `Failed to delete data from ${table}.` };
        }
    }

    // After deleting all associated data, delete the user from auth schema
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
        console.error('Error deleting user from auth:', deleteUserError);
        return { success: false, error: 'Failed to delete user account.' };
    }

    return { success: true };
}

export async function doesUserExist(email: string): Promise<boolean> {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Server environment is not configured for this action.');
        return false;
    }
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
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