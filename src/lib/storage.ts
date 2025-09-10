
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  runTransaction,
  addDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';

import type { Quote, Client, Stage, Lead, Product, HistoryEntry, CustomizationSettings, Salesperson, PaymentTerm, PriceList } from "@/types";
import type { CompanyFormData } from '@/app/minha-empresa/page';

const getCurrentUserId = (): string => {
    // In a real app, this would come from Firebase Auth.
    // For now, we use a static ID for consistent testing.
    return 'user__test_id_12345';
}

const checkDb = (): boolean => {
    if (!db) {
        console.warn("Firestore is not initialized. Cannot perform DB operations.");
        return false;
    }
    return true;
}

export interface CompanyData extends CompanyFormData {
    id: string;
    proposalSettings?: CustomizationSettings;
    lastQuoteNumber?: number;
}

// Settings and Company Data
export const saveCompanyData = async (data: CompanyFormData): Promise<void> => {
    if (!checkDb()) return;
    const userId = getCurrentUserId();
    const companyDocRef = doc(db!, 'companies', userId);
    await setDoc(companyDocRef, data, { merge: true });
}

export const getCompanyData = async (): Promise<CompanyData | null> => {
    if (!checkDb()) return null;
    const userId = getCurrentUserId();
    const companyDocRef = doc(db!, 'companies', userId);
    const docSnap = await getDoc(companyDocRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompanyData;
    }
    return null;
}

export const saveProposalSettings = async (settings: CustomizationSettings): Promise<void> => {
    if (!checkDb()) return;
    const userId = getCurrentUserId();
    const companyDocRef = doc(db!, 'companies', userId);
    await setDoc(companyDocRef, { proposalSettings: settings }, { merge: true });
}


// CRM Stages
const DEFAULT_STAGES: Stage[] = [
  { id: 'qualificacao', title: 'Qualificação', description: 'Leads iniciais que precisam ser contactados e avaliados.', isWon: false },
  { id: 'proposta', title: 'Proposta Enviada', description: 'Leads que receberam uma proposta formal.', isWon: false },
  { id: 'negociacao', title: 'Negociação', description: 'Discussão de termos, preços e condições com o cliente.', isWon: false },
  { id: 'ganho', title: 'Ganho', description: 'Vendas fechadas e contratos assinados.', isWon: true },
  { id: 'perdido', title: 'Perdido', description: 'Oportunidades que não avançaram.', isWon: false },
];

export const getStages = async (): Promise<Stage[]> => {
  if (!checkDb()) return DEFAULT_STAGES;
  const companyId = getCurrentUserId();
  const companyRef = doc(db!, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  const companyData = companySnap.data();
  return companyData?.stages || DEFAULT_STAGES;
}

export const saveStages = async (stages: Stage[]): Promise<void> => {
  if (!checkDb()) return;
  const companyId = getCurrentUserId();
  const stagesRef = doc(db!, 'companies', companyId);
  await setDoc(stagesRef, { stages: stages }, { merge: true });
}


// Clients
export const getClients = (callback: (clients: Client[]) => void): Unsubscribe => {
    if (!checkDb()) {
      callback([]);
      return () => {}; // Return a no-op unsubscribe function
    }
    const companyId = getCurrentUserId();
    const q = query(collection(db!, 'clients'), where('companyId', '==', companyId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        callback(clients);
    }, (error) => {
        console.error("Error listening to clients collection:", error);
        callback([]);
    });

    return unsubscribe;
}

export const getClientById = (id: string, callback: (client: Client | null) => void): Unsubscribe => {
    if (!checkDb()) {
        callback(null);
        return () => {};
    }
    const docRef = doc(db!, 'clients', id);
    const companyId = getCurrentUserId();

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().companyId === companyId) {
            callback({ id: docSnap.id, ...docSnap.data() } as Client);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error listening to client ${id}:`, error);
        callback(null);
    });
    
    return unsubscribe;
};

export const saveClient = async (
    clientData: Partial<Client>,
    options: { isNew: boolean, originalData?: ClientFormData | null }
): Promise<string> => {
    if (!checkDb()) return Promise.reject("Firestore not initialized");
    const companyId = getCurrentUserId();
    const dataToSave: Omit<Client, 'id' | 'history'> & { id?: string, history?: HistoryEntry[] } = {
        companyId,
        name: clientData.name || "Cliente sem nome",
        type: clientData.type || 'individual',
        ...clientData,
    };
    
    // Ensure history is an array
    if (!dataToSave.history) {
        dataToSave.history = [];
    }

    let clientId: string;

    if (!options.isNew && dataToSave.id) {
        clientId = dataToSave.id;
        const docRef = doc(db!, 'clients', clientId);
        
        let changesLog = "";
        if (options.originalData) {
            const changedFields = Object.keys(dataToSave).filter(key => 
                key !== 'tags' && 
                key !== 'id' && 
                key !== 'history' && 
                key !== 'companyId' &&
                options.originalData[key as keyof ClientFormData] !== dataToSave[key as keyof Client]
            );
            if(changedFields.length > 0) {
                changesLog = `Cliente atualizado: ${changedFields.join(', ')}.`;
            }
        }
        
        delete dataToSave.id; 
        await setDoc(docRef, dataToSave, { merge: true });
        if (changesLog) {
            await addHistoryEntry({ clientId, text: changesLog, type: 'log' });
        }
        
    } else {
        const docRef = await addDoc(collection(db!, 'clients'), dataToSave);
        clientId = docRef.id;
        await addHistoryEntry({ clientId, text: 'Cliente criado.', type: 'log' });
    }
    
    return clientId;
}


// History
export const addHistoryEntry = async (params: {
    clientId: string;
    text: string;
    type: HistoryEntry['type'];
    refId?: string;
    quoteInfo?: { leadId: string; clientId: string; };
}) => {
    if (!checkDb()) return;
    const clientRef = doc(db!, 'clients', params.clientId);
    
    try {
        await runTransaction(db!, async (transaction) => {
            const clientDoc = await transaction.get(clientRef);
            if (!clientDoc.exists()) {
                throw "Document does not exist!";
            }

            const currentHistory = clientDoc.data().history || [];
            
            const newEntry: HistoryEntry = {
                id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: new Date().toISOString(),
                text: params.text,
                type: params.type,
                refId: params.refId,
                quoteInfo: params.quoteInfo,
                author: params.type === 'note' ? 'Usuário' : 'Sistema'
            };
            
            const updatedHistory = [newEntry, ...currentHistory];
            transaction.update(clientRef, { history: updatedHistory });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
}


// Leads
export const getLeads = (callback: (leads: Lead[]) => void): Unsubscribe => {
    if (!checkDb()) {
        callback([]);
        return () => {};
    }
    const companyId = getCurrentUserId();
    const q = query(collection(db!, 'leads'), where('companyId', '==', companyId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const leads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        callback(leads);
    }, (error) => {
        console.error("Error listening to leads collection:", error);
        callback([]);
    });

    return unsubscribe;
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
    if (!checkDb()) return null;
    const companyId = getCurrentUserId();
    const docRef = doc(db!, 'leads', id);
    const docSnap = await getDoc(docRef);

     if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
};

export const saveLead = async (leadData: Partial<Lead>): Promise<string> => {
    if (!checkDb()) return Promise.reject("Firestore not initialized");
    const companyId = getCurrentUserId();
    const dataToSave = { ...leadData, companyId };

    if (dataToSave.id) {
        const leadId = dataToSave.id;
        const docRef = doc(db!, 'leads', leadId);
        delete dataToSave.id;
        await setDoc(docRef, dataToSave, { merge: true });
        return leadId;
    } else {
        const docRef = await addDoc(collection(db!, 'leads'), dataToSave);
        return docRef.id;
    }
};

export const deleteLead = async (leadId: string): Promise<void> => {
    if (!checkDb()) return;
    await deleteDoc(doc(db!, 'leads', leadId));
};


// Quotes
export const getQuoteById = async (id: string): Promise<Quote | null> => {
    if (!checkDb()) return null;
    const companyId = getCurrentUserId();
    const docRef = doc(db!, 'quotes', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        const leadWithQuoteId = query(collection(db!, "leads"), where("companyId", "==", companyId), where("id", "==", id));
        const leadSnapshot = await getDocs(leadWithQuoteId);
        if(!leadSnapshot.empty) {
            const leadDoc = leadSnapshot.docs[0];
            const quoteData = leadDoc.data() as Omit<Quote, 'billOfMaterials'>;
            
            const itemsSnapshot = await getDocs(collection(db!, 'leads', leadDoc.id, 'quoteItems'));
            const billOfMaterials = itemsSnapshot.docs.map(doc => doc.data());

            return { ...quoteData, id: leadDoc.id, billOfMaterials };
        }
        return null;
    }

    const quoteData = docSnap.data() as Omit<Quote, 'billOfMaterials'>;
    
    const itemsSnapshot = await getDocs(collection(db!, 'quotes', id, 'quoteItems'));
    const billOfMaterials = itemsSnapshot.docs.map(doc => doc.data());
    
    return { ...quoteData, id: docSnap.id, billOfMaterials };
}


export const getQuotesByLeadId = async (leadId: string): Promise<Quote[]> => {
    if (!checkDb()) return [];
    const companyId = getCurrentUserId();
    const q = query(collection(db!, "quotes"), where("companyId", "==", companyId), where("leadId", "==", leadId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
}

export const saveQuote = async (quote: Quote): Promise<void> => {
    if (!checkDb()) return;
    const companyId = getCurrentUserId();
    const { billOfMaterials, id, ...quoteData } = quote;
    const quoteRef = doc(db!, 'quotes', id);

    const batch = writeBatch(db!);

    batch.set(quoteRef, { ...quoteData, companyId, id });

    const itemsCollectionRef = collection(quoteRef, 'quoteItems');
    const existingItemsSnapshot = await getDocs(itemsCollectionRef);
    existingItemsSnapshot.forEach(doc => batch.delete(doc.ref));

    billOfMaterials.forEach((item) => {
        const itemRef = doc(itemsCollectionRef);
        batch.set(itemRef, item);
    });

    await batch.commit();
}

export const generateNewQuoteId = async (): Promise<string> => {
    if (!checkDb()) return Promise.reject("Firestore not initialized");
    const companyId = getCurrentUserId();
    const counterRef = doc(db!, 'companies', companyId);

    let newQuoteNumber: number = 1;
    try {
        await runTransaction(db!, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                transaction.set(counterRef, { lastQuoteNumber: 1 });
                newQuoteNumber = 1;
            } else {
                newQuoteNumber = (counterDoc.data().lastQuoteNumber || 0) + 1;
                transaction.update(counterRef, { lastQuoteNumber: newQuoteNumber });
            }
        });
        const paddedNumber = String(newQuoteNumber).padStart(4, '0');
        return `SOL-S${paddedNumber}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Failed to generate a new quote ID.");
    }
}


// Inventory / Products
export const getProducts = (callback: (products: Product[]) => void): Unsubscribe => {
    if (!checkDb()) {
        callback([]);
        return () => {};
    }
    const companyId = getCurrentUserId();
    const q = query(collection(db!, 'inventory'), where('companyId', '==', companyId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
    }, (error) => {
        console.error("Error listening to inventory collection:", error);
        callback([]);
    });

    return unsubscribe;
};

export const getProductById = async (id: string): Promise<Product | null> => {
    if (!checkDb()) return null;
    const docRef = doc(db!, 'inventory', id);
    const companyId = getCurrentUserId();
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    } else {
        return null;
    }
};

export const saveProduct = async (productData: Partial<Product>): Promise<string> => {
    if (!checkDb()) return Promise.reject("Firestore not initialized");
    const companyId = getCurrentUserId();
    const dataToSave = { ...productData, companyId };
    
    if (dataToSave.id) {
        const productId = dataToSave.id;
        const docRef = doc(db!, 'inventory', productId);
        delete dataToSave.id;
        await setDoc(docRef, dataToSave, { merge: true });
        return productId;
    } else {
        const docRef = await addDoc(collection(db!, 'inventory'), dataToSave);
        return docRef.id;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    if (!checkDb()) return;
    await deleteDoc(doc(db!, 'inventory', productId));
};

// Mock data for un-migrated features
export const getSalespersons = async (): Promise<Salesperson[]> => [{ id: 'sp-1', name: 'Vendedor Padrão' }];
export const getPaymentTerms = async (): Promise<PaymentTerm[]> => [{ id: 'pt-1', name: '30 Dias' }];
export const getPriceLists = async (): Promise<PriceList[]> => [{ id: 'pl-1', name: 'Tabela de Preços Padrão' }];
