# Relatório Técnico: Diagnóstico de Erros na Geração de PDF

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Resumo Executivo

O objetivo de gerar um PDF profissional e bem formatado a partir dos dados do orçamento enfrentou múltiplos desafios técnicos. Este relatório documenta a evolução do problema, as arquiteturas tentadas e as razões pelas quais falharam, culminando na situação atual.

As abordagens podem ser divididas em três fases principais:
1.  **Geração Client-Side (html2canvas):** Falhou devido a quebras de página incorretas e erros de renderização.
2.  **Geração Server-Side (Puppeteer):** Falhou devido a conflitos de arquitetura e erros de build do Next.js.
3.  **Impressão Nativa do Navegador (Comunicação Inter-Abas):** Falhou devido a inconsistências e *race conditions* na comunicação entre a aba da aplicação e a aba de impressão.

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
- **Conclusão da Fase:** Embora a lógica do Puppeteer fosse correta, a complexidade de isolar o código do servidor dentro da arquitetura do Next.js tornou esta abordagem inviável e frágil.

---

## 4. Fase 3: Impressão Nativa via Comunicação Inter-Abas

- **Estratégia:** Abandonar a geração de ficheiros e, em vez disso, alavancar a funcionalidade "Imprimir para PDF" do próprio navegador, que respeita perfeitamente as regras de CSS. O desafio era passar os dados da proposta da aba principal para uma nova aba dedicada à impressão (`/orcamento/imprimir`).
- **Problema Fundamental:** Falha na transferência de dados da página principal para a nova aba de impressão.
- **Erro Manifestado:** A página de impressão exibia "Dados da proposta não encontrados".

- **Análise das Tentativas Falhadas:**
    1.  **`localStorage` com `setTimeout`:** A primeira abordagem foi guardar os dados no `localStorage` e depois abrir a nova aba. Isto falhou devido a uma *race condition*: a nova aba carregava e tentava ler os dados *antes* de o `localStorage` terminar a escrita. Adicionar um `setTimeout` não foi uma solução robusta.
    2.  **`localStorage` com `EventListener`:** A segunda abordagem foi mais sofisticada. A nova aba de impressão adicionava um "ouvinte" (`addEventListener('storage', ...)`) e ficava à espera que a aba principal escrevesse os dados.
        - **Causa da Falha:** A especificação da `Storage API` dita que o evento `storage` **não é acionado na aba que o origina**. Como o navegador tratou a nova aba como parte do mesmo contexto da que a abriu, o evento nunca foi disparado, e a página de impressão ficou à espera indefinidamente.

- **Conclusão da Fase:** A comunicação entre abas *após* a sua criação demonstrou ser inerentemente frágil e sujeita a inconsistências entre navegadores. A solução mais confiável deve ser uma que **não dependa de eventos de comunicação post-facto**.

---

## 5. Conclusão Geral e Próximos Passos

O erro `414 URI Too Large` que recebemos numa tentativa anterior (não documentada aqui) de usar parâmetros de URL, juntamente com as falhas de comunicação, indica que o desafio atual não está na lógica de renderização, mas sim no **volume dos dados** que estamos a tentar transferir para a página de impressão no momento da sua criação. A próxima abordagem deve focar-se em resolver este problema de transferência de dados de forma eficiente.