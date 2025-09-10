
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
  getDocs
} from 'firebase/firestore';

import type { Quote, Client, Stage, Lead, Product, HistoryEntry, CustomizationSettings, Salesperson, PaymentTerm, PriceList, ClientFormData } from "@/types";
import type { CompanyFormData } from '@/app/minha-empresa/page';

const getCurrentUserId = (): string => {
    // In a real app, this would come from Firebase Auth.
    // For now, we use a static ID for consistent testing.
    return 'user__test_id_12345';
}

export interface CompanyData extends CompanyFormData {
    id: string;
    proposalSettings?: CustomizationSettings;
    lastQuoteNumber?: number;
}

// Settings and Company Data
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


// CRM Stages
const DEFAULT_STAGES: Stage[] = [
  { id: 'qualificacao', title: 'Qualificação', description: 'Leads iniciais que precisam ser contactados e avaliados.', isWon: false },
  { id: 'proposta', title: 'Proposta Enviada', description: 'Leads que receberam uma proposta formal.', isWon: false },
  { id: 'negociacao', title: 'Negociação', description: 'Discussão de termos, preços e condições com o cliente.', isWon: false },
  { id: 'ganho', title: 'Ganho', description: 'Vendas fechadas e contratos assinados.', isWon: true },
  { id: 'perdido', title: 'Perdido', description: 'Oportunidades que não avançaram.', isWon: false },
];

export const getStages = async (): Promise<Stage[]> => {
  const companyId = getCurrentUserId();
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  const companyData = companySnap.data();
  return companyData?.stages || DEFAULT_STAGES;
}

export const saveStages = async (stages: Stage[]): Promise<void> => {
  const companyId = getCurrentUserId();
  const stagesRef = doc(db, 'companies', companyId);
  await setDoc(stagesRef, { stages: stages }, { merge: true });
}


// Clients
export const getClients = (callback: (clients: Client[]) => void): (() => void) => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'clients'), where('companyId', '==', companyId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        callback(clients);
    }, (error) => {
        console.error("Error listening to clients collection:", error);
        callback([]);
    });

    return unsubscribe;
}

export const getClientById = async (id: string, callback: (client: Client | null) => void): Promise<() => void> => {
    const docRef = doc(db, 'clients', id);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        const companyId = getCurrentUserId();
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
    const companyId = getCurrentUserId();
    const dataToSave: Omit<Client, 'id'> & { id?: string } = {
        companyId,
        name: clientData.name || "Cliente sem nome",
        type: clientData.type || 'individual',
        history: clientData.history || [],
        ...clientData,
    };

    let clientId: string;

    if (!options.isNew && dataToSave.id) {
        clientId = dataToSave.id;
        const docRef = doc(db, 'clients', clientId);
        
        let changesLog = "";
        if (options.originalData) {
            const changedFields = Object.keys(dataToSave).filter(key => 
                key !== 'tags' && 
                key !== 'id' && 
                key !== 'history' && 
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
        const docRef = await addDoc(collection(db, 'clients'), dataToSave);
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
    const clientRef = doc(db, 'clients', params.clientId);
    
    try {
        await runTransaction(db, async (transaction) => {
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
export const getLeads = (callback: (leads: Lead[]) => void): (() => void) => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'leads'), where('companyId', '==', companyId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const leads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        callback(leads);
    }, (error) => {
        console.error("Error listening to leads collection:", error);
        callback([]);
    });

    return unsubscribe;
};

export const getLeadById = async (id: string, callback: (lead: Lead | null) => void): Promise<() => void> => {
    const docRef = doc(db, 'leads', id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        const companyId = getCurrentUserId();
        if (docSnap.exists() && docSnap.data().companyId === companyId) {
            callback({ id: docSnap.id, ...docSnap.data() } as Lead);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error listening to lead ${id}:`, error);
        callback(null);
    });
    
    return unsubscribe;
};

export const saveLead = async (leadData: Partial<Lead>): Promise<string> => {
    const companyId = getCurrentUserId();
    const dataToSave = { ...leadData, companyId };

    if (dataToSave.id) {
        const leadId = dataToSave.id;
        const docRef = doc(db, 'leads', leadId);
        delete dataToSave.id;
        await setDoc(docRef, dataToSave, { merge: true });
        return leadId;
    } else {
        const docRef = await addDoc(collection(db, 'leads'), dataToSave);
        return docRef.id;
    }
};

export const deleteLead = async (leadId: string): Promise<void> => {
    await deleteDoc(doc(db, 'leads', leadId));
};


// Quotes
export const getQuoteById = async (id: string): Promise<Quote | null> => {
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'quotes', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().companyId !== companyId) {
        return null;
    }

    const quoteData = docSnap.data() as Omit<Quote, 'billOfMaterials'>;
    
    const itemsSnapshot = await getDocs(collection(db, 'quotes', id, 'quoteItems'));
    const billOfMaterials = itemsSnapshot.docs.map(doc => doc.data());
    
    return { ...quoteData, id: docSnap.id, billOfMaterials };
}

export const getQuotesByLeadId = async (leadId: string): Promise<Quote[]> => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, "quotes"), where("companyId", "==", companyId), where("leadId", "==", leadId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
}

export const saveQuote = async (quote: Quote): Promise<void> => {
    const companyId = getCurrentUserId();
    const { billOfMaterials, id, ...quoteData } = quote;
    const quoteRef = doc(db, 'quotes', id);

    const batch = writeBatch(db);

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
    const companyId = getCurrentUserId();
    const counterRef = doc(db, 'companies', companyId);

    let newQuoteNumber: number = 1;
    try {
        await runTransaction(db, async (transaction) => {
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
export const getProducts = (callback: (products: Product[]) => void): (() => void) => {
    const companyId = getCurrentUserId();
    const q = query(collection(db, 'inventory'), where('companyId', '==', companyId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
    }, (error) => {
        console.error("Error listening to inventory collection:", error);
        callback([]);
    });

    return unsubscribe;
};

export const getProductById = async (id: string, callback: (product: Product | null) => void): Promise<() => void> => {
    const docRef = doc(db, 'inventory', id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        const companyId = getCurrentUserId();
        if (docSnap.exists() && docSnap.data().companyId === companyId) {
            callback({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error listening to product ${id}:`, error);
        callback(null);
    });

    return unsubscribe;
};


export const saveProduct = async (productData: Partial<Product>): Promise<string> => {
    const companyId = getCurrentUserId();
    const dataToSave = { ...productData, companyId };
    
    if (dataToSave.id) {
        const productId = dataToSave.id;
        const docRef = doc(db, 'inventory', productId);
        delete dataToSave.id;
        await setDoc(docRef, dataToSave, { merge: true });
        return productId;
    } else {
        const docRef = await addDoc(collection(db, 'inventory'), dataToSave);
        return docRef.id;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    await deleteDoc(doc(db, 'inventory', productId));
};

// Mock data for un-migrated features
export const getSalespersons = async (): Promise<Salesperson[]> => [{ id: 'sp-1', name: 'Vendedor Padrão' }];
export const getPaymentTerms = async (): Promise<PaymentTerm[]> => [{ id: 'pt-1', name: '30 Dias' }];
export const getPriceLists = async (): Promise<PriceList[]> => [{ id: 'pl-1', name: 'Tabela de Preços Padrão' }];
