import type { suggestRefinedPanelConfig, SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import type { calculateSolar, solarCalculationSchema } from "@/ai/flows/calculate-solar";
import { z } from "zod";

export type SolarCalculationInput = z.infer<typeof solarCalculationSchema>;
export type SolarCalculationResult = Awaited<ReturnType<typeof calculateSolar>>;

export type SavingsDataPoint = {
  year: number;
  "Economia Acumulada": number;
};

export type { SuggestRefinedPanelConfigOutput };
