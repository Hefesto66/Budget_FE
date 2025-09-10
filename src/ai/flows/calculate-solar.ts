
'use server';
/**
 * @fileOverview A server-side solar calculation service based on detailed business rules.
 * This function now operates independently of any client-side Firebase SDK.
 * - calculateSolar - A function that handles the solar calculation process.
 */

import { solarCalculationSchema, type SolarCalculationInput } from '@/types';

// This is a pure business logic function, it doesn't need Genkit or Firebase Admin.
// It was kept inside the /ai/flows directory to maintain the project structure,
// but it's now a standard server-side calculation module.

const DISPONIBILITY_COST_KWH: Record<string, number> = {
    mono: 30,
    bi: 50,
    tri: 100,
};

// =================================================================
// Funções de Cálculo Financeiro Avançado (VPL e TIR)
// =================================================================

/**
 * Calcula o Valor Presente Líquido (VPL) de um fluxo de caixa.
 * @param cashFlow - Um array de números representando o fluxo de caixa (o primeiro valor é o investimento inicial, negativo).
 * @param discountRate - A taxa de desconto (ex: 0.1 para 10%).
 * @returns O VPL.
 */
function calculateNPV(cashFlow: number[], discountRate: number): number {
  let npv = cashFlow[0]; // Investimento inicial
  for (let i = 1; i < cashFlow.length; i++) {
    npv += cashFlow[i] / Math.pow(1 + discountRate, i);
  }
  return npv;
}

/**
 * Calcula a Taxa Interna de Retorno (TIR) usando o método de Newton-Raphson.
 * @param cashFlow - O fluxo de caixa.
 * @returns A TIR como uma fração (ex: 0.15 para 15%).
 */
function calculateIRR(cashFlow: number[]): number {
  const maxIterations = 1000;
  const tolerance = 1e-6;
  let guess = 0.1; // Chute inicial para a TIR

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0; // Derivada do VPL

    for (let t = 0; t < cashFlow.length; t++) {
      npv += cashFlow[t] / Math.pow(1 + guess, t);
      if (t > 0) {
        dNpv -= t * cashFlow[t] / Math.pow(1 + guess, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return guess; // Encontrou a raiz
    }

    if (dNpv === 0) {
      break; // Evitar divisão por zero
    }
    
    guess = guess - npv / dNpv; // Próximo chute
  }

  return Infinity; // Não convergiu
}

// This function is now the primary export and can be called directly.
export async function calculateSolar(data: SolarCalculationInput) {
    // 1. Validate Inputs & Apply Defaults
    const validatedData = solarCalculationSchema.parse(data);

    if (!validatedData.consumo_mensal_kwh || validatedData.consumo_mensal_kwh <= 0) {
      throw new Error("O consumo mensal (kWh) é um dado essencial para o cálculo financeiro e deve ser maior que zero.");
    }
    
    // Assegura que potência e quantidade venham do input, caso contrário, default para 0.
    const potencia_modulo_wp = validatedData.potencia_modulo_wp ?? 0;
    const quantidade_modulos = validatedData.quantidade_modulos ?? 0;
    
    // Default efficiency to 97% if it's null, undefined.
    const eficiencia_inversor = (validatedData.eficiencia_inversor_percent ?? 97) / 100;
    const fator_perdas = (validatedData.fator_perdas_percent ?? 20) / 100;
    
    // Novos parâmetros de projeção com valores padrão robustos
    const inflacao_energetica = (validatedData.inflacao_energetica_anual_percent ?? 8.0) / 100;
    const degradacao_paineis = (validatedData.degradacao_anual_paineis_percent ?? 0.5) / 100;
    const taxa_desconto = (validatedData.taxa_minima_atratividade_percent ?? 6.0) / 100;


    // 2. Calculate System Efficiency
    const eficiencia_sistema = eficiencia_inversor * (1 - fator_perdas);

    // 3. Calculate Final System Specs
    const potencia_modulo_kw = potencia_modulo_wp / 1000;
    const potencia_pico_final_kw = potencia_modulo_kw * quantidade_modulos;

    // 4. Calculate Energy Generation
    const geracao_diaria_kwh = potencia_pico_final_kw * validatedData.irradiacao_psh_kwh_m2_dia * eficiencia_sistema;
    const geracao_media_mensal_kwh = geracao_diaria_kwh * 30;

    // 5. Calculate Financials
    const tarifa_energia_reais_kwh = validatedData.consumo_mensal_kwh > 0 ? validatedData.valor_medio_fatura_reais / validatedData.consumo_mensal_kwh : 0;
    const tarifa_final_reais_kwh = tarifa_energia_reais_kwh + validatedData.adicional_bandeira_reais_kwh;
    
    const conta_antes_reais = validatedData.valor_medio_fatura_reais;
    
    const custo_disponibilidade_kwh = DISPONIBILITY_COST_KWH[validatedData.rede_fases];
    const energia_compensada_kwh = Math.min(geracao_media_mensal_kwh, Math.max(0, validatedData.consumo_mensal_kwh - custo_disponibilidade_kwh));
    const consumo_nao_compensado_kwh = validatedData.consumo_mensal_kwh - energia_compensada_kwh;

    const custo_disponibilidade_reais = custo_disponibilidade_kwh * tarifa_final_reais_kwh;
    const consumo_faturado_com_gd_reais = consumo_nao_compensado_kwh * tarifa_final_reais_kwh;

    const conta_depois_reais = Math.max(custo_disponibilidade_reais, consumo_faturado_com_gd_reais) + validatedData.cip_iluminacao_publica_reais;
    
    const economia_mensal_reais = Math.max(0, conta_antes_reais - conta_depois_reais);
    const economia_anual_reais = economia_mensal_reais * 12;
    const economia_primeiro_ano = (economia_mensal_reais * 12) - (validatedData.custo_om_anual_reais ?? 0);
    
    const custo_sistema_reais = validatedData.custo_sistema_reais ?? 0;

    const payback_simples_anos = economia_anual_reais > 0 ? (custo_sistema_reais / economia_anual_reais) : Infinity;

    // 6. Advanced Financials (Cash Flow, NPV, IRR) for 25 years
    const cashFlow: number[] = [-custo_sistema_reais]; // Ano 0 é o investimento
    let geracaoAnualKwh = geracao_media_mensal_kwh * 12;
    let tarifaAtualizada = tarifa_final_reais_kwh;

    for (let ano = 1; ano <= 25; ano++) {
      if (ano > 1) {
          geracaoAnualKwh *= (1 - degradacao_paineis);
          tarifaAtualizada *= (1 + inflacao_energetica);
      }
      
      const economiaDoAno = (geracaoAnualKwh * tarifaAtualizada) - (validatedData.custo_om_anual_reais ?? 0);
      cashFlow.push(economiaDoAno);
    }
    
    const npv = taxa_desconto > -1 ? calculateNPV(cashFlow, taxa_desconto) : 0;
    const irr = calculateIRR(cashFlow);

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
        custo_sistema_reais: Number(custo_sistema_reais.toFixed(2)),
        vpl_reais: Number(npv.toFixed(2)),
        tir_percentual: isFinite(irr) ? Number((irr * 100).toFixed(2)) : Infinity,
        cash_flow_reais: cashFlow.map(v => Number(v.toFixed(2))),
      },
      conta_media_mensal_reais: {
          antes: Number(conta_antes_reais.toFixed(2)),
          depois: Number(conta_depois_reais.toFixed(2)),
      },
      warnings: [],
      recommendations: ["Verificar limites de conexão, medição e DC/AC máximo aceito pela concessionária local."]
    };
}
