
'use server';
/**
 * @fileOverview A server-side solar calculation service based on detailed business rules.
 * - calculateSolar - A function that handles the solar calculation process.
 */

import { ai } from '@/ai/genkit';
import { solarCalculationSchema, type SolarCalculationInput } from '@/types';
import { z } from 'zod';

const DISPONIBILITY_COST_KWH: Record<string, number> = {
    mono: 30,
    bi: 50,
    tri: 100,
};

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
    // 1. Validate Inputs & Apply Defaults
    if (!data.consumo_mensal_kwh || data.consumo_mensal_kwh <= 0) {
      throw new Error("O consumo mensal (kWh) é um dado essencial e deve ser maior que zero.");
    }
    // Allow calculations even if panel/quantity is zero, as per new flexible UI logic
    const potencia_modulo_wp = data.potencia_modulo_wp ?? 0;
    const quantidade_modulos = data.quantidade_modulos ?? 0;
    
    const eficiencia_inversor = (data.eficiencia_inversor_percent ?? 97) / 100;
    const fator_perdas = (data.fator_perdas_percent ?? 20) / 100;
    
    // 2. Calculate System Efficiency
    const eficiencia_sistema = eficiencia_inversor * (1 - fator_perdas);

    // 3. Calculate Final System Specs
    const potencia_modulo_kw = potencia_modulo_wp / 1000;
    const potencia_pico_final_kw = potencia_modulo_kw * quantidade_modulos;

    // 4. Calculate Energy Generation
    const geracao_diaria_kwh = potencia_pico_final_kw * data.irradiacao_psh_kwh_m2_dia * eficiencia_sistema;
    const geracao_media_mensal_kwh = geracao_diaria_kwh * 30;

    // 5. Calculate Financials
    const tarifa_energia_reais_kwh = data.valor_medio_fatura_reais / data.consumo_mensal_kwh;
    const tarifa_final_reais_kwh = tarifa_energia_reais_kwh + data.adicional_bandeira_reais_kwh;
    
    const conta_antes_reais = data.valor_medio_fatura_reais;
    
    const custo_disponibilidade_kwh = DISPONIBILITY_COST_KWH[data.rede_fases];
    const energia_compensada_kwh = Math.min(geracao_media_mensal_kwh, Math.max(0, data.consumo_mensal_kwh - custo_disponibilidade_kwh));
    const consumo_nao_compensado_kwh = data.consumo_mensal_kwh - energia_compensada_kwh;

    const custo_disponibilidade_reais = custo_disponibilidade_kwh * tarifa_final_reais_kwh;
    const consumo_faturado_com_gd_reais = consumo_nao_compensado_kwh * tarifa_final_reais_kwh;

    const conta_depois_reais = Math.max(custo_disponibilidade_reais, consumo_faturado_com_gd_reais) + data.cip_iluminacao_publica_reais;
    
    const economia_mensal_reais = Math.max(0, conta_antes_reais - conta_depois_reais);
    const economia_anual_reais = economia_mensal_reais * 12;
    const economia_primeiro_ano = (economia_mensal_reais * 12) - (data.custo_om_anual_reais ?? 0);
    
    const custo_sistema_reais = data.custo_sistema_reais ?? 0;

    const payback_simples_anos = economia_anual_reais > 0 ? (custo_sistema_reais / economia_anual_reais) : Infinity;

    return {
      dimensionamento: {
        potencia_sistema_kwp: Number(potencia_pico_final_kw.toFixed(2)),
        quantidade_modulos: quantidade_modulos,
      },
      geracao: {
        media_diaria_kwh: Number(geracao_diaria_kwh.toFixed(2)),
        media_mensal_kwh: Number(geracao_media_mensal_kwh.toFixed(2)),
        eficiencia_sistema: Number(eficiencia_sistema.toFixed(2)),
      },
      financeiro: {
        economia_mensal_reais: Number(economia_mensal_reais.toFixed(2)),
        economia_anual_reais: Number(economia_anual_reais.toFixed(2)),
        economia_primeiro_ano: Number(economia_primeiro_ano.toFixed(2)),
        payback_simples_anos: isFinite(payback_simples_anos) ? Number(payback_simples_anos.toFixed(1)) : Infinity,
        custo_sistema_reais: Number(custo_sistema_reais.toFixed(2))
      },
      conta_media_mensal_reais: {
          antes: Number(conta_antes_reais.toFixed(2)),
          depois: Number(conta_depois_reais.toFixed(2)),
      },
      warnings: [],
      recommendations: ["Verificar limites de conexão, medição e DC/AC máximo aceito pela concessionária local."]
    };
  }
);
