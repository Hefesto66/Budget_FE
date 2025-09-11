// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Verifica se a aplicação já foi inicializada para evitar erros.
if (!admin.apps.length) {
  try {
    // Constrói o caminho absoluto para o ficheiro a partir da raiz do projeto.
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`O ficheiro de credenciais 'serviceAccountKey.json' não foi encontrado no caminho esperado: ${serviceAccountPath}. Certifique-se de que o ficheiro existe na raiz do projeto.`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
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
