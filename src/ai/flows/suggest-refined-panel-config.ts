// src/ai/flows/suggest-refined-panel-config.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests a refined solar panel quantity.
 *
 * - suggestRefinedPanelConfig - A function that suggests a refined panel configuration based on input parameters.
 * - SuggestRefinedPanelConfigInput - The input type for the suggestRefinedPanelConfig function.
 * - SuggestRefinedPanelConfigOutput - The return type for the suggestRefinedPanelConfig function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { solarCalculationSchema } from '@/types';
import { googleAI } from '@genkit-ai/googleai';

// Zod schema for a single item in the bill of materials
const bomItemSchema = z.object({
    productId: z.string(),
    name: z.string(),
    type: z.string(),
    cost: z.number(),
    quantity: z.number(),
    manufacturer: z.string(),
    unit: z.string(),
    // We expect the specific specs we need to be present
    technicalSpecifications: z.record(z.string()).optional(),
});

// The input is the main calculation data plus the user-configured bill of materials
const SuggestRefinedPanelConfigInputSchema = z.object({
    calculationInput: solarCalculationSchema,
    billOfMaterials: z.array(bomItemSchema),
});

export type SuggestRefinedPanelConfigInput = z.infer<
  typeof SuggestRefinedPanelConfigInputSchema
>;

const SuggestRefinedPanelConfigOutputSchema = z.object({
  analise_texto: z
    .string()
    .describe('Uma análise curta e direta em texto, em Português-BR, explicando a nova quantidade sugerida de painéis.'),
  configuracao_otimizada: z.object({
    nova_quantidade_paineis: z.number().int().positive().describe("A nova quantidade de painéis calculada para atingir a meta de consumo."),
    novo_custo_total_reais: z.number().describe("O novo custo total do sistema com a quantidade ajustada de painéis."),
    novo_payback_anos: z.number().describe("O novo payback estimado em anos com a configuração otimizada."),
  }).describe('A configuração de dimensionamento otimizada sugerida pela IA.'),
});

export type SuggestRefinedPanelConfigOutput = z.infer<
  typeof SuggestRefinedPanelConfigOutputSchema
>;

export async function suggestRefinedPanelConfig(
  input: SuggestRefinedPanelConfigInput
): Promise<SuggestRefinedPanelConfigOutput> {
  return suggestRefinedPanelConfigFlow(input);
}

// This flow now performs the calculation logic itself, asking the AI only for the analysis text.
const suggestRefinedPanelConfigFlow = ai.defineFlow(
  {
    name: 'suggestRefinedPanelConfigFlow',
    inputSchema: SuggestRefinedPanelConfigInputSchema,
    outputSchema: SuggestRefinedPanelConfigOutputSchema,
  },
  async (input) => {
    
    // 1. Extract essential data from the input
    const { calculationInput, billOfMaterials } = input;
    const { consumo_mensal_kwh, irradiacao_psh_kwh_m2_dia, valor_medio_fatura_reais } = calculationInput;

    const panel = billOfMaterials.find(item => item.type === 'PAINEL_SOLAR');
    const inverter = billOfMaterials.find(item => item.type === 'INVERSOR');

    if (!panel) throw new Error("Nenhum 'Painel Solar' encontrado na lista de materiais.");
    if (!inverter) throw new Error("Nenhum 'Inversor' encontrado na lista de materiais.");

    const panelPowerWp = parseFloat(panel.technicalSpecifications?.['Potência (Wp)'] || '0');
    const inverterEfficiencyPercent = parseFloat(inverter.technicalSpecifications?.['Eficiência (%)'] || '97');

    if (panelPowerWp === 0) throw new Error("Painel solar na lista não possui a especificação 'Potência (Wp)'.");

    // 2. Perform the sizing calculation (LOGIC MOVED TO CODE)
    const systemEfficiency = (inverterEfficiencyPercent / 100) * (1 - (calculationInput.fator_perdas_percent ?? 20) / 100);
    const dailyEnergyPerPanelKwh = (panelPowerWp / 1000) * irradiacao_psh_kwh_m2_dia * systemEfficiency;
    const monthlyEnergyPerPanelKwh = dailyEnergyPerPanelKwh * 30;
    
    if (monthlyEnergyPerPanelKwh === 0) throw new Error("Cálculo de energia por painel resultou em zero. Verifique os dados de irradiação e potência.");

    const idealPanelQuantity = Math.ceil(consumo_mensal_kwh / monthlyEnergyPerPanelKwh);
    
    // 3. Calculate new total cost and payback (LOGIC MOVED TO CODE)
    const otherItemsCost = billOfMaterials
      .filter(item => item.type !== 'PAINEL_SOLAR')
      .reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    
    const newPanelsCost = panel.cost * idealPanelQuantity;
    const newTotalCost = newPanelsCost + otherItemsCost;
    
    // Simplified savings calculation for payback estimation
    const annualSavings = (valor_medio_fatura_reais * 12) * 0.90; // Assume 90% savings for simplicity
    const newPaybackYears = annualSavings > 0 ? newTotalCost / annualSavings : Infinity;
    
    // 4. Ask the AI to generate ONLY the analysis text based on the results.
    const prompt = `
      Você é um engenheiro especialista em sistemas de energia solar.
      Um sistema foi dimensionado para um cliente. Sua tarefa é apenas gerar uma breve análise sobre o novo dimensionamento.

      **Dados:**
      - Consumo do Cliente: ${consumo_mensal_kwh} kWh/mês.
      - Quantidade de painéis na proposta original: ${panel.quantity}
      - Quantidade ideal de painéis calculada por você: ${idealPanelQuantity}

      **Sua Tarefa:**
      Escreva uma análise **curta e direta** (máximo 2 frases) para o campo 'analise_texto', justificando o porquê da nova quantidade de painéis ser mais adequada para atingir a meta de consumo do cliente.
      Seja técnico e assertivo. Exemplo: "Para cobrir 100% do consumo, o dimensionamento ideal requer ${idealPanelQuantity} painéis. Esta configuração garante a geração necessária para abater a fatura de energia de forma eficiente."
    `;

    const { text } = await ai.generate({
      model: googleAI('gemini-1.5-flash-latest'),
      prompt: prompt,
    });

    // 5. Return the final structured object with calculated data
    return {
      analise_texto: text,
      configuracao_otimizada: {
        nova_quantidade_paineis: idealPanelQuantity,
        novo_custo_total_reais: newTotalCost,
        novo_payback_anos: newPaybackYears,
      },
    };
  }
);
