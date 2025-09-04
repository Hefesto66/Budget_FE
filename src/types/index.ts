
import type { suggestRefinedPanelConfig, SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import type { calculateSolar } from "@/ai/flows/calculate-solar";
import { z } from "zod";

export const solarCalculationSchema = z.object({
  // Seção 1: Consumo e Fatura
  consumo_mensal_kwh: z.number().positive({ message: "O consumo mensal deve ser um número maior que zero." }),
  valor_medio_fatura_reais: z.number().positive({ message: "O valor da fatura deve ser maior que zero." }),
  cip_iluminacao_publica_reais: z.number().gte(0, { message: "O valor da CIP não pode ser negativo." }),
  adicional_bandeira_reais_kwh: z.number().gte(0).default(0),
  
  // Seção 2: Detalhes Técnicos
  concessionaria: z.enum(
      ["Equatorial GO", "CHESP"], 
      { errorMap: () => ({ message: 'Concessionária não suportada para esta região.' }) }
  ),
  rede_fases: z.enum(['mono', 'bi', 'tri']),
  irradiacao_psh_kwh_m2_dia: z.number().min(0.1, "Valor de irradiação muito baixo.").max(12, { message: "Valor de irradiação irreal. Verifique o dado." }),

  // Seção 3: Equipamentos e Custos
  // Módulos
  potencia_modulo_wp: z.number().positive({ message: "A potência do módulo deve ser maior que zero." }),
  preco_modulo_reais: z.number().positive({ message: "O preço do módulo deve ser maior que zero." }),
  quantidade_modulos: z.number().int().positive().optional(),
  fabricante_modulo: z.string().default(""),
  garantia_defeito_modulo_anos: z.number().int().positive().default(10),
  garantia_geracao_modulo_anos: z.number().int().positive().default(25),
  
  // Inversor
  modelo_inversor: z.string().default(""),
  fabricante_inversor: z.string().default(""),
  potencia_inversor_kw: z.number().positive(),
  tensao_inversor_v: z.number().positive(),
  quantidade_inversores: z.number().int().positive().default(1),
  garantia_inversor_anos: z.number().int().positive().default(5),
  eficiencia_inversor_percent: z.number().min(80).max(99, { message: "Eficiência do inversor deve estar entre 80% e 99%." }),
  custo_inversor_reais: z.number().positive({ message: "O custo do inversor deve ser maior que zero." }),

  // Custos e Perdas
  fator_perdas_percent: z.number().min(0).max(100, { message: "Fator de perdas deve estar entre 0% e 100%." }),
  custo_fixo_instalacao_reais: z.number().gte(0, { message: "O custo de instalação não pode ser negativo." }),
  custo_om_anual_reais: z.number().gte(0).default(0),
  
  // Advanced/Optional Fields
  meta_compensacao_percent: z.number().min(0).max(100).default(100),
  custo_sistema_reais: z.number().gte(0).optional(),
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

export type { SuggestRefinedPanelConfigOutput };
