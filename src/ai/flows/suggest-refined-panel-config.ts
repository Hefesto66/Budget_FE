// src/ai/flows/suggest-refined-panel-config.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests refined solar panel configurations.
 *
 * - suggestRefinedPanelConfig - A function that suggests refined panel configurations based on input parameters.
 * - SuggestRefinedPanelConfigInput - The input type for the suggestRefinedPanelConfig function.
 * - SuggestRefinedPanelConfigOutput - The return type for the suggestRefinedPanelConfig function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRefinedPanelConfigInputSchema = z.object({
  energyConsumption: z.number().describe('The average monthly energy consumption in kWh.'),
  energyBill: z.number().describe('The average monthly energy bill in R$.'),
  location: z.string().describe('The location for solar irradiation adjustment.'),
  initialPanelQuantity: z.number().describe('The initially calculated number of solar panels.'),
  panelModel: z.string().describe('The model/power of the solar panels being considered.'),
  totalCostEstimate: z.number().describe('The estimated total cost of the system.'),
  estimatedSavings: z.number().describe('The estimated annual savings in R$.'),
  paybackPeriod: z.number().describe('The payback period for the solar system investment.'),
});
export type SuggestRefinedPanelConfigInput = z.infer<
  typeof SuggestRefinedPanelConfigInputSchema
>;

const SuggestRefinedPanelConfigOutputSchema = z.object({
  refinedPanelQuantity: z
    .number()
    .describe('The refined/suggested number of solar panels.'),
  refinedPanelModel: z
    .string()
    .describe('The refined/suggested model/power of the solar panels.'),
  refinedTotalCostEstimate: z
    .number()
    .describe('The refined estimated total cost of the system.'),
  refinedEstimatedSavings: z
    .number()
    .describe('The refined estimated annual savings.'),
  refinedPaybackPeriod: z
    .number()
    .describe('The refined payback period for the solar system investment.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested refined configuration.'),
});
export type SuggestRefinedPanelConfigOutput = z.infer<
  typeof SuggestRefinedPanelConfigOutputSchema
>;

export async function suggestRefinedPanelConfig(
  input: SuggestRefinedPanelConfigInput
): Promise<SuggestRefinedPanelConfigOutput> {
  return suggestRefinedPanelConfigFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRefinedPanelConfigPrompt',
  input: {schema: SuggestRefinedPanelConfigInputSchema},
  output: {schema: SuggestRefinedPanelConfigOutputSchema},
  prompt: `You are an AI-powered solar energy system advisor. You are provided with the initial solar panel configuration and the parameters related to the system.

You need to analyze if the panel selection is optimal and provide alternative options if the tool assesses the initial calculations to be insufficient.

Consider the following factors to refine the panel configuration:

- Energy consumption: {{{energyConsumption}}} kWh
- Energy bill: R$ {{{energyBill}}}
- Location: {{{location}}}
- Initial panel quantity: {{{initialPanelQuantity}}}
- Panel model: {{{panelModel}}}
- Total cost estimate: R$ {{{totalCostEstimate}}}
- Estimated annual savings: R$ {{{estimatedSavings}}}
- Payback period: {{{paybackPeriod}}} years

Based on these parameters, suggest a refined panel configuration with the following properties:

- refinedPanelQuantity: The refined/suggested number of solar panels.
- refinedPanelModel: The refined/suggested model/power of the solar panels.
- refinedTotalCostEstimate: The refined estimated total cost of the system.
- refinedEstimatedSavings: The refined estimated annual savings.
- refinedPaybackPeriod: The refined payback period for the solar system investment.
- reasoning: Provide the AI reasoning behind the suggested refined configuration.

If the initial panel configuration is appropriate, then return the same panel configuration with a short message in the reasoning field that the configuration is appropriate.
`,
});

const suggestRefinedPanelConfigFlow = ai.defineFlow(
  {
    name: 'suggestRefinedPanelConfigFlow',
    inputSchema: SuggestRefinedPanelConfigInputSchema,
    outputSchema: SuggestRefinedPanelConfigOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
