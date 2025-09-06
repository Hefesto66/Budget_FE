
"use server";

import {
  suggestRefinedPanelConfig,
  type SuggestRefinedPanelConfigInput,
} from "@/ai/flows/suggest-refined-panel-config";
import {
  calculateSolar,
} from "@/ai/flows/calculate-solar";
import { revalidatePath } from "next/cache";
import type { SolarCalculationInput } from "@/types";

export async function getRefinedSuggestions(
  input: SuggestRefinedPanelConfigInput
) {
  try {
    const suggestion = await suggestRefinedPanelConfig(input);
    revalidatePath("/orcamento");
    return { success: true, data: suggestion };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return { success: false, error: "Falha ao obter sugestão da IA. A resposta pode ter sido bloqueada por filtros de segurança." };
  }
}

export async function getCalculation(input: SolarCalculationInput) {
  try {
    const result = await calculateSolar(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("================ ERROR IN CALCULATION ACTION ================");
    console.error(error);
    console.error("==========================================================");
    const errorMessage =
      error.cause?.message || "Falha ao calcular. Verifique os dados.";
    return { success: false, error: errorMessage };
  }
}
