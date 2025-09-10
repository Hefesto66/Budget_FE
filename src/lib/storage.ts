
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  runTransaction,
  increment,
  addDoc
} from 'firebase/firestore';

import type { Quote, Client, Stage, Lead, Product, HistoryEntry, CustomizationSettings } from "@/types";
import type { CompanyFormData } from '@/app/minha-empresa/page';

// =================================================================
// SIMULATED AUTHENTICATION
// =================================================================
// In a real app, this would come from Firebase Auth.
// For now, we use a hardcoded user ID to simulate a logged-in user.
// This is the key to our multi-tenant architecture.
const getCurrentUserId = (): string => {
    return 'user__test_id_12345';
}

// =================================================================
// TYPES & SCHEMAS (Firestore-specific)
// =================================================================

export interface CompanyData extends CompanyFormData {
    id: string;
    proposalSettings?: CustomizationSettings;
    lastQuoteNumber?: number;
}

// =================================================================
// COMPANY DATA FUNCTIONS
// =================================================================

export const saveCompanyData = async (data: CompanyFormData): Promise<void> => {
    const userId = getCurrentUserId();
    const companyDocRef = doc(db, 'companies', userId);
    await setDoc(companyDocRef, data, { merge: true });
}

export const getCompanyData = async (): Promise<CompanyData | null> => {
    const userId = getCurrentUserId();
    const companyDocRef = doc(db, 'companies', userId);
    const docSnap = await getDoc(companyDocRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompanyData;
    }
    return null;
}

export const saveProposalSettings = async (settings: CustomizationSettings): Promise<void> => {
    const userId = getCurrentUserId();
    const companyDocRef = doc(db, 'companies', userId);
    await setDoc(companyDocRef, { proposalSettings: settings }, { merge: true });
}


// ====== STAGE FUNCTIONS ====== //
const DEFAULT_STAGES: Stage[] = [
  { id: 'qualificacao', title: 'Qualificação', description: 'Leads iniciais que precisam ser contactados e avaliados.', isWon: false },
  { id: 'proposta', title: 'Proposta Enviada', description: 'Leads que receberam uma proposta formal.', isWon: false },
  { id: 'negociacao', title: 'Negociação', description: 'Discussão de termos, preços e condições com o cliente.', isWon: false },
  { id: 'ganho', title: 'Ganho', description: 'Vendas fechadas e contratos assinados.', isWon: true },
  { id: 'perdido', title: 'Perdido', description: 'Oportunidades que não avançaram.', isWon: false },
];

export const getStages = (): Stage[] => {
  // For now, stages are static and not per-company. This could be changed later.
  return DEFAULT_STAGES;
}

export const saveStages = (stages: Stage[]): void => {
  // This would need to be implemented if stages become company-specific
  console.warn("saveStages is not implemented for Firestore yet.");
}


// ====== CLIENT FUNCTIONS ====== //

export const getClients = async (): Promise<Client[]> => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'clients'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
}

export const getClientById = async (id: string): Promise<Client | null> => {
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'clients', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Client;
    }
    return null;
}

export const saveClient = async (clientData: Partial<Client>): Promise<string> => {
    const companyId = getCurrentUserId();
    const dataToSave = { ...clientData, companyId };
    
    if (dataToSave.id) {
        const docRef = doc(db, 'clients', dataToSave.id);
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave.id;
    } else {
        const docRef = await addDoc(collection(db, 'clients'), dataToSave);
        return docRef.id;
    }
}

export const addHistoryEntry = async (params: {
    clientId: string;
    text: string;
    type: HistoryEntry['type'];
    refId?: string;
    quoteInfo?: { leadId: string; clientId: string; };
}) => {
    const client = await getClientById(params.clientId);
    if (!client) return;

    const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: params.text,
        type: params.type,
        refId: params.refId,
        quoteInfo: params.quoteInfo,
        author: params.type === 'note' ? 'Usuário' : 'Sistema'
    };
    
    const updatedHistory = [newEntry, ...(client.history || [])];
    await saveClient({ ...client, history: updatedHistory });
}

// ====== LEAD FUNCTIONS ====== //

export const getLeads = async (): Promise<Lead[]> => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'leads'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'leads', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
};

export const saveLead = async (leadData: Partial<Lead>): Promise<string> => {
    const companyId = getCurrentUserId();
    const dataToSave = { ...leadData, companyId };

    if (dataToSave.id) {
        const docRef = doc(db, 'leads', dataToSave.id);
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave.id;
    } else {
        const docRef = await addDoc(collection(db, 'leads'), dataToSave);
        return docRef.id;
    }
};

export const deleteLead = async (leadId: string): Promise<void> => {
    // We should also delete associated quotes, but for simplicity, we'll just delete the lead for now.
    await deleteDoc(doc(db, 'leads', leadId));
};


// ====== QUOTE FUNCTIONS ====== //

export const getQuoteById = async (id: string): Promise<Quote | null> => {
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'quotes', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().companyId !== companyId) {
        return null;
    }

    const quoteData = docSnap.data() as Quote;
    
    // Fetch sub-collection
    const itemsSnapshot = await getDocs(collection(db, 'quotes', id, 'quoteItems'));
    quoteData.billOfMaterials = itemsSnapshot.docs.map(doc => doc.data());
    
    return { ...quoteData, id: docSnap.id };
}

export const getQuotesByLeadId = async (leadId: string): Promise<Quote[]> => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, "quotes"), where("companyId", "==", companyId), where("leadId", "==", leadId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
}

export const saveQuote = async (quote: Quote): Promise<void> => {
    const companyId = getCurrentUserId();
    const { billOfMaterials, ...quoteData } = quote;
    const quoteRef = doc(db, 'quotes', quote.id);

    const batch = writeBatch(db);

    batch.set(quoteRef, { ...quoteData, companyId });

    // Handle sub-collection for bill of materials
    billOfMaterials.forEach((item) => {
        const itemRef = doc(collection(quoteRef, 'quoteItems')); // Auto-generate ID for each item
        batch.set(itemRef, item);
    });

    await batch.commit();
}

export const generateNewQuoteId = async (): Promise<string> => {
    const companyId = getCurrentUserId();
    const counterRef = doc(db, 'companies', companyId);

    let newQuoteNumber: number;
    try {
        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                // Initialize the counter if it doesn't exist
                newQuoteNumber = 1;
                transaction.set(counterRef, { lastQuoteNumber: newQuoteNumber }, { merge: true });
            } else {
                const currentNumber = counterDoc.data().lastQuoteNumber || 0;
                newQuoteNumber = currentNumber + 1;
                transaction.update(counterRef, { lastQuoteNumber: newQuoteNumber });
            }
        });
        const paddedNumber = String(newQuoteNumber!).padStart(4, '0');
        return `SOL-S${paddedNumber}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Failed to generate a new quote ID.");
    }
}


// ====== PRODUCT (INVENTORY) FUNCTIONS ====== //

export const getProducts = async (): Promise<Product[]> => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'inventory'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'inventory', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
};

export const saveProduct = async (productData: Partial<Product>): Promise<string> => {
    const companyId = getCurrentUserId();
    const dataToSave = { ...productData, companyId };
    
    if (dataToSave.id) {
        const docRef = doc(db, 'inventory', dataToSave.id);
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave.id;
    } else {
        const docRef = await addDoc(collection(db, 'inventory'), dataToSave);
        return docRef.id;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    // In a real app, you should check if the product is in use in any quotes before deleting.
    await deleteDoc(doc(db, 'inventory', productId));
};

// ====== SALES CONFIG FUNCTIONS ====== //
// For now, these will remain static as they are not company-specific yet.
export const getSalespersons = () => [{ id: 'sp-1', name: 'Vendedor Padrão' }];
export const getPaymentTerms = () => [{ id: 'pt-1', name: '30 Dias' }];
export const getPriceLists = () => [{ id: 'pl-1', name: 'Tabela de Preços Padrão' }];

    