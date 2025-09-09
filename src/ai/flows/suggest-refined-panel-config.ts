
// src/ai/flows/suggest-refined-panel-config.ts
'use server';

/**
 * @fileOverview This file defines an algorithmic flow that suggests a refined solar panel quantity.
 * This implementation intentionally avoids calling a generative AI model to ensure reliability and prevent safety filter blocks.
 *
 * - suggestRefinedPanelConfig - A function that suggests a refined panel configuration based on input parameters.
 * - SuggestRefinedPanelConfigInput - The input type for the suggestRefinedPanelConfig function.
 * - SuggestRefinedPanelConfigOutput - The return type for the suggestRefinedPanelConfig function.
 */

import {z} from 'zod';
import { solarCalculationSchema } from '../types';

// Define a type for the system status
type SystemStatus = 'OTIMIZADO' | 'SUBDIMENSIONADO' | 'SUPERDIMENSIONADO';

// Zod schema for a single item in the bill of materials
const bomItemSchema = z.object({
    productId: z.string(),
    name: z.string(),
    category: z.string(),
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

/**
 * Generates a textual analysis based on the system status.
 * This function replaces the generative AI call.
 * @param status - The calculated status of the system.
 * @param data - The data required to fill the text templates.
 * @returns A string containing the analysis.
 */
function gerarAnaliseTextual(status: SystemStatus, data: { paineis_atuais: number; paineis_sugeridos: number; }): string {
    const { paineis_atuais, paineis_sugeridos } = data;
    
    switch (status) {
        case 'OTIMIZADO':
            return `A sua configuração atual de ${paineis_atuais} painéis já é a ideal. A geração estimada cobre o seu consumo com uma margem de segurança adequada, garantindo um excelente retorno sobre o investimento. Nenhuma alteração é necessária.`;
        
        case 'SUBDIMENSIONADO':
            return `O sistema atual com ${paineis_atuais} painéis está subdimensionado e pode não cobrir todo o seu consumo em meses de menor sol. Sugerimos aumentar para ${paineis_sugeridos} painéis para garantir a sua autossuficiência energética e maximizar a economia a longo prazo.`;
            
        case 'SUPERDIMENSIONADO':
            return `A configuração atual com ${paineis_atuais} painéis parece superdimensionada, o que pode aumentar o custo do investimento sem um benefício proporcional na sua fatura. Sugerimos ajustar para ${paineis_sugeridos} painéis para um equilíbrio perfeito entre geração e custo.`;

        default:
            return "Análise não disponível.";
    }
}


// This is the main exported function, now fully algorithmic.
export async function suggestRefinedPanelConfig(
  input: SuggestRefinedPanelConfigInput
): Promise<SuggestRefinedPanelConfigOutput> {
  
    // 1. Extract essential data from the input
    const { calculationInput, billOfMaterials } = SuggestRefinedPanelConfigInputSchema.parse(input);
    const { consumo_mensal_kwh, irradiacao_psh_kwh_m2_dia, valor_medio_fatura_reais } = calculationInput;

    const panel = billOfMaterials.find(item => item.category === 'PAINEL_SOLAR');
    const inverter = billOfMaterials.find(item => item.category === 'INVERSOR');

    if (!panel) throw new Error("Nenhum 'Painel Solar' encontrado na lista de materiais.");
    if (!inverter) throw new Error("Nenhum 'Inversor' encontrado na lista de materiais.");

    const panelPowerWp = parseFloat(panel.technicalSpecifications?.['Potência (Wp)'] || '0');
    const inverterEfficiencyPercent = parseFloat(inverter.technicalSpecifications?.['Eficiência (%)'] || '97');
    const currentPanelQuantity = panel.quantity;

    if (panelPowerWp === 0) throw new Error("Painel solar na lista não possui a especificação 'Potência (Wp)'.");

    // 2. Perform the sizing calculation (Engine Core)
    const systemEfficiency = (inverterEfficiencyPercent / 100) * (1 - (calculationInput.fator_perdas_percent ?? 20) / 100);
    const dailyEnergyPerPanelKwh = (panelPowerWp / 1000) * irradiacao_psh_kwh_m2_dia * systemEfficiency;
    const monthlyEnergyPerPanelKwh = dailyEnergyPerPanelKwh * 30;
    
    if (monthlyEnergyPerPanelKwh === 0) throw new Error("Cálculo de energia por painel resultou em zero. Verifique os dados de irradiação e potência.");

    const idealPanelQuantityRaw = consumo_mensal_kwh / monthlyEnergyPerPanelKwh;
    // Adiciona uma pequena margem (ex: 5%) antes de arredondar para cima, para garantir que o consumo seja coberto.
    const idealPanelQuantity = Math.ceil(idealPanelQuantityRaw * 1.05);

    
    // 3. Classify the system status
    let status: SystemStatus;
    const difference = idealPanelQuantity - currentPanelQuantity;
    // Allow for a small margin of +/- 1 panel to be considered "optimized"
    if (Math.abs(difference) <= 1) { 
        status = 'OTIMIZADO';
    } else if (difference > 0) {
        status = 'SUBDIMENSIONADO';
    } else {
        status = 'SUPERDIMENSIONADO';
    }

    // Determine the final suggested quantity
    const suggestedPanelQuantity = status === 'OTIMIZADO' ? currentPanelQuantity : idealPanelQuantity;
    
    // 4. Calculate new total cost and payback for the suggestion
    const otherItemsCost = billOfMaterials
      .filter(item => item.category !== 'PAINEL_SOLAR')
      .reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    
    const newPanelsCost = panel.cost * suggestedPanelQuantity;
    const newTotalCost = newPanelsCost + otherItemsCost;
    
    // Simplified savings calculation for payback estimation
    const annualSavings = (valor_medio_fatura_reais * 12) * 0.90; // Assume 90% savings for simplicity
    const newPaybackYears = annualSavings > 0 ? newTotalCost / annualSavings : Infinity;
    
    // 5. Generate the analysis text using the local engine
    const analiseTexto = gerarAnaliseTextual(status, {
        paineis_atuais: currentPanelQuantity,
        paineis_sugeridos: suggestedPanelQuantity
    });

    // 6. Return the final structured object, maintaining the same schema
    const result: SuggestRefinedPanelConfigOutput = {
      analise_texto: analiseTexto,
      configuracao_otimizada: {
        nova_quantidade_paineis: suggestedPanelQuantity,
        novo_custo_total_reais: newTotalCost,
        novo_payback_anos: isFinite(newPaybackYears) ? parseFloat(newPaybackYears.toFixed(1)) : 0,
      },
    };

    return SuggestRefinedPanelConfigOutputSchema.parse(result);
}

    