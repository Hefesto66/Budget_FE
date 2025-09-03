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
  consumption: z.number().describe("The average monthly energy consumption in kWh."),
  bill: z.number().describe("The average monthly energy bill in R$."),
  location: z.string().describe("The location for solar irradiation adjustment."),
  initialPanelQuantity: z.number().describe("The initially calculated number of solar panels."),
  panelModel: z.string().describe("The model/power of the solar panels being considered."),
  totalCostEstimate: z.number().describe("The estimated total cost of the system."),
  estimatedAnnualSavings: z.number().describe("The estimated annual savings in R$."),
  paybackPeriod: z.number().describe("The payback period for the solar system investment."),
});
export type SuggestRefinedPanelConfigInput = z.infer<
  typeof SuggestRefinedPanelConfigInputSchema
>;

const SuggestRefinedPanelConfigOutputSchema = z.object({
  refinedPanelQuantity: z
    .number()
    .describe('O número refinado/sugerido de painéis solares.'),
  refinedPanelModel: z
    .string()
    .describe('O modelo/potência refinado/sugerido dos painéis solares.'),
  refinedTotalCostEstimate: z
    .number()
    .describe('O custo total estimado e refinado do sistema.'),
  refinedEstimatedSavings: z
    .number()
    .describe('A economia anual estimada e refinada.'),
  refinedPaybackPeriod: z
    .number()
    .describe('O período de payback refinado para o investimento no sistema solar.'),
  reasoning: z
    .string()
    .describe('A justificativa da IA para a configuração refinada sugerida.'),
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
  prompt: `Você é um consultor de sistemas de energia solar alimentado por IA. Você recebe uma configuração inicial de painéis solares e os parâmetros relacionados ao sistema.

Sua tarefa é analisar se a seleção de painéis é ótima e fornecer opções alternativas caso a ferramenta avalie que os cálculos iniciais são insuficientes.

**Responda sempre em Português do Brasil (PT-BR).**

Considere os seguintes fatores para refinar a configuração dos painéis:

- Consumo de energia: {{{consumption}}} kWh
- Conta de energia: R$ {{{bill}}}
- Localização: {{{location}}}
- Quantidade inicial de painéis: {{{initialPanelQuantity}}}
- Modelo do painel: {{{panelModel}}}
- Custo total estimado: R$ {{{totalCostEstimate}}}
- Economia anual estimada: R$ {{{estimatedAnnualSavings}}}
- Período de payback: {{{paybackPeriod}}} anos

Com base nesses parâmetros, sugira uma configuração de painel refinada com as seguintes propriedades:

- refinedPanelQuantity: O número refinado/sugerido de painéis solares.
- refinedPanelModel: O modelo/potência refinado/sugerido dos painéis solares.
- refinedTotalCostEstimate: O custo total estimado e refinado do sistema.
- refinedEstimatedSavings: A economia anual estimada e refinada.
- refinedPaybackPeriod: O período de payback refinado para o investimento no sistema solar.
- reasoning: Forneça a justificativa da IA para a configuração refinada sugerida, em português.

Se a configuração inicial do painel for apropriada, retorne a mesma configuração do painel com uma mensagem curta no campo 'reasoning' informando que a configuração é apropriada.
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
