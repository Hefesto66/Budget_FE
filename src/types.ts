
import { z } from "zod";

// =================================================================
// Esquema Principal de Cálculo Solar
// =================================================================

export const solarCalculationSchema = z.object({
  // Dados de entrada do cliente
  consumo_mensal_kwh: z.number({ required_error: "O consumo é obrigatório."}).min(1, "O consumo deve ser maior que zero."),
  valor_medio_fatura_reais: z.number({ required_error: "O valor da fatura é obrigatório."}).min(1, "O valor da fatura deve ser maior que zero."),
  
  // Parâmetros de localização e rede
  irradiacao_psh_kwh_m2_dia: z.number().positive().default(5.7),
  rede_fases: z.enum(["mono", "bi", "tri"], { required_error: "O tipo de rede é obrigatório."}).default("mono"),
  
  // Parâmetros técnicos do sistema (serão preenchidos a partir da lista de materiais)
  quantidade_modulos: z.number().int().positive().optional(),
  potencia_modulo_wp: z.number().positive().optional(),
  eficiencia_inversor_percent: z.number().positive().optional(),

  // Parâmetros de custo (serão preenchidos a partir da lista de materiais)
  custo_sistema_reais: z.number().positive().optional(),
  
  // Parâmetros financeiros e de projeção (com valores padrão)
  fator_perdas_percent: z.number().default(20),
  adicional_bandeira_reais_kwh: z.number().default(0),
  cip_iluminacao_publica_reais: z.number().default(25),
  custo_om_anual_reais: z.number().default(150),
  meta_compensacao_percent: z.number().default(100),
  inflacao_energetica_anual_percent: z.number().default(8.0),
  degradacao_anual_paineis_percent: z.number().default(0.5),
  taxa_minima_atratividade_percent: z.number().default(6.0),

  // Campos de CRM (opcionais)
  salespersonId: z.string().optional(),
  paymentTermId: z.string().optional(),
  priceListId: z.string().optional(),
});


// =================================================================
// Tipos Derivados
// =================================================================

export type SolarCalculationInput = z.infer<typeof solarCalculationSchema>;

export interface SolarCalculationResult {
  dimensionamento: {
    potencia_sistema_kwp: number;
    quantidade_modulos: number;
  };
  geracao: {
    media_diaria_kwh: number;
    media_mensal_kwh: number;
    eficiencia_sistema: number;
  };
  financeiro: {
    economia_mensal_reais: number;
    economia_anual_reais: number;
    economia_primeiro_ano: number;
    payback_simples_anos: number;
    custo_sistema_reais: number;
    vpl_reais: number;
    tir_percentual: number;
    cash_flow_reais: number[];
  };
  conta_media_mensal_reais: {
    antes: number;
    depois: number;
  };
  warnings: string[];
  recommendations: string[];
}

export interface SavingsDataPoint {
  year: number;
  "Economia Acumulada": number;
}

export const clientSchema = z.object({
  name: z.string().min(1, "O nome do cliente é obrigatório."),
  document: z.string().optional(),
  address: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export interface CustomizationSettings {
  colors: {
    primary: string;
    textOnPrimary: string;
  };
  content: {
    showInvestmentTable: boolean;
    showPriceColumns: boolean; // <-- Nova propriedade
    showFinancialSummary: boolean;
    showSystemPerformance: boolean;
    showSavingsChart: boolean;
    showAdvancedAnalysis: boolean;
    showNextSteps: boolean;
  };
  footer: {
    customText: string;
  }
}

export interface Quote {
    id: string;
    leadId: string;
    createdAt: string; // ISO string
    formData: SolarCalculationInput;
    results: SolarCalculationResult;
    billOfMaterials: any[];
}
