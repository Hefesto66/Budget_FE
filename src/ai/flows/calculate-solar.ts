
'use server';
/**
 * @fileOverview A server-side solar calculation service based on detailed business rules.
 * - calculateSolar - A function that handles the solar calculation process.
 */

import { ai } from '@/ai/genkit';
import { solarCalculationSchema, type SolarCalculationInput } from '@/types';

// Mock database for tariffs and irradiation. In a real app, this would be Firestore.
const TARIFF_DATA: Record<string, any> = {
    'Equatorial GO': {
        residencial: {
            // Placeholder: In a real app, this would be more detailed.
            // For now, we derive it from user input.
        }
    },
    'CHESP': {
        residencial: {
            // Placeholder
        }
    }
};

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
    // 1. Calculate effective tariff from user input
    const tarifa_energia_reais_kwh = data.valor_medio_fatura_reais / data.consumo_mensal_kwh;
    const tarifa_final_reais_kwh = tarifa_energia_reais_kwh + data.adicional_bandeira_reais_kwh;

    // 2. Calculate Costs Before Solar
    const conta_antes_reais = data.valor_medio_fatura_reais;

    // 3. System Sizing & Efficiency
    const consumo_anual_kwh = data.consumo_mensal_kwh * 12;
    // Effective efficiency: inverter efficiency reduced by system losses
    const eficiencia_efetiva_sistema = (data.eficiencia_inversor_percent / 100) * (1 - (data.fator_perdas_percent / 100));

    // Energy produced per panel per month
    const energia_produzida_por_modulo_mes_kwh = (data.potencia_modulo_wp / 1000) * data.irradiacao_psh_kwh_m2_dia * 30 * eficiencia_efetiva_sistema;
    
    // Determine number of panels
    let quantidade_modulos = data.quantidade_modulos ?? Math.ceil(data.consumo_mensal_kwh / energia_produzida_por_modulo_mes_kwh);
    if (quantidade_modulos < 1) quantidade_modulos = 1;

    // Total system power
    const potencia_sistema_kwp = (quantidade_modulos * data.potencia_modulo_wp) / 1000;
    
    // 4. Generation Calculation
    const geracao_media_mensal_kwh = energia_produzida_por_modulo_mes_kwh * quantidade_modulos;

    // 5. Compensable Energy Calculation
    const custo_disponibilidade_kwh = DISPONIBILITY_COST_KWH[data.rede_fases];
    
    const parcela_consumo_compensavel_kwh = Math.max(0, data.consumo_mensal_kwh - custo_disponibilidade_kwh);
    const meta_compensacao_kwh = parcela_consumo_compensavel_kwh * (data.meta_compensacao_percent / 100);
    const energia_compensada_kwh = Math.min(geracao_media_mensal_kwh, meta_compensacao_kwh);

    // 6. Calculate Costs After Solar
    const consumo_nao_compensado_kwh = data.consumo_mensal_kwh - energia_compensada_kwh;
    
    // The bill after solar is the cost of non-compensated energy + availability cost + public lighting tax.
    const custo_disponibilidade_reais = custo_disponibilidade_kwh * tarifa_final_reais_kwh;
    // We assume the non-compensated part includes the availability cost.
    const consumo_faturado_com_gd_reais = consumo_nao_compensado_kwh * tarifa_final_reais_kwh;
    
    // Ensure the billed consumption isn't negative and add the fixed costs
    const conta_depois_reais = Math.max(custo_disponibilidade_reais, consumo_faturado_com_gd_reais) + data.cip_iluminacao_publica_reais;

    // 7. Savings and Financial Analysis
    const economia_mensal_reais = Math.max(0, conta_antes_reais - conta_depois_reais);
    const economia_anual_reais = economia_mensal_reais * 12;
    const economia_primeiro_ano = (economia_mensal_reais * 12) - data.custo_om_anual_reais;


    // Estimate system cost if not provided.
    const custo_modulos = quantidade_modulos * data.preco_modulo_reais;
    const custo_inversor = data.custo_inversor_reais;
    const custo_sistema_reais = data.custo_sistema_reais ?? (custo_modulos + custo_inversor + data.custo_fixo_instalacao_reais);
    
    const payback_simples_anos = economia_anual_reais > 0 ? (custo_sistema_reais / economia_anual_reais) : Infinity;

    return {
      parametros_entrada: data,
      calculos_intermediarios: {
        tarifa_final_reais_kwh,
        custo_disponibilidade_kwh,
        custo_disponibilidade_reais,
        eficiencia_efetiva_sistema,
        energia_produzida_por_modulo_mes_kwh,
      },
      conta_media_mensal_reais: {
        antes: conta_antes_reais,
        depois: conta_depois_reais,
      },
      dimensionamento: {
        quantidade_modulos,
        potencia_sistema_kwp,
      },
      geracao: {
        media_mensal_kwh: geracao_media_mensal_kwh,
      },
      balanco_energetico: {
        energia_compensada_kwh,
        consumo_faturado_apos_gd_kwh: consumo_nao_compensado_kwh,
        saldo_creditos_mes_kwh: Math.max(0, geracao_media_mensal_kwh - data.consumo_mensal_kwh),
      },
      economia_mensal_reais,
      economia_anual_reais,
      economia_primeiro_ano,
      payback_simples_anos,
      financeiro: {
          custo_sistema_reais
      }
    };
  }
);
