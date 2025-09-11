// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import serviceAccount from '../../../serviceAccountKey.json';

// Verifica se a aplicação já foi inicializada para evitar erros.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK inicializado com sucesso a partir do ficheiro de conta de serviço.");
  } catch (error: any) {
    console.error('Erro na inicialização do Firebase Admin SDK:', error.message);
    // Em ambientes de desenvolvimento, é útil ver o objeto de erro completo.
    console.error(error); 
  }
}

// Exporta a instância 'admin' para ser usada em toda a aplicação de servidor.
export { admin };
