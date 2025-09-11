
# Relatório Técnico de Diagnóstico e Correção de Erros – Aplicação Solaris

**Data:** 11 de Setembro de 2024
**Autor:** Assistente de IA (Firebase Studio)
**Status:** Análise Concluída. A aguardar implementação da solução definitiva.

## 1. Contexto e Objetivo

Este relatório documenta a análise técnica e o processo de depuração de uma série de erros interconectados na aplicação Solaris, um sistema de gestão (CRM) e orçamentação para empresas de energia solar. O objetivo é diagnosticar a causa raiz dos problemas, explicar por que as tentativas iniciais de correção falharam e propor uma solução definitiva e robusta.

O principal sintoma reportado foi o erro `FirebaseError: Missing or insufficient permissions`, que impedia a criação de novos documentos (clientes, produtos, etc.) na base de dados do Firestore.

## 2. Cronologia dos Erros e Tentativas de Correção

A depuração seguiu uma trajetória que revelou problemas progressivamente mais profundos na arquitetura da aplicação.

### Erro 1: `auth/configuration-not-found` (Lado do Cliente)

- **Descrição:** A aplicação não conseguia inicializar o Firebase no navegador.
- **Causa Raiz:** O ficheiro `.env` estava vazio. As credenciais do projeto Firebase (API Key, Project ID) não estavam a ser fornecidas ao SDK do Firebase.
- **Tentativa 1:** Adicionar um ficheiro `.env.example` e melhorar as mensagens de erro na inicialização.
  - **Resultado:** **Falha.** O erro persistiu porque o Next.js, por segurança, não expõe variáveis de ambiente ao navegador a menos que tenham o prefixo `NEXT_PUBLIC_`.
- **Tentativa 2:** Renomear todas as variáveis de ambiente para incluir o prefixo `NEXT_PUBLIC_`.
  - **Resultado:** **Sucesso.** Este erro foi resolvido, permitindo que a aplicação se conectasse ao Firebase no lado do cliente.

### Erro 2: `auth/invalid-credential` (Lado do Cliente)

- **Descrição:** Ocorria durante o login, indicando que o email ou a senha estavam incorretos.
- **Causa Raiz:** Não era um bug, mas um comportamento esperado do Firebase. A aplicação, no entanto, não fornecia uma mensagem de erro clara ao utilizador.
- **Correção:** Modificada a lógica de tratamento de erros na página de login (`src/app/login/page.tsx`) para detetar este código de erro específico e exibir uma mensagem amigável.
  - **Resultado:** **Sucesso.** A experiência do utilizador foi melhorada.

### Erro 3: Falha na Autenticação do Admin SDK (Lado do Servidor)

- **Descrição:** Ao tentar promover um utilizador a "Super Usuário" (uma ação de backend), a aplicação retornou um erro indicando que não conseguiu obter um token de acesso OAuth2.
- **Causa Raiz:** O *Firebase Admin SDK*, executado no servidor Next.js, não conseguia encontrar as credenciais de administrador. O método de autenticação padrão falha em ambientes de desenvolvimento se a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` não estiver configurada.
- **Tentativa 1:** Alterar o caminho de importação do `serviceAccountKey.json`.
  - **Resultado:** **Falha.** Um erro de digitação no caminho (`../../../` em vez de `../../`) causou um erro de compilação (`Module not found`).
- **Correção Definitiva:** Corrigido o caminho de importação em `src/lib/firebase-admin.ts` para carregar as credenciais diretamente do ficheiro `serviceAccountKey.json`, localizado na raiz do projeto.
  - **Resultado:** **Sucesso.** O Admin SDK foi autenticado corretamente, permitindo a execução de ações privilegiadas no backend.

### Erro 4 (Principal): `Missing or insufficient permissions` (Firestore)

- **Descrição:** O erro mais persistente, ocorrendo ao tentar criar qualquer novo documento (clientes, produtos, etc.) na base de dados.
- **Causa Raiz (Análise Profunda):** Este erro foi o culminar de uma falha arquitetónica fundamental na forma como os dados eram escritos no Firestore, em conflito direto com as regras de segurança.
  1.  **Regras de Segurança (`firestore.rules`):** As regras exigiam que, para criar (`allow create`) um documento, o campo `companyId` desse **novo documento** (`request.resource.data.companyId`) fosse igual ao `uid` do utilizador autenticado (`request.auth.uid`). Esta regra, por si só, está correta e é uma boa prática.
  2.  **Lógica de Gravação (`src/lib/storage.ts`):** A falha estava aqui. As funções de gravação (ex: `saveClient`) **não adicionavam o campo `companyId` ao objeto de dados no momento da criação**. Elas assumiam que a verificação de permissão seria feita de outra forma. Sem este campo, a regra do Firestore era violada, e a operação era corretamente negada.

- **Tentativas de Correção Falhadas:**
  - **Ajustar as Regras:** As tentativas iniciais focaram-se em ajustar as regras de segurança. Isto falhou porque as regras já estavam a fazer o seu trabalho: proteger a base de dados de escritas malformadas (sem um dono definido). O problema não estava nas regras, mas nos dados que a aplicação enviava.
  - **Ajustes na Página de Registo:** Tentativas de "forçar" a criação de uma `company` na página de registo não resolveram o problema principal, que era a falta do `companyId` nos documentos subsequentes (clientes, produtos, etc.).

## 3. Conclusão e Plano de Ação Definitivo

O erro de permissão não é um problema isolado, mas um sintoma de uma dissociação entre a lógica da aplicação e as suas regras de segurança. A solução não é relaxar as regras, mas garantir que a aplicação sempre cumpra o "contrato" que as regras exigem.

**A solução final e profissional será implementada da seguinte forma:**

1.  **Modificar a Lógica de Gravação (em `src/lib/storage.ts`):**
    -   **Objetivo:** Garantir que **toda e qualquer operação de criação** de um novo documento (`client`, `product`, `lead`) inclua explicitamente o campo `companyId`, cujo valor será o `uid` do utilizador atualmente autenticado.
    -   **Ação:** Refatorar as funções `saveClient`, `saveProduct` e `saveLead` para adicionar `{ companyId: userId }` ao objeto de dados antes de o enviar para o Firestore.

2.  **Garantir a Existência da "Empresa" (`src/lib/storage.ts` e `src/app/registo/page.tsx`):**
    -   **Objetivo:** Assegurar que cada utilizador, no momento do registo, tenha um documento `companies/{userId}` criado. Este documento serve como a "raiz" de todos os dados daquele utilizador.
    -   **Ação:** Criar uma função `createCompanyForNewUser` dedicada e chamá-la de forma fiável após o sucesso do `createUserWithEmailAndPassword` na página de registo.

Ao implementar estas duas mudanças centrais, o fluxo de dados torna-se consistente com as regras de segurança, resolvendo o erro `Missing or insufficient permissions` na sua origem.
