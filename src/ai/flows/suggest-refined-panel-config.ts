
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
  prompt: `Você é um consultor de sistemas de energia solar alimentado por IA. Sua tarefa é analisar se a configuração inicial de painéis é ótima e fornecer opções alternativas caso avalie que os cálculos iniciais são insuficientes.

**Responda sempre em Português do Brasil (PT-BR).**

Parâmetros recebidos:
- Consumo de energia: {{{consumption}}} kWh
- Conta de energia mensal: R$ {{{bill}}}
- Localização (Concessionária): {{{location}}}
- Quantidade inicial de painéis: {{{initialPanelQuantity}}}
- Modelo do painel: {{{panelModel}}}
- Custo total estimado: R$ {{{totalCostEstimate}}}
- Economia ANUAL estimada: R$ {{{estimatedAnnualSavings}}}
- Período de payback: {{{paybackPeriod}}} anos

Com base nesses parâmetros, sugira uma configuração de painel refinada. Se a configuração inicial for apropriada, retorne a mesma configuração com uma mensagem curta no campo 'reasoning' informando que a configuração é apropriada e o porquê (ex: "A configuração atual é ideal para sua meta de consumo e oferece um excelente tempo de retorno.").\nSe você sugerir uma mudança, a justificativa ('reasoning') deve explicar o motivo da alteração de forma clara e objetiva (ex: "Aumentar para X painéis garantirá a compensação total do seu consumo, resultando em maior economia a longo prazo com um impacto mínimo no payback.").

Sua resposta DEVE estar no seguinte formato JSON:
- refinedPanelQuantity: O número refinado/sugerido de painéis solares.
- refinedPanelModel: O modelo/potência refinado/sugerido dos painéis solares.
- refinedTotalCostEstimate: O custo total estimado e refinado do sistema.
- refinedEstimatedSavings: A economia anual estimada e refinada.
- refinedPaybackPeriod: O período de payback refinado para o investimento no sistema solar.
- reasoning: A justificativa da IA para a configuração refinada sugerida, em português.
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
