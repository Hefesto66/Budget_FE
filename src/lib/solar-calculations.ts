import type { FormData, CalculationResults } from "@/types";
import { LOCATIONS, PANEL_MODELS } from "./constants";

const PERFORMANCE_FACTOR = 0.8; // System losses (inverter, wiring, dirt)
const SYSTEM_COST_MULTIPLIER = 1.8; // Multiplier on panel cost to account for inverter, installation, etc.

export function calculateSystem(data: FormData & { panelQuantity?: number }): CalculationResults {
  const locationData = LOCATIONS.find((l) => l.value === data.location);
  const panelModelData = PANEL_MODELS.find((p) => p.value === data.panelModel);

  if (!locationData || !panelModelData) {
    throw new Error("Invalid location or panel model");
  }

  const dailySunHours = locationData.irradiation;
  const panelPower = panelModelData.power;
  const energyTariff = data.bill / data.consumption;

  // Calculate required monthly production (add 10% buffer)
  const requiredMonthlyProduction = data.consumption * 1.05;

  // Calculate how many panels are needed if not provided
  const calculatedPanelQuantity = data.panelQuantity ?? Math.ceil(
    (requiredMonthlyProduction * 1000) / (panelPower * dailySunHours * 30 * PERFORMANCE_FACTOR)
  );

  const panelQuantity = calculatedPanelQuantity > 0 ? calculatedPanelQuantity : 1;

  // Calculate total system cost
  const totalCost = panelQuantity * panelModelData.price * SYSTEM_COST_MULTIPLIER;

  // Calculate energy production
  const monthlyProduction = (panelQuantity * panelPower * dailySunHours * 30 * PERFORMANCE_FACTOR) / 1000; // in kWh

  // Calculate savings
  // Savings are capped at user's consumption, as they can't sell back more than they use in this model
  const effectiveMonthlyProduction = Math.min(monthlyProduction, data.consumption);
  const monthlySavings = effectiveMonthlyProduction * energyTariff;
  const annualSavings = monthlySavings * 12;

  // Calculate payback period
  const paybackPeriod = annualSavings > 0 ? totalCost / annualSavings : Infinity;

  // Calculate total savings over 25 years (lifespan of panels)
  const twentyFiveYearSavings = annualSavings * 25;

  return {
    panelQuantity,
    totalCost,
    monthlySavings,
    annualSavings,
    paybackPeriod,
    twentyFiveYearSavings,
    monthlyProduction,
    panelModel: panelModelData.value,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number, decimalPlaces = 0) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(value);
}
