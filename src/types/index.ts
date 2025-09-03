import type { suggestRefinedPanelConfig } from "@/ai/flows/suggest-refined-panel-config";

export type FormData = {
  consumption: number;
  bill: number;
  location: string;
  panelModel: string;
};

export type CalculationResults = {
  panelQuantity: number;
  totalCost: number;
  monthlySavings: number;
  annualSavings: number;
  paybackPeriod: number; 
  twentyFiveYearSavings: number;
  monthlyProduction: number;
  panelModel: string;
};

export type SavingsDataPoint = {
  year: number;
  "Economia Acumulada": number;
};

export type RefinedSuggestion = Awaited<ReturnType<typeof suggestRefinedPanelConfig>>;
