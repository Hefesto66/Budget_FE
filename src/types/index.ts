
import type { suggestRefinedPanelConfig, SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import type { calculateSolar } from "@/ai/flows/calculate-solar";
import { z } from "zod";

export const solarCalculationSchema = z.object({
  // Seção 1: Consumo e Fatura
  consumo_mensal_kwh: z.number().positive({ message: "O consumo mensal deve ser um número maior que zero." }),
  valor_medio_fatura_reais: z.number().positive({ message: "O valor da fatura deve ser maior que zero." }),
  cip_iluminacao_publica_reais: z.number().gte(0, { message: "O valor da CIP não pode ser negativo." }),
  adicional_bandeira_reais_kwh: z.number().gte(0).default(0),
  
  // Seção 2: Detalhes Técnicos do Local
  concessionaria: z.enum(
      ["Equatorial GO", "CHESP"], 
      { errorMap: () => ({ message: 'Concessionária não suportada para esta região.' }) }
  ),
  rede_fases: z.enum(['mono', 'bi', 'tri']),
  irradiacao_psh_kwh_m2_dia: z.number().min(0.1, "Valor de irradiação muito baixo.").max(12, { message: "Valor de irradiação irreal. Verifique o dado." }),

  // Seção 3: Parâmetros de Cálculo (Derivados da BOM ou com valores padrão)
  // Módulos
  potencia_modulo_wp: z.number().positive().optional(),
  preco_modulo_reais: z.number().positive().optional(),
  quantidade_modulos: z.number().int().positive().optional(),
  fabricante_modulo: z.string().optional(),
  garantia_defeito_modulo_anos: z.number().int().positive().optional(),
  garantia_geracao_modulo_anos: z.number().int().positive().optional(),
  
  // Inversor
  modelo_inversor: z.string().optional(),
  fabricante_inversor: z.string().optional(),
  potencia_inversor_kw: z.number().positive().optional(),
  tensao_inversor_v: z.number().positive().optional(),
  quantidade_inversores: z.number().int().positive().optional(),
  garantia_inversor_anos: z.number().int().positive().optional(),
  eficiencia_inversor_percent: z.number().min(80).max(99).optional(),
  custo_inversor_reais: z.number().positive().optional(),

  // Custos e Perdas
  fator_perdas_percent: z.number().min(0).max(100).default(20),
  custo_fixo_instalacao_reais: z.number().gte(0).optional(),
  custo_om_anual_reais: z.number().gte(0).default(0),
  
  // Avançado
  meta_compensacao_percent: z.number().min(0).max(100).default(100),
  custo_sistema_reais: z.number().gte(0).optional(),
  
  // Vendas
  salespersonId: z.string().optional(),
  paymentTermId: z.string().optional(),
  priceListId: z.string().optional(),
});


export type SolarCalculationInput = z.infer<typeof solarCalculationSchema>;

export type SolarCalculationResult = Awaited<
  ReturnType<typeof calculateSolar>
>;


export type SavingsDataPoint = {
  year: number;
  "Economia Acumulada": number;
};

export const clientSchema = z.object({
  name: z.string().min(1, "O nome do cliente é obrigatório."),
  document: z.string().min(1, "O CPF ou CNPJ é obrigatório."),
  address: z.string().min(1, "O endereço é obrigatório."),
});

export type ClientFormData = z.infer<typeof clientSchema>;


export interface Quote {
    id: string;
    leadId: string;
    createdAt: string; // ISO string
    formData: SolarCalculationInput;
    results: SolarCalculationResult;
    billOfMaterials?: any[]; // Re-add billOfMaterials
}

export interface CustomizationSettings {
  colors: {
    primary: string;
    textOnPrimary: string;
  };
  content: {
    showInvestmentTable: boolean;
    showFinancialSummary: boolean;

    showSystemPerformance: boolean;
    showTerms: boolean;
    showGenerationChart: boolean;
    showSavingsChart: boolean;
    showEnvironmentalImpact: boolean;
    showEquipmentDetails: boolean;
    showTimeline: boolean;
  };
}
