# Relatório Técnico: Diagnóstico de Erros na Geração de PDF Server-Side

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Contexto e Objetivo

Após a falha das abordagens de geração de PDF no lado do cliente (client-side) com `html2canvas` e `jspdf`, foi adotada uma nova arquitetura para gerar os documentos no lado do servidor (server-side) usando a biblioteca `Puppeteer`.

**O objetivo desta nova arquitetura era:**
- Utilizar um motor de navegador real (headless browser) para garantir a fidelidade do layout.
- Fazer com que as regras de CSS de impressão (ex: `page-break-inside: avoid`) fossem respeitadas, resolvendo o problema original de quebras de página incorretas.

Apesar de a arquitetura estar teoricamente correta, uma série de erros de build do Next.js impediu o seu funcionamento. Este relatório detalha a causa fundamental desses erros.

## 2. O Problema Central: A Fronteira Rígida entre Cliente e Servidor no Next.js

O erro persistente que encontramos é:

**`You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component...`**

Este erro não é um bug, mas sim uma regra fundamental e de segurança imposta pelo Next.js. Ele pode ser traduzido da seguinte forma:

> "Você está a tentar importar código que só pode e só deve rodar no servidor (neste caso, `react-dom/server` para renderizar o HTML da proposta) para dentro de um ficheiro que, de alguma forma, está a ser incluído no pacote de código que é enviado para o navegador do cliente. Isto é proibido."

O Next.js proíbe estritamente que pacotes de servidor (como `puppeteer` ou `react-dom/server`) acabem no código do cliente por duas razões principais:
1.  **Segurança:** Exporia a lógica do servidor.
2.  **Tamanho e Desempenho:** Aumentaria desnecessariamente o tamanho dos ficheiros JavaScript enviados para o navegador.

## 3. Análise das Tentativas de Correção e Porque Falharam

Nossa implementação continha uma cadeia de importações que violava esta regra. Vamos seguir o rasto:

1.  **O Componente "Gatilho" (Client-Side):**
    - `src/components/wizard/Step2Results.tsx`
    - Este é um **Componente de Cliente** (`"use client"`), pois precisa de interatividade (state, botões, etc.).
    - Ele contém o botão "Exportar PDF" que chama a nossa função de geração de PDF.

2.  **A Função de Geração de PDF (Server-Side):**
    - `src/app/orcamento/actions.tsx`
    - Esta é uma **Ação de Servidor** (`"use server"`), que contém a lógica do `Puppeteer` e do `renderToStaticMarkup`.
    - **Este é o ficheiro que importa os pacotes de servidor proibidos.**

3.  **A Violação da Fronteira:**
    - O erro acontecia porque o ficheiro `Step2Results.tsx` (cliente) estava a importar diretamente uma função do ficheiro `actions.tsx` (servidor).
    - Mesmo que a função importada não fosse a `generatePdfAction`, o simples facto de o ficheiro `actions.tsx` conter uma importação de `react-dom/server` era suficiente para o Next.js bloquear o build. O sistema de build analisa todas as importações de um ficheiro, não apenas a função que está a ser usada.

**Tentativas de Correção:**

- **Tentativa 1: Renomear para `.tsx`**
  - **Problema:** A função `generatePdfAction` usa JSX (`<ProposalDocument />`), pelo que o ficheiro precisa da extensão `.tsx`.
  - **Resultado:** A mudança foi necessária, mas não resolveu o erro de importação.

- **Tentativa 2: Separar as Ações**
  - **Estratégia:** Criámos dois ficheiros de ações: `actions.ts` (para funções seguras que podem ser chamadas do cliente) e `actions.tsx` (exclusivamente para `generatePdfAction`).
  - **Razão da Falha:** Um erro de digitação ou um caminho de importação incorreto fez com que `Step2Results.tsx` continuasse a importar de `actions.tsx` em vez do novo ficheiro `actions.ts`. Isto manteve a violação da fronteira cliente-servidor.

## 4. Conclusão e Solução Definitiva

O problema não está na lógica de geração do PDF com o Puppeteer, que continua a ser a abordagem correta. **O problema reside exclusivamente na forma como os ficheiros estão organizados e importados, violando as regras do Next.js.**

**A solução definitiva e correta é garantir um isolamento absoluto:**

1.  **Confirmar o Isolamento:** O ficheiro `src/app/orcamento/actions.tsx`, que contém o código do Puppeteer, **NUNCA** deve ser importado por nenhum componente de cliente (`"use client"`).
2.  **Verificar Todas as Importações:** É necessário garantir que `Step2Results.tsx` e `Wizard.tsx` importam as suas funções (`getRefinedSuggestions`, `getCalculation`) **APENAS** do ficheiro `src/app/orcamento/actions.ts` (o ficheiro sem código de servidor).
3.  **Chamada Correta:** O botão em `Step2Results.tsx` deve chamar `generatePdfAction` (do ficheiro `actions.tsx`) corretamente, sem que o sistema de build tente agrupar os dois. Muitas vezes, passar a função como uma propriedade ou usar a `startTransition` do React para chamá-la pode ajudar o Next.js a entender a separação.

A tarefa imediata é auditar e corrigir os caminhos de importação em todo o fluxo do wizard para garantir que a fronteira entre o código que é executado no servidor e o código que é enviado para o cliente seja 100% respeitada.
