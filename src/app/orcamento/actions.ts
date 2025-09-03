"use server";

import {
  suggestRefinedPanelConfig,
  type SuggestRefinedPanelConfigInput,
} from "@/ai/flows/suggest-refined-panel-config";
import {
  calculateSolar,
  type SolarCalculationInput,
} from "@/ai/flows/calculate-solar";
import { revalidatePath } from "next/cache";

export async function getRefinedSuggestions(
  input: SuggestRefinedPanelConfigInput
) {
  try {
    const suggestion = await suggestRefinedPanelConfig(input);
    revalidatePath("/orcamento");
    return { success: true, data: suggestion };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return { success: false, error: "Falha ao obter sugestão da IA." };
  }
}

export async function getCalculation(input: SolarCalculationInput) {
  try {
    const result = await calculateSolar(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Calculation failed:", error);
    const errorMessage =
      error.cause?.message || "Falha ao calcular. Verifique os dados.";
    return { success: false, error: errorMessage };
  }
}
