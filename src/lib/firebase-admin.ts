// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Verifica se a aplicação já foi inicializada para evitar erros.
if (!admin.apps.length) {
  try {
    // As credenciais são lidas a partir das variáveis de ambiente
    // que o Firebase providencia em ambientes de servidor (como Vercel ou Firebase Hosting).
    // Ou a partir do ficheiro da conta de serviço configurado localmente.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");
  } catch (error: any) {
    console.error('Erro na inicialização do Firebase Admin SDK:', error.message);
    // Lançar o erro ou lidar com ele conforme necessário para a sua aplicação.
    // Em muitos casos, a aplicação não pode funcionar sem o Admin SDK.
  }
}

// Exporta a instância 'admin' para ser usada em toda a aplicação de servidor.
export { admin };
