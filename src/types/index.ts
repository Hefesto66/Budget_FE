import type { suggestRefinedPanelConfig, SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { z } from "zod";

export const solarCalculationSchema = z.object({
  // Identification and tariffing
  concessionaria: z.string().default('Equatorial GO'),
  classe: z.enum(['residencial', 'comercial', 'rural', 'industrial']).default('residencial'),
  subgrupo: z.string().optional(),
  rede_fases: z.enum(['mono', 'bi', 'tri']),
  bandeira_tarifaria: z.enum(['verde', 'amarela', 'vermelha1', 'vermelha2', 'escassez']).default('verde'),
  cip_iluminacao_publica_reais: z.number().gte(0),
  min_kwh_por_fase_override: z.number().optional(),

  // Consumption and goals
  consumo_mensal_kwh: z.number().positive(),
  meta_compensacao_percent: z.number().min(0).max(100).default(100),

  // Solar resource and location
  cidade: z.string(),
  uf: z.string().length(2),
  irradiacao_psh_kwh_m2_dia: z.number().positive().optional(),
  fator_perdas_pr: z.number().min(0.5).max(0.9).default(0.75),
  sombrite_sombreamento_percent: z.number().min(0).max(30).default(0),

  // Equipment and configuration
  potencia_modulo_wp: z.number().positive(),
  quantidade_modulos: z.number().gte(1).optional(),
  rendimento_inversor_percent: z.number().min(80).max(99).default(97),
  dc_ac_ratio: z.number().min(1.0).max(1.5).default(1.2),
  angulo_inclinacao_graus: z.number().optional(),
  orientacao_azimute_graus: z.number().optional(),

  // Financial
  custo_sistema_reais: z.number().gte(0).optional(),
  custo_om_anual_reais: z.number().gte(0).default(0),
  degradacao_anual_percent: z.number().min(0).max(2).default(0.5),
  vida_util_anos: z.number().min(10).max(30).default(25),
  reajuste_tarifa_percent_aa: z.number().min(0).max(20).default(7),
  taxa_desconto_tma_percent_aa: z.number().min(0).max(30).default(10),

  // Tariffs (optional override)
  tarifa_energia_reais_kwh: z.number().optional(),
  adicional_bandeira_reais_kwh: z.number().optional(),
});

export type SolarCalculationInput = z.infer<typeof solarCalculationSchema>;

// This is a trick to get the return type of a Genkit flow.
// We are essentially importing the type of the `calculateSolar` function from the module,
// getting its return type, and then getting the resolved type of the promise.
// We can't import the flow directly because it's in a 'use server' file.
export type SolarCalculationResult = Awaited<
  ReturnType<typeof import('@/ai/flows/calculate-solar').calculateSolar>
>;


export type SavingsDataPoint = {
  year: number;
  "Economia Acumulada": number;
};

export type { SuggestRefinedPanelConfigOutput };
