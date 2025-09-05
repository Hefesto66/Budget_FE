
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export function formatDate(date: Date, formatStr: string = "dd/MM/yyyy") {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // Return a placeholder or empty string if the date is invalid
    return "Data inválida";
  }
  return dateFnsFormat(date, formatStr, { locale: ptBR });
}

    