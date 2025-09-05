
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
    .describe('A análise detalhada em texto, explicando a sugestão. Deve ser em Português-BR.'),
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

**Princípio Fundamental:** Seu objetivo é encontrar o melhor equilíbrio para cobrir 100% do consumo mensal do cliente, com uma margem de segurança de geração entre 5% e 15%.

**Dados do Cliente e Local:**
- Consumo Mensal: {{{consumo_mensal_kwh}}} kWh
- Irradiação Solar Local: {{{irradiacao_psh_kwh_m2_dia}}} PSH
- Eficiência Padrão do Inversor: 97% (use este valor se o produto não especificar)
- Fator de Perdas Padrão: 20%

**Produtos Disponíveis no Inventário:**
- Painéis:
{{#each inventory.panels}}
  - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}, Especificações: {{json technicalSpecifications}}
{{/each}}
- Inversores:
{{#each inventory.inverters}}
  - ID: {{id}}, Nome: {{name}}, Preço: R$ {{salePrice}}, Especificações: {{json technicalSpecifications}}
{{/each}}

**Sua Cadeia de Pensamento (Obrigatória):**

1.  **Calcular a Geração Necessária:**
    - Geração Alvo (kWh/mês) = consumo_mensal_kwh * 1.10 (use uma margem de segurança de 10% como alvo).

2.  **Selecionar o Melhor Painel:**
    - Para cada painel no inventário, calcule a "Geração por Módulo (kWh/mês)". Use as especificações do painel (como 'Potência') e os dados do local.
      - Geração por Módulo = (Potência Wp / 1000) * irradiacao_psh_kwh_m2_dia * 30 * (eficiencia_inversor_percent / 100) * (1 - (fator_perdas_percent / 100))
    - Escolha o painel que oferece o melhor custo por kWh gerado ou o que melhor se adapta. Justifique sua escolha.

3.  **Dimensionar a Quantidade de Painéis:**
    - Quantidade de Painéis = Arredonde para o inteiro de CIMA (Math.ceil) o resultado de (Geração Alvo / Geração por Módulo do painel escolhido).

4.  **Selecionar o Melhor Inversor:**
    - Potência Total dos Painéis (kWp) = (Quantidade de Painéis * Potência Wp do painel escolhido) / 1000.
    - Analise os inversores disponíveis. Escolha um cuja potência seja compatível e ligeiramente superior à potência total dos painéis. Considere o custo. Justifique sua escolha.

5.  **Montar a Resposta:**
    - No campo 'analise_texto', escreva uma justificativa técnica clara, explicando por que você escolheu esses componentes e como eles atendem às necessidades do cliente.
    - No campo 'configuracao_otimizada.itens', liste os produtos selecionados (o painel e o inversor) com seus IDs e as quantidades calculadas.
    - Calcule o 'custo_total' e o 'payback' para a configuração que você montou. Para o payback, pode usar uma estimativa simplificada: Custo Total / (Valor da Fatura Média Mensal * 0.9 * 12).

**Formato da Resposta (JSON Obrigatório):**
Sua resposta DEVE ser um JSON válido com a estrutura definida. Certifique-se de que 'configuracao_otimizada.itens' seja um array contendo os produtos que você selecionou.
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
