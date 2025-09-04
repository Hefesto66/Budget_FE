# Relatório Técnico: Diagnóstico de Erros na Geração de PDF

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Resumo Executivo

O objetivo de gerar um PDF profissional e bem formatado a partir dos dados do orçamento tem enfrentado múltiplos desafios técnicos. Este relatório documenta a evolução do problema, as arquiteturas tentadas e as razões pelas quais falharam, culminando na situação atual.

As abordagens podem ser divididas em três fases principais:
1.  **Geração Client-Side (html2canvas):** Falhou devido a quebras de página incorretas e erros de renderização.
2.  **Geração Server-Side (Puppeteer):** Falhou devido a conflitos de arquitetura e erros de build do Next.js.
3.  **Impressão Nativa do Navegador:** Está a falhar devido a problemas de transferência de dados entre abas.

---

## 2. Fase 1: Geração Client-Side com `html2canvas`

- **Estratégia:** Utilizar a biblioteca `html2canvas` para tirar uma "fotografia" do conteúdo da proposta e a `jspdf` para fatiar essa imagem em páginas PDF.
- **Problema Fundamental:** `html2canvas` não interpreta as regras de impressão do CSS (`@media print`). A diretiva `page-break-inside: avoid`, crucial para evitar que secções sejam cortadas ao meio, era completamente ignorada. A biblioteca simplesmente criava uma imagem longa que era depois cortada de forma "cega" pela `jspdf`.
- **Erro Manifestado:** "Unable to find element in cloned iframe". Este erro ocorria consistentemente porque o `html2canvas` tinha dificuldade em renderizar elementos complexos (como os gráficos da `recharts`) dentro do seu `<iframe>` de captura.
- **Conclusão da Fase:** A abordagem de "fotografar e fatiar" no cliente é inerentemente falha para documentos complexos que exigem controlo de paginação.

---

## 3. Fase 2: Geração Server-Side com `Puppeteer`

- **Estratégia:** Mover a lógica de geração para o servidor, utilizando um *headless browser* (Puppeteer) que consegue interpretar HTML/CSS como um navegador real, incluindo as regras de impressão.
- **Implementação:** Foi criada uma Server Action (`generatePdfAction`) que renderizava o componente da proposta para HTML estático (`renderToStaticMarkup`) e usava o Puppeteer para converter esse HTML num PDF.
- **Problema Fundamental:** Conflito com a fronteira cliente-servidor do Next.js.
- **Erro Manifestado:** **`You're importing a component that imports react-dom/server...`**
- **Análise do Erro:**
    1.  O ficheiro que continha a lógica do Puppeteer (`actions.tsx`) precisava de importar `react-dom/server` para renderizar o componente React para HTML.
    2.  Um componente de cliente (`"use client"`), `Step2Results.tsx`, precisava de importar uma função desse mesmo ficheiro para iniciar a geração do PDF.
    3.  O sistema de build do Next.js detetou esta cadeia de importação e bloqueou-a para impedir que código exclusivo de servidor (como `puppeteer` e `react-dom/server`) fosse incluído no pacote de código enviado para o navegador do cliente.
    4.  As tentativas de separar as funções em ficheiros `.ts` e `.tsx` distintos falharam devido a erros de importação que mantiveram a violação da fronteira.
- **Conclusão da Fase:** Embora a lógica do Puppeteer estivesse correta, a complexidade de isolar o código do servidor dentro da arquitetura do Next.js tornou esta abordagem inviável e frágil.

---

## 4. Fase 3 (Atual): Impressão Nativa do Navegador

- **Estratégia:** Abandonar a geração de ficheiros e, em vez disso, alavancar a funcionalidade "Imprimir para PDF" do próprio navegador, que respeita perfeitamente as regras de CSS.
- **Implementação:**
    1.  Foi criada uma rota dedicada (`/orcamento/imprimir`) que renderiza apenas o documento da proposta.
    2.  O botão "Exportar PDF" foi modificado para passar os dados da proposta para esta nova página e invocar `window.print()`.
- **Problema Fundamental:** Falha na transferência de dados da página principal para a nova aba de impressão.
- **Erro Manifestado:** A página de impressão exibe "Dados da proposta não encontrados".
- **Análise do Erro:**
    1.  **Tentativa 1 (localStorage):** A primeira abordagem foi guardar os dados no `localStorage` e depois abrir a nova aba. Isto falhou devido a uma *race condition*: a nova aba carregava e tentava ler os dados *antes* de o `localStorage` terminar a escrita, resultando em dados não encontrados. Adicionar um `setTimeout` não foi uma solução robusta.
    2.  **Tentativa 2 (Escrita Programática):** A segunda abordagem foi abrir uma aba em branco (`window.open('')`) e injetar o HTML e os dados programaticamente. Esta abordagem também falhou, provavelmente devido a políticas de segurança do navegador ou à complexidade de recriar o contexto do React numa janela gerada dinamicamente.
- **Conclusão da Fase:** A abordagem de impressão nativa é a mais promissora, mas o mecanismo de transferência de dados entre a página da aplicação e a página de impressão é o ponto de falha atual e precisa de uma solução 100% confiável.