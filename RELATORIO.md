
# Relatório Técnico: Análise do Problema de Geração de PDF na Aplicação Next.js

**Data:** 09/09/2025
**Autor:** App Prototyper (IA)
**Objetivo:** Documentar as tentativas de implementação, os erros encontrados e o estado atual da funcionalidade de geração de PDF para obter uma análise técnica externa.

---

## 1. Resumo do Problema (Situação Atual)

A aplicação falha consistentemente ao tentar gerar um documento PDF a partir de uma proposta comercial. A interação do utilizador no frontend (clique no botão "Gerar Proposta") resulta numa chamada à API que termina com um erro 500.

O erro específico retornado pela API de backend é:

```
Failed to launch the browser process!
/tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

Este erro indica que o ambiente de execução do servidor (um container Linux, provavelmente minimalista) não possui as bibliotecas de sistema necessárias (`libnss3`, entre outras) para que o navegador Chromium (utilizado pelo Puppeteer) possa ser executado, mesmo com a biblioteca `@sparticuz/chromium` que foi projetada para ambientes de nuvem.

---

## 2. Arquitetura Atual da Geração de PDF

A implementação atual está desenhada da seguinte forma:

1.  **Componente Frontend (`src/components/wizard/Step2Results.tsx`):**
    *   Uma função `handleExportPdf` é acionada pelo clique do utilizador.
    *   Esta função recolhe todos os dados da proposta (dados do formulário, resultados do cálculo, informações da empresa, etc.).
    *   Ela envia estes dados através de uma requisição `POST` para a API interna do Next.js no endpoint `/api/gerar-pdf`.

2.  **Rota de API do Next.js (`src/app/api/gerar-pdf/route.ts`):**
    *   Recebe os dados da proposta no corpo da requisição.
    *   Constrói uma URL para uma página de template oculta (`/proposal-template`), passando todos os dados da proposta codificados como um parâmetro de pesquisa.
    *   Utiliza a biblioteca `puppeteer-core` em conjunto com `@sparticuz/chromium` para iniciar uma instância de um navegador headless.
    *   Instrui o Puppeteer a navegar até à URL do template, aguardando que a página seja completamente renderizada.
    *   Gera um buffer de PDF a partir do HTML da página renderizada.
    *   Retorna este buffer como uma resposta com o `Content-Type: application/pdf`.

3.  **Página de Template (`src/app/proposal-template/page.tsx`):**
    *   É um Server Component do Next.js que não é destinado à navegação direta.
    *   Ele lê os dados da proposta a partir dos parâmetros de pesquisa da URL.
    *   Renderiza o componente React `ProposalDocument` com os dados recebidos, produzindo o HTML final que será convertido em PDF.

---

## 3. Histórico de Tentativas e Evolução da Solução

A solução atual é o resultado de várias iterações que falharam por diferentes motivos. O histórico ajuda a entender o contexto do problema.

### Tentativa 1: Geração de PDF no Frontend com `react-to-print`

*   **Abordagem:** Utilizar a biblioteca `react-to-print` para acionar a funcionalidade de impressão do navegador diretamente no cliente. O componente da proposta (`ProposalDocument`) era renderizado de forma oculta na página de resultados.
*   **Problema:** O botão "Gerar Proposta" não tinha qualquer efeito. A causa provável foi a dificuldade da biblioteca em encontrar a referência (`ref`) do componente oculto no DOM no momento do clique, resultando numa falha silenciosa.

### Tentativa 2: Geração de PDF no Backend com Função Netlify (Abordagem Equivocada)

*   **Abordagem:** Assumindo que o problema era o ambiente de compilação do Next.js, a lógica do Puppeteer foi movida para uma função de servidor Netlify separada (`netlify/functions/gemini.js`). A API do Next.js atuaria como um proxy.
*   **Problema:** Esta abordagem falhou porque o ambiente de execução não era Netlify. A chamada da API para o endpoint da função (`localhost:8888`) falhava com um erro de `fetch failed`, pois o servidor de desenvolvimento da Netlify não estava a ser executado. Isto introduziu uma complexidade e uma dependência de plataforma desnecessárias.

### Tentativa 3: Geração de PDF no Backend com API Next.js e `react-dom/server`

*   **Abordagem:** Retornar à abordagem de uma API integrada. A lógica de renderização do componente da proposta para uma string HTML foi implementada diretamente na rota da API usando `ReactDOMServer.renderToString()`.
*   **Problema:** O compilador do Next.js (Turbopack) bloqueou a compilação, emitindo um erro que proíbe a importação de `react-dom/server` dentro de Rotas de API do App Router, por razões de otimização e segurança. Tentativas de contornar isto com aliases de importação no `package.json` ou isolando a lógica noutro ficheiro (`/lib/pdf-renderer.ts`) falharam igualmente.

### Tentativa 4: Arquitetura Atual (API Next.js + Rota de Template)

*   **Abordagem:** A que está descrita na secção "Arquitetura Atual". Esta é a abordagem canónica para renderizar um componente React complexo no servidor para ser consumido por uma ferramenta como o Puppeteer, utilizando o próprio motor de renderização do Next.js.
*   **Problema:** Esta abordagem resolveu todos os erros de compilação e de lógica de aplicação, mas expôs o erro fundamental do ambiente: a ausência da dependência de sistema `libnss3.so`. Uma tentativa de corrigir isto adicionando o argumento `--no-sandbox` ao Puppeteer não teve sucesso.

---

## 4. Conclusão e Próximos Passos Sugeridos

O problema atual não é mais de código JavaScript/Next.js, mas sim de configuração de ambiente de execução. A biblioteca `@sparticuz/chromium` foi projetada para ser executada em ambientes de nuvem padrão (como AWS Lambda, Google Cloud Functions), que geralmente incluem estas dependências base. O ambiente do Firebase Studio parece ser mais minimalista.

**Questão Central para Investigação:**

Como podemos satisfazer a dependência da biblioteca `libnss3.so` (e potencialmente outras) para o Chromium no ambiente de execução específico do Firebase Studio, ou existe uma alternativa ao Puppeteer/Chromium que não tenha estas dependências de sistema?
