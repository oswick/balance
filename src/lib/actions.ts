
'use server';

import type { SmartBuySuggestionInput, SmartBuySuggestionOutput } from '@/ai/flows/smart-buy-suggestion';

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
