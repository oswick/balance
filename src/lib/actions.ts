
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
        const { error } = await supabase.rpc('delete_user_account');

        if (error) {
            console.error('Error calling delete_user_account function:', error);
            return { success: false, error: error.message || 'Failed to delete account.' };
        }
        
        return { success: true };

    } catch (error: any) {
        console.error('Exception in deleteUserAccount:', error);
        return { success: false, error: error.message || 'Failed to delete account.' };
    }
}
