
import type { SolarCalculationInput, SolarCalculationResult } from "@/types";

// ====== TYPES ====== //
export interface Lead {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage: string;
}

export interface Quote {
    id: string;
    leadId: string;
    createdAt: string; // ISO string
    formData: SolarCalculationInput;
    results: SolarCalculationResult;
}


// ====== CONSTANTS ====== //
const LEADS_STORAGE_KEY = 'fe-solar-leads';
const QUOTES_STORAGE_KEY = 'fe-solar-quotes';


// ====== HELPERS ====== //
const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};


// ====== LEAD FUNCTIONS ====== //

export const getLeads = (): Lead[] => {
  return getFromStorage<Lead>(LEADS_STORAGE_KEY);
};

export const getLeadById = (id: string): Lead | undefined => {
  const leads = getLeads();
  return leads.find(lead => lead.id === id);
};

export const saveLead = (newLead: Lead): void => {
  const leads = getLeads();
  const existingIndex = leads.findIndex(lead => lead.id === newLead.id);

  if (existingIndex > -1) {
    // Update existing lead
    leads[existingIndex] = newLead;
  } else {
    // Add new lead
    leads.push(newLead);
  }
  saveToStorage(LEADS_STORAGE_KEY, leads);
};


// ====== QUOTE FUNCTIONS ====== //

export const getQuotes = (): Quote[] => {
    return getFromStorage<Quote>(QUOTES_STORAGE_KEY);
}

export const getQuoteById = (id: string): Quote | undefined => {
    const quotes = getQuotes();
    return quotes.find(quote => quote.id === id);
}

export const getQuotesByLeadId = (leadId: string): Quote[] => {
    const quotes = getQuotes();
    return quotes.filter(quote => quote.leadId === leadId);
}

export const saveQuote = (newQuote: Quote): void => {
    const quotes = getQuotes();
    const existingIndex = quotes.findIndex(quote => quote.id === newQuote.id);

    if (existingIndex > -1) {
        // Update existing quote
        quotes[existingIndex] = newQuote;
    } else {
        // Add new quote
        quotes.push(newQuote);
    }
    saveToStorage(QUOTES_STORAGE_KEY, quotes);
}
