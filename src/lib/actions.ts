
'use server';

import type { SmartBuySuggestionInput, SmartBuySuggestionOutput } from '@/ai/flows/smart-buy-suggestion';
import { createServerClient } from './supabase/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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
    const tablesToDeleteFrom = ['sales', 'purchases', 'expenses', 'products', 'suppliers'];

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
