
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

// O input agora é o mesmo objeto do cálculo solar, para uma análise completa.
export const SuggestRefinedPanelConfigInputSchema = solarCalculationSchema;

export type SuggestRefinedPanelConfigInput = z.infer<
  typeof SuggestRefinedPanelConfigInputSchema
>;

const SuggestRefinedPanelConfigOutputSchema = z.object({
  analise_texto: z
    .string()
    .describe('A análise detalhada em texto, explicando a sugestão. Deve ser em Português-BR.'),
  configuracao_otimizada: z.object({
    quantidade_modulos: z
      .number()
      .describe('O número otimizado de módulos.'),
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
  prompt: `Você é um engenheiro especialista em sistemas de energia solar. Sua tarefa é analisar a configuração de orçamento fornecida e sugerir a otimização ideal, focando no melhor custo-benefício.

**Responda sempre em Português do Brasil (PT-BR).**

**Princípio Fundamental:** Seu objetivo é encontrar o melhor equilíbrio para cobrir 100% do consumo mensal do cliente, com uma margem de segurança de geração entre 5% e 15%.

**Objeto de Entrada (Configuração Atual):**
- Consumo Mensal: {{{consumo_mensal_kwh}}} kWh
- Irradiação Solar Local: {{{irradiacao_psh_kwh_m2_dia}}} PSH
- Potência do Módulo: {{{potencia_modulo_wp}}} Wp
- Quantidade de Módulos: {{{quantidade_modulos}}}
- Eficiência do Inversor: {{{eficiencia_inversor_percent}}}%
- Fator de Perdas: {{{fator_perdas_percent}}}%
- Preço por Módulo: R$ {{{preco_modulo_reais}}}
- Custo do Inversor: R$ {{{custo_inversor_reais}}}
- Custo Fixo de Instalação: R$ {{{custo_fixo_instalacao_reais}}}

**Sua Cadeia de Pensamento (Obrigatória):**

1.  **Calcular Geração Real da Configuração ATUAL:**
    - Eficiência Efetiva do Sistema = (eficiencia_inversor_percent / 100) * (1 - (fator_perdas_percent / 100))
    - Geração por Módulo (kWh/mês) = (potencia_modulo_wp / 1000) * irradiacao_psh_kwh_m2_dia * 30 * Eficiência Efetiva
    - Geração Total ATUAL (kWh/mês) = Geração por Módulo * quantidade_modulos

2.  **Determinar a Configuração ÓTIMA:**
    - Meta de Geração Mínima = consumo_mensal_kwh * 1.05 (margem de 5%)
    - Meta de Geração Máxima = consumo_mensal_kwh * 1.15 (margem de 15%)
    - Quantidade Ótima de Módulos = Arredonde para o inteiro mais próximo o resultado de (Meta de Geração Mínima / Geração por Módulo).

3.  **Comparar e Decidir:**
    - Compare a 'Geração Total ATUAL' com a 'Meta de Geração Mínima/Máxima'.
    - **Se a configuração ATUAL for a ótima:** Valide a escolha do usuário. No campo 'analise_texto', explique que a configuração dele já é excelente, mostrando a geração calculada e a margem de segurança.
    - **Se a configuração ATUAL NÃO for a ótima:** Sugira a 'Quantidade Ótima de Módulos'. No campo 'analise_texto', justifique a mudança, explicando como a nova configuração atinge a meta de geração ideal e melhora a economia a longo prazo.

4.  **Calcular Custos da Configuração OTIMIZADA:**
    - Se você sugerir uma nova quantidade de módulos, recalcule o custo total e o payback SIMPLES para essa nova configuração. Use os mesmos custos de equipamento e instalação fornecidos.
    - Custo Total Otimizado = (Quantidade Ótima de Módulos * preco_modulo_reais) + custo_inversor_reais + custo_fixo_instalacao_reais.
    - Economia Mensal = (valor_medio_fatura_reais - (custo_disponibilidade_kwh * tarifa_final)) -> Simplifique assumindo uma economia de 90% da fatura média para o cálculo do payback.
    - Payback Otimizado (anos) = Custo Total Otimizado / (Economia Mensal * 12)

**Formato da Resposta (JSON Obrigatório):**
Sua resposta DEVE ser um JSON válido com a seguinte estrutura:
- analise_texto: Sua justificativa técnica e clara.
- configuracao_otimizada: Um objeto com 'quantidade_modulos', 'custo_total' e 'payback' para a configuração que você determinou como ideal. Se a configuração do usuário já era a ideal, retorne os valores originais aqui.
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
