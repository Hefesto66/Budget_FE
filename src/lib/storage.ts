
import type { SolarCalculationInput, SolarCalculationResult } from "@/types";

// ====== TYPES ====== //
export interface Client {
  id: string;
  name: string;
  type: 'individual' | 'company';
  photo?: string | null;
  cnpj?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  cityState?: string;
  zip?: string;
  country?: string;
}

export interface Lead {
  id: string;
  title: string;
  clientId: string; // Added clientId
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

export interface Stage {
  id: string;
  title: string;
  description?: string;
  isWon?: boolean;
}


// ====== CONSTANTS ====== //
const LEADS_STORAGE_KEY = 'fe-solar-leads';
const QUOTES_STORAGE_KEY = 'fe-solar-quotes';
const QUOTE_COUNTER_KEY = 'fe-solar-quote-counter';
const STAGES_STORAGE_KEY = 'fe-solar-stages';
const CLIENTS_STORAGE_KEY = 'fe-solar-clients';


// ====== HELPERS ====== //
const getFromStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return null;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};


// ====== STAGE FUNCTIONS ====== //
const DEFAULT_STAGES: Stage[] = [
  { id: 'qualificacao', title: 'Qualificação', description: 'Leads iniciais que precisam ser contactados e avaliados.', isWon: false },
  { id: 'proposta', title: 'Proposta Enviada', description: 'Leads que receberam uma proposta formal.', isWon: false },
  { id: 'negociacao', title: 'Negociação', description: 'Discussão de termos, preços e condições com o cliente.', isWon: false },
  { id: 'ganho', title: 'Ganho', description: 'Vendas fechadas e contratos assinados.', isWon: true },
  { id: 'perdido', title: 'Perdido', description: 'Oportunidades que não avançaram.', isWon: false },
];

export const getStages = (): Stage[] => {
  const stages = getFromStorage<Stage[]>(STAGES_STORAGE_KEY);
  if (!stages || stages.length === 0) {
    saveToStorage(STAGES_STORAGE_KEY, DEFAULT_STAGES);
    return DEFAULT_STAGES;
  }
  return stages;
}

export const saveStages = (stages: Stage[]): void => {
  saveToStorage(STAGES_STORAGE_KEY, stages);
}


// ====== LEAD FUNCTIONS ====== //

export const getLeads = (): Lead[] => {
  return (getFromStorage<Lead[]>(LEADS_STORAGE_KEY)) || [];
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

export const deleteLead = (leadId: string): void => {
    let leads = getLeads();
    leads = leads.filter(lead => lead.id !== leadId);
    saveToStorage(LEADS_STORAGE_KEY, leads);
};


// ====== QUOTE FUNCTIONS ====== //

export const getQuotes = (): Quote[] => {
    return (getFromStorage<Quote[]>(QUOTES_STORAGE_KEY)) || [];
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

// ====== QUOTE COUNTER FUNCTIONS ====== //

export const getNextQuoteNumber = (): number => {
    const currentCounter = getFromStorage<number>(QUOTE_COUNTER_KEY) || 0;
    const nextCounter = currentCounter + 1;
    saveToStorage(QUOTE_COUNTER_KEY, nextCounter);
    return nextCounter;
};

export const generateNewQuoteId = (): string => {
    const number = getNextQuoteNumber();
    const paddedNumber = String(number).padStart(4, '0'); // Formats to 0001, 0002, etc.
    return `NX-S${paddedNumber}`;
}

// ====== CLIENT FUNCTIONS ====== //

export const getClients = (): Client[] => {
  return (getFromStorage<Client[]>(CLIENTS_STORAGE_KEY)) || [];
};

export const getClientById = (id: string): Client | undefined => {
  const clients = getClients();
  return clients.find(client => client.id === id);
};

export const saveClient = (newClient: Client): void => {
  const clients = getClients();
  const existingIndex = clients.findIndex(client => client.id === newClient.id);

  if (existingIndex > -1) {
    // Update existing client
    clients[existingIndex] = newClient;
  } else {
    // Add new client
    clients.push(newClient);
  }
  saveToStorage(CLIENTS_STORAGE_KEY, clients);
};
