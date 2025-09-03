'use server';
/**
 * @fileOverview A server-side solar calculation service.
 *
 * - calculateSolar - A function that handles the solar calculation process.
 * - solarCalculationSchema - The Zod schema for input validation.
 * - SolarCalculationInput - The TS type for the input.
 * - SolarCalculationResult - The TS type for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock database for tariffs and irradiation. In a real app, this would be Firestore.
const TARIFF_DATA: Record<string, any> = {
    'Equatorial GO': {
        residencial: {
            tarifa_energia_reais_kwh: 0.63,
            adicional_bandeira: {
                verde: 0,
                amarela: 0.01874,
                vermelha1: 0.03971,
                vermelha2: 0.09492,
                escassez: 0.1420
            }
        }
    }
};

const IRRADIATION_DATA: Record<string, number> = {
    'GO': 5.7,
    'SP': 5.6,
    'RJ': 5.6,
    'MG': 5.6,
    'BA': 5.9,
};

const DISPONIBILITY_COST_KWH: Record<string, number> = {
    mono: 30,
    bi: 50,
    tri: 100,
};

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

export async function calculateSolar(input: SolarCalculationInput) {
  return calculateSolarFlow(input);
}

const calculateSolarFlow = ai.defineFlow(
  {
    name: 'calculateSolarFlow',
    inputSchema: solarCalculationSchema,
    // Output schema is defined implicitly by the return type
  },
  async (data) => {
    // 1. Get Tariff and Irradiation Data
    const tariffInfo = TARIFF_DATA[data.concessionaria]?.[data.classe];
    if (!tariffInfo) {
      throw new Error(`Tarifas para ${data.concessionaria}/${data.classe} não encontradas.`);
    }

    const tarifa_energia_reais_kwh = data.tarifa_energia_reais_kwh ?? tariffInfo.tarifa_energia_reais_kwh;
    const adicional_bandeira_reais_kwh = data.adicional_bandeira_reais_kwh ?? tariffInfo.adicional_bandeira[data.bandeira_tarifaria];
    const tarifa_final_reais_kwh = tarifa_energia_reais_kwh + adicional_bandeira_reais_kwh;

    const irradiacao_psh_kwh_m2_dia = data.irradiacao_psh_kwh_m2_dia ?? IRRADIATION_DATA[data.uf.toUpperCase()];
    if (!irradiacao_psh_kwh_m2_dia) {
        throw new Error(`Irradiação para UF "${data.uf}" não encontrada.`);
    }

    // 2. Calculate Costs Before Solar
    const custo_disponibilidade_kwh = data.min_kwh_por_fase_override ?? DISPONIBILITY_COST_KWH[data.rede_fases];
    const custo_disponibilidade_reais = custo_disponibilidade_kwh * tarifa_final_reais_kwh;
    
    const consumo_faturado_sem_gd_reais = data.consumo_mensal_kwh * tarifa_final_reais_kwh;
    const conta_antes_reais = consumo_faturado_sem_gd_reais + data.cip_iluminacao_publica_reais;

    // 3. System Sizing (Dimensionamento)
    const energia_necessaria_mes_kwh = data.consumo_mensal_kwh * (data.meta_compensacao_percent / 100);
    const energia_necessaria_dia_kwh = energia_necessaria_mes_kwh / 30;

    const pr_final = data.fator_perdas_pr * (1 - data.sombrite_sombreamento_percent / 100);

    const potencia_pico_necessaria_kwp = energia_necessaria_dia_kwh / (irradiacao_psh_kwh_m2_dia * pr_final);

    let quantidade_modulos = data.quantidade_modulos ?? Math.ceil((potencia_pico_necessaria_kwp * 1000) / data.potencia_modulo_wp);
    if (quantidade_modulos < 1) quantidade_modulos = 1;

    const potencia_sistema_kwp = (quantidade_modulos * data.potencia_modulo_wp) / 1000;

    // 4. Generation Calculation
    const geracao_media_mensal_kwh = potencia_sistema_kwp * irradiacao_psh_kwh_m2_dia * 30 * pr_final;

    // 5. Calculate Costs After Solar
    const energia_injetada_kwh = Math.max(0, geracao_media_mensal_kwh - (data.consumo_mensal_kwh - custo_disponibilidade_kwh));
    const saldo_energia_kwh = Math.min(geracao_media_mensal_kwh, data.consumo_mensal_kwh) - custo_disponibilidade_kwh;
    const energia_compensada_kwh = Math.max(0, saldo_energia_kwh);
    
    const consumo_faturado_com_gd_kwh = data.consumo_mensal_kwh - energia_compensada_kwh;
    const consumo_faturado_com_gd_reais = consumo_faturado_com_gd_kwh * tarifa_final_reais_kwh;
    
    const conta_depois_reais = custo_disponibilidade_reais + data.cip_iluminacao_publica_reais;
    
    // 6. Savings and Financial Analysis
    const economia_mensal_reais = conta_antes_reais - conta_depois_reais;
    const economia_anual_reais = economia_mensal_reais * 12;

    const custo_sistema_reais = data.custo_sistema_reais ?? potencia_sistema_kwp * 4500; // R$4500 per kWp as a fallback estimate
    const payback_simples_anos = custo_sistema_reais / economia_anual_reais;

    // Simple VPL/TIR calculation could be added here if needed
    
    return {
      parametros_entrada: data,
      tarifas: {
        tarifa_final_reais_kwh,
        custo_disponibilidade_kwh,
        custo_disponibilidade_reais,
      },
      conta_media_mensal_reais: {
        antes: conta_antes_reais,
        depois: conta_depois_reais,
      },
      dimensionamento: {
        potencia_pico_necessaria_kwp,
        quantidade_modulos,
        potencia_sistema_kwp,
      },
      geracao: {
        media_mensal_kwh: geracao_media_mensal_kwh,
        pr_final
      },
      balanco_energetico: {
        energia_compensada_kwh,
        consumo_faturado_com_gd_kwh,
        saldo_creditos_mes_kwh: energia_injetada_kwh,
      },
      economia_mensal_reais,
      economia_anual_reais,
      payback_simples_anos,
      financeiro: {
          custo_sistema_reais
      }
    };
  }
);

export type SolarCalculationResult = Awaited<ReturnType<typeof calculateSolarFlow>>;
