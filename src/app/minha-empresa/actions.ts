'use server';

import { admin } from '@/lib/firebase-admin';

/**
 * Atribui um custom claim de 'superuser' a um usuário do Firebase.
 * Esta é uma operação privilegiada e só deve ser exposta a administradores.
 * @param email O email do usuário a ser promovido.
 * @returns Um objeto indicando sucesso ou erro.
 */
export async function setSuperUserRole(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // A inicialização do admin SDK é tratada no módulo firebase-admin
    const user = await admin.auth().getUserByEmail(email);
    if (!user) {
      return { success: false, message: `Usuário com email ${email} não encontrado.` };
    }

    // Define o custom claim. Isto substitui quaisquer claims existentes.
    await admin.auth().setCustomUserClaims(user.uid, { superuser: true });

    return { success: true, message: `O usuário ${email} agora é um Super Usuário.` };
  } catch (error: any) {
    console.error('Erro ao definir o papel de Super Usuário:', error);
    return { success: false, message: error.message || 'Ocorreu um erro desconhecido.' };
  }
}
