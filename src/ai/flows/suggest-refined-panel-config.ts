
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
import { solarCalculationSchema } from '@/types';
import { Product } from '@/lib/storage';

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  salePrice: z.number(),
  technicalSpecifications: z.record(z.string()).optional(),
});


// O input agora é o mesmo objeto do cálculo solar, para uma análise completa.
const SuggestRefinedPanelConfigInputSchema = solarCalculationSchema.extend({
    inventory: z.object({
        panels: z.array(productSchema).describe("Lista de painéis solares disponíveis no inventário."),
        inverters: z.array(productSchema).describe("Lista de inversores disponíveis no inventário."),
    })
});

export type SuggestRefinedPanelConfigInput = z.infer<
  typeof SuggestRefinedPanelConfigInputSchema
>;

const SuggestRefinedPanelConfigOutputSchema = z.object({
  analise_texto: z
    .string()
    .describe('Uma análise curta e direta em texto, explicando a sugestão. Deve ser em Português-BR.'),
  configuracao_otimizada: z.object({
    itens: z.array(z.object({
      produtoId: z.string().describe("O ID do produto selecionado do inventário."),
      nomeProduto: z.string().describe("O nome do produto selecionado."),
      quantidade: z.number().int().positive().describe("A quantidade necessária para este item."),
    })),
    custo_total: z
      .number()
      .describe('O novo custo total estimado para a configuração otimizada.'),
    payback: z
      .number()
      .describe('O novo payback estimado para a configuração otimizada.'),
  }).describe('A configuração otimizada sugerida pela IA.'),
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
  prompt: `
      Você é um engenheiro especialista em sistemas de energia solar. Sua tarefa é analisar a necessidade de um cliente e, usando os produtos disponíveis no inventário, montar a configuração ideal com o melhor custo-benefício.

      **Responda sempre em Português do Brasil (PT-BR).**

      **Objetivo:** Gerar o suficiente para cobrir 100% do consumo mensal de {{{consumo_mensal_kwh}}} kWh.

      **Dados do Cliente:**
      - Consumo Mensal: {{{consumo_mensal_kwh}}} kWh
      - Irradiação Solar (PSH): {{{irradiacao_psh_kwh_m2_dia}}}
      - Valor Médio da Fatura: R$ {{{valor_medio_fatura_reais}}}

      **Inventário de Produtos Disponíveis:**
      - Painéis Solares:
      {{#each inventory.panels}}
        - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}, Potência: {{technicalSpecifications.Potência (Wp)}} Wp
      {{/each}}
      - Inversores:
      {{#each inventory.inverters}}
        - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}
      {{/each}}

      **Sua Tarefa:**

      1.  **Escolha o melhor painel e inversor** do inventário para atender a necessidade do cliente. Considere um bom balanço entre preço e potência.
      2.  **Calcule a quantidade de painéis** necessária para cobrir o consumo. A fórmula para a energia gerada mensalmente por um painel é: (Potência do Painel (Wp) / 1000) * Irradiação Solar * 30 * 0.8 (eficiência do sistema). A quantidade de painéis será: Consumo Mensal / Energia gerada por um painel. Arredonde o número de painéis para cima.
      3.  **Calcule o custo total** dos equipamentos (painéis + inversor).
      4.  **Estime o payback** em anos. A fórmula é: Custo Total / (Valor da Fatura Média * 0.9 * 12).
      5.  **Monte a resposta JSON.**
          - No campo 'analise_texto', escreva uma justificativa **curta e direta** da sua escolha de equipamentos.
          - Em 'configuracao_otimizada', liste os produtos escolhidos (painel e inversor), o custo total e o payback que você calculou.

      **Formato da Resposta (JSON Obrigatório):**
      Sua resposta DEVE ser um JSON válido que corresponda à estrutura de saída.
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
