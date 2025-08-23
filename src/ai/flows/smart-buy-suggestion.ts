'use server';

/**
 * @fileOverview AI-driven suggestions on optimal product purchase timings and quantities, leveraging historical data on supplier information and product performance.
 *
 * - smartBuySuggestion - A function that suggests optimal product purchase timings and quantities.
 * - SmartBuySuggestionInput - The input type for the smartBuySuggestion function.
 * - SmartBuySuggestionOutput - The return type for the smartBuySuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartBuySuggestionInputSchema = z.object({
  dailySales: z.string().describe('Daily sales figures.'),
  expenses: z.string().describe('Expenses by category and date.'),
  productPurchases: z.string().describe('Product purchases, supplier, and cost details.'),
  productCatalog: z.string().describe('Product information with purchase and selling prices.'),
  supplierInfo: z.string().describe('Supplier contacts, product types, and purchase days.'),
});

export type SmartBuySuggestionInput = z.infer<typeof SmartBuySuggestionInputSchema>;

const SmartBuySuggestionOutputSchema = z.object({
  suggestion: z.string().describe('AI-driven suggestions on optimal product purchase timings and quantities.'),
});

export type SmartBuySuggestionOutput = z.infer<typeof SmartBuySuggestionOutputSchema>;

export async function smartBuySuggestion(input: SmartBuySuggestionInput): Promise<SmartBuySuggestionOutput> {
  return smartBuySuggestionFlow(input);
}

const smartBuySuggestionPrompt = ai.definePrompt({
  name: 'smartBuySuggestionPrompt',
  input: {schema: SmartBuySuggestionInputSchema},
  output: {schema: SmartBuySuggestionOutputSchema},
  prompt: `As a business owner, I want to be provided with AI-driven suggestions on optimal product purchase timings and quantities, leveraging historical data on supplier information and product performance, so I can maximize my profitability.

You have access to the following data:

Daily Sales: {{{dailySales}}}
Expenses: {{{expenses}}}
Product Purchases: {{{productPurchases}}}
Product Catalog: {{{productCatalog}}}
Supplier Info: {{{supplierInfo}}}

Based on this data, what are your suggestions for optimal product purchase timings and quantities?`,
});

const smartBuySuggestionFlow = ai.defineFlow(
  {
    name: 'smartBuySuggestionFlow',
    inputSchema: SmartBuySuggestionInputSchema,
    outputSchema: SmartBuySuggestionOutputSchema,
  },
  async input => {
    const {output} = await smartBuySuggestionPrompt(input);
    return output!;
  }
);
