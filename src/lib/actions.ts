
'use server';
import { smartBuySuggestion as smartBuySuggestionFlow, SmartBuySuggestionInput, SmartBuySuggestionOutput } from '@/ai/flows/smart-buy-suggestion';

export async function getSmartBuySuggestion(input: SmartBuySuggestionInput): Promise<SmartBuySuggestionOutput> {
    try {
        const result = await smartBuySuggestionFlow(input);
        return result;
    } catch (error) {
        console.error("Error getting smart buy suggestion:", error);
        return { suggestion: "Sorry, I couldn't generate a suggestion at this time. Please check your input data or try again later." };
    }
}
