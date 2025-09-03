import type { suggestRefinedPanelConfig, SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { z } from "zod";

export const solarCalculationSchema = z.object({
  // User Inputs
  consumo_mensal_kwh: z.number().positive({ message: "O consumo mensal deve ser um número maior que zero." }),
  valor_medio_fatura_reais: z.number().positive({ message: "O valor da fatura deve ser maior que zero." }),
  bandeira_tarifaria: z.enum(['verde', 'amarela', 'vermelha1', 'vermelha2', 'escassez']).default('verde'),
  cip_iluminacao_publica_reais: z.number().gte(0, { message: "O valor da CIP não pode ser negativo." }),
  concessionaria: z.enum(
      ["Equatorial GO", "CHESP"], 
      { errorMap: () => ({ message: 'Concessionária não suportada para esta região.' }) }
  ),
  rede_fases: z.enum(['mono', 'bi', 'tri']),
  irradiacao_psh_kwh_m2_dia: z.number().min(0.1).max(12, { message: "Valor de irradiação irreal. Verifique o dado." }),
  potencia_modulo_wp: z.number().positive({ message: "A potência do módulo deve ser maior que zero." }),
  
  // Optional advanced inputs
  fator_perdas_percent: z.number().min(0).max(100).default(25),
  meta_compensacao_percent: z.number().min(0).max(100).default(100),
  
  // These fields are not currently on the form, but are part of the schema for backend logic
  // In a real app, they might come from a DB or advanced form settings
  custo_sistema_reais: z.number().gte(0).optional(),
});


export type SolarCalculationInput = z.infer<typeof solarCalculationSchema>;

export type SolarCalculationResult = Awaited<
  ReturnType<typeof import('@/ai/flows/calculate-solar').calculateSolar>
>;


export type SavingsDataPoint = {
  year: number;
  "Economia Acumulada": number;
};

export type { SuggestRefinedPanelConfigOutput };
