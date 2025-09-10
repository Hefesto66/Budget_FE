
import { dbReady } from './firebase';
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
import type { ClientFormData } from '@/app/clientes/[clientId]/page';

const getCurrentUserId = (): string => {
    // Para desenvolvimento, usamos um ID estático e fixo.
    // Numa aplicação de produção com autenticação real,
    // isto seria substituído por `firebase.auth().currentUser.uid`.
    // Este valor DEVE corresponder ao valor nas regras de segurança do Firestore para desenvolvimento.
    return 'dev_company_id_placeholder';
}

const checkDb = async (): Promise<boolean> => {
    const db = await dbReady;
    if (!db) {
        if (typeof window !== 'undefined') {
             console.warn("Firestore is not initialized. Operations will be skipped.");
        }
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
    const db = await dbReady;
    if (!db) return;
    const userId = getCurrentUserId();
    const companyDocRef = doc(db, 'companies', userId);
    await setDoc(companyDocRef, data, { merge: true });
}

export const getCompanyData = async (): Promise<CompanyData | null> => {
    const db = await dbReady;
    if (!db) return null;
    const userId = getCurrentUserId();
    const companyDocRef = doc(db, 'companies', userId);
    try {
        const docSnap = await getDoc(companyDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CompanyData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching company data:", error);
        return null;
    }
}

export const saveProposalSettings = async (settings: CustomizationSettings): Promise<void> => {
    const db = await dbReady;
    if (!db) return;
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
  const db = await dbReady;
  if (!db) return DEFAULT_STAGES;
  const companyId = getCurrentUserId();
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  const companyData = companySnap.data();
  return companyData?.stages || DEFAULT_STAGES;
}

export const saveStages = async (stages: Stage[]): Promise<void> => {
  const db = await dbReady;
  if (!db) return;
  const companyId = getCurrentUserId();
  const stagesRef = doc(db, 'companies', companyId);
  await setDoc(stagesRef, { stages: stages }, { merge: true });
}


// Clients
export const getClients = (callback: (clients: Client[]) => void): Unsubscribe => {
    dbReady.then(db => {
        if (!db) {
          callback([]);
          return () => {};
        }
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
    });

    return () => {};
}

export const getClientById = async (id: string): Promise<Client | null> => {
    const db = await dbReady;
    if (!db) return null;
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'clients', id);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().companyId === companyId) {
            return { id: docSnap.id, ...docSnap.data() } as Client;
        }
        return null;
    } catch (error) {
        console.error("Error fetching client by ID:", error);
        return null;
    }
};

export const saveClient = async (
    clientData: Partial<Client>,
    options: { isNew: boolean, originalData?: ClientFormData | null }
): Promise<string> => {
    const db = await dbReady;
    if (!db) return Promise.reject("Firestore not initialized");

    const companyId = getCurrentUserId();
    
    let clientId: string;

    if (options.isNew) {
        const dataToSave = { 
            ...clientData, 
            companyId,
            history: [] // Garante que a propriedade history exista
        };
        const docRef = await addDoc(collection(db, 'clients'), dataToSave);
        clientId = docRef.id;
        await addHistoryEntry({ clientId, text: 'Cliente criado.', type: 'log' });
    } else {
        clientId = clientData.id!;
        if (!clientId) return Promise.reject("Client ID is missing for update.");

        const docRef = doc(db, 'clients', clientId);
        const { id, ...dataToUpdate } = clientData;

        let changesLog = "";
        if (options.originalData) {
            const changedFields = Object.keys(dataToUpdate).filter(key => 
                key !== 'tags' && 
                key !== 'history' && 
                key !== 'companyId' &&
                options.originalData![key as keyof ClientFormData] !== dataToUpdate[key as keyof Client]
            );
            if(changedFields.length > 0) changesLog = `Cliente atualizado: ${changedFields.join(', ')}.`;
        }
        
        await setDoc(docRef, { ...dataToUpdate, companyId }, { merge: true });
        if (changesLog) await addHistoryEntry({ clientId, text: changesLog, type: 'log' });
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
    const db = await dbReady;
    if (!db) return;
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
export const getLeads = (callback: (leads: Lead[]) => void): Unsubscribe => {
    dbReady.then(db => {
        if (!db) {
            callback([]);
            return () => {};
        }
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
    });

    return () => {};
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
    const db = await dbReady;
    if (!db) return null;
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'leads', id);
    const docSnap = await getDoc(docRef);

     if (docSnap.exists() && docSnap.data().companyId === companyId) {
        return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
};

export const saveLead = async (leadData: Partial<Lead>): Promise<string> => {
    const db = await dbReady;
    if (!db) return Promise.reject("Firestore not initialized");
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
    const db = await dbReady;
    if (!db) return;
    await deleteDoc(doc(db, 'leads', leadId));
};


// Quotes
export const getQuoteById = async (id: string): Promise<Quote | null> => {
    const db = await dbReady;
    if (!db) return null; // Retorna nulo se o banco de dados não estiver pronto
    const companyId = getCurrentUserId();
    const docRef = doc(db, 'quotes', id);

    try {
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.warn(`[storage] Cotação com ID ${id} não encontrada.`);
            return null;
        }

        const quoteData = docSnap.data();

        // Verifica se a cotação pertence à empresa correta
        if (quoteData.companyId !== companyId) {
            console.error(`[storage] Tentativa de acesso negada: Cotação ${id} não pertence à empresa ${companyId}.`);
            return null;
        }

        return {
            id: docSnap.id,
            ...quoteData
        } as Quote;

    } catch (error) {
        console.error(`[storage] Erro ao buscar cotação com ID ${id}:`, error);
        return null;
    }
};


export const getQuotesByLeadId = async (leadId: string): Promise<Quote[]> => {
    const db = await dbReady;
    if (!db) return [];
    const companyId = getCurrentUserId();
    const q = query(collection(db, "quotes"), where("companyId", "==", companyId), where("leadId", "==", leadId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
}

export const saveQuote = async (quote: Quote): Promise<void> => {
    const db = await dbReady;
    if (!db) return; // Não faz nada se o DB não estiver pronto
    const companyId = getCurrentUserId();
    const { id, ...quoteData } = quote;
    const quoteRef = doc(db, 'quotes', id);
    // Garante que o companyId está sempre correto ao salvar
    await setDoc(quoteRef, { ...quoteData, companyId: companyId, id: id }, { merge: true });
};


export const generateNewQuoteId = async (): Promise<string> => {
    const db = await dbReady;
    if (!db) return Promise.reject("Firestore not initialized");
    const companyId = getCurrentUserId();
    const counterRef = doc(db, 'companies', companyId);

    let newQuoteNumber: number = 1;
    try {
        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists() || !counterDoc.data()?.lastQuoteNumber) {
                // If it doesn't exist or the field is missing, initialize it.
                transaction.set(counterRef, { lastQuoteNumber: 1 }, { merge: true });
                newQuoteNumber = 1;
            } else {
                newQuoteNumber = (counterDoc.data().lastQuoteNumber) + 1;
                transaction.update(counterRef, { lastQuoteNumber: newQuoteNumber });
            }
        });
        const paddedNumber = String(newQuoteNumber).padStart(4, '0');
        return `PRO-${paddedNumber}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Failed to generate a new quote ID.");
    }
}


// Inventory / Products
export const getProducts = (callback: (products: Product[]) => void): Unsubscribe => {
    dbReady.then(db => {
        if (!db) {
            callback([]);
            return () => {};
        }
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
    });
    return () => {};
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const db = await dbReady;
    if (!db) return null;
    const docRef = doc(db, 'inventory', id);
    const companyId = getCurrentUserId();
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().companyId === companyId) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return null;
    }
};

export const saveProduct = async (productData: Partial<Product>): Promise<string> => {
    const db = await dbReady;
    if (!db) return Promise.reject("Firestore not initialized");
    
    const companyId = getCurrentUserId();
    const dataToSave = { ...productData, companyId };

    if (dataToSave.id) {
        const productId = dataToSave.id;
        const docRef = doc(db, 'inventory', productId);
        delete dataToSave.id; // Não salvar o ID dentro do próprio documento
        await setDoc(docRef, dataToSave, { merge: true });
        return productId;
    } else {
        const docRef = await addDoc(collection(db, 'inventory'), dataToSave);
        return docRef.id;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const db = await dbReady;
    if (!db) return;
    await deleteDoc(doc(db, 'inventory', productId));
};

// Mock data for un-migrated features
export const getSalespersons = async (): Promise<Salesperson[]> => [{ id: 'sp-1', name: 'Vendedor Padrão' }];
export const getPaymentTerms = async (): Promise<PaymentTerm[]> => [{ id: 'pt-1', name: '30 Dias' }];
export const getPriceLists = async (): Promise<PriceList[]> => [{ id: 'pl-1', name: 'Tabela de Preços Padrão' }];
