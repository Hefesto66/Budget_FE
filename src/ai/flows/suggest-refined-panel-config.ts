
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
  prompt: `Você é um engenheiro especialista em sistemas de energia solar. Sua tarefa é analisar a necessidade de um cliente e, usando os produtos disponíveis no inventário, montar a configuração ideal com o melhor custo-benefício.

**Responda sempre em Português do Brasil (PT-BR).**

**Objetivo:** Cubra 100% do consumo mensal de {{{consumo_mensal_kwh}}} kWh, com uma margem de segurança na geração.

**Dados:**
- Irradiação Solar: {{{irradiacao_psh_kwh_m2_dia}}} PSH
- Perdas e eficiência padrão: 20% e 97%

**Inventário de Produtos:**
- Painéis:
{{#each inventory.panels}}
  - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}, Specs: {{json technicalSpecifications}}
{{/each}}
- Inversores:
{{#each inventory.inverters}}
  - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}, Specs: {{json technicalSpecifications}}
{{/each}}

**Sua Tarefa:**

1.  **Escolha o melhor painel e inversor** do inventário para atender a necessidade do cliente.
2.  **Calcule a quantidade de painéis** necessária.
3.  **Monte a resposta JSON.**
    - Em 'analise_texto', escreva uma justificativa **curta e direta** da sua escolha.
    - Em 'configuracao_otimizada', liste os produtos, o custo total e o payback. Para o payback, use a fórmula: Custo Total / (Valor da Fatura Média * 0.9 * 12).

**Formato da Resposta (JSON Obrigatório):**
Sua resposta DEVE ser um JSON válido com a estrutura definida.
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
