"use server";

import {
  suggestRefinedPanelConfig,
  type SuggestRefinedPanelConfigInput,
} from "@/ai/flows/suggest-refined-panel-config";
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
