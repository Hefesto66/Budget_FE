# Relatório Técnico de Incidente: Geração de PDF

## 1. Objetivo da Funcionalidade

O objetivo principal é gerar uma proposta comercial em formato PDF a partir de dados inseridos pelo utilizador na aplicação. A proposta deve ser visualmente bem formatada, com suporte para imagens (logótipo da empresa), tabelas, estilos personalizados e quebras de página inteligentes para evitar o corte de conteúdo.

## 2. Visão Geral da Arquitetura e Tecnologias

- **Framework:** Next.js 15.x (App Router)
- **Linguagem:** TypeScript
- **UI:** React, ShadCN UI
- **Estilização:** Tailwind CSS
- **Geração de PDF (Biblioteca Atual):** `pdfmake` (versão 0.2.10)
- **Hospedagem:** Ambiente Serverless (ex: Vercel, Netlify, Firebase App Hosting)

## 3. Histórico de Tentativas e Evolução da Arquitetura

A solução atual é o resultado de um processo iterativo de depuração, onde várias abordagens falharam devido a restrições do ambiente de execução.

### Tentativa 1: Geração no Servidor com Puppeteer (Headless Browser)

- **Descrição:** Uma API Route (`/api/gerar-pdf`) foi criada para usar o Puppeteer para controlar uma instância do Chromium, renderizar uma página HTML (`/proposal-template`) e exportá-la como PDF.
- **Problema:** A aplicação falhou no ambiente de produção com o erro `error while loading shared libraries: libnss3.so: cannot open shared object file`.
- **Conclusão:** Esta abordagem é inviável em ambientes serverless padrão devido à ausência de dependências de sistema operativo necessárias para o Chromium.

### Tentativa 2: Geração no Servidor com `pdfmake`

- **Descrição:** O Puppeteer foi substituído pela biblioteca `pdfmake`, que é puramente em JavaScript e não deveria ter dependências de sistema. A API continuaria a receber os dados e a construir o PDF no servidor.
- **Problema:** A API começou a falhar silenciosamente, retornando um erro 500 com uma página HTML em vez de um PDF ou de um erro JSON. O frontend recebia um `SyntaxError: Unexpected token '<'` ao tentar fazer o "parse" da resposta HTML.
- **Causa Provável:** A forma como o `pdfmake` lida com o carregamento de módulos e, especialmente, de fontes (`vfs_fonts` ou caminhos para ficheiros `.ttf` em `node_modules`) é incompatível com o ambiente de execução do Next.js no servidor, causando um "crash" no momento da inicialização do módulo, antes mesmo de o código da função `POST` ser executado.

### Tentativa 3: Geração 100% no Cliente com `window.print()` (Abordagem Atual)

- **Descrição:** Para eliminar todas as dependências do servidor, a arquitetura foi completamente refatorada para uma solução no lado do cliente.
- **Fluxo Implementado:**
    1.  **Gatilho:** O botão "Imprimir Proposta" na página de resultados (`/orcamento`) reúne todos os dados da proposta num objeto JavaScript.
    2.  **Comunicação:** A função do botão abre uma nova janela do navegador na rota `/proposal-template`. É estabelecido um "aperto de mão" digital:
        - A janela principal ouve por uma mensagem de prontidão (`'ready-for-data'`).
        - A nova janela de impressão, ao carregar, envia essa mensagem de prontidão para a janela que a abriu.
    3.  **Transferência de Dados:** Ao receber a confirmação, a janela principal envia o objeto completo com os dados da proposta diretamente para a nova janela usando `window.postMessage()`.
    4.  **Recetor:** A nova janela ouve pela mensagem que contém os dados (`'PROPOSAL_DATA'`), atualiza o seu estado com esses dados, renderiza o componente da proposta e, finalmente, aciona a caixa de diálogo de impressão do navegador com `window.print()`.

## 4. Problema Atual

Apesar de a arquitetura atual com `postMessage` ser a mais robusta teoricamente, o fluxo ainda falha. O sintoma é o mesmo: a nova janela é aberta, mas exibe a mensagem de erro "Não foi possível carregar os dados da proposta".

**Diagnóstico:**
- A lógica de "pedido e resposta" parece não estar a completar-se.
- A janela de impressão envia o seu sinal de `'ready-for-data'`.
- No entanto, a janela principal parece não receber este sinal ou não consegue enviar a resposta com os dados a tempo, antes de a nova janela desistir e mostrar o erro.
- O erro ocorre de forma inconsistente, o que sugere um problema de timing (*race condition*) que a arquitetura `postMessage` deveria ter resolvido, mas não o fez.

## 5. Pedido de Ajuda

Precisamos de uma análise sobre a implementação atual do fluxo de comunicação com `postMessage` entre as duas janelas do navegador. O código relevante está principalmente em dois ficheiros:

1.  `src/components/wizard/Step2Results.tsx` (a função `handleExportPdf` que atua como o "fornecedor de dados").
2.  `src/app/proposal-template/page.tsx` (o componente que atua como o "requisitante").

A questão principal é: **Por que é que o mecanismo de "aperto de mão" com `postMessage` está a falhar de forma intermitente, e qual seria a forma mais fiável de garantir que a transferência de dados entre as janelas ocorra com sucesso sempre?** Existe algum detalhe subtil ou prática recomendada na API de `postMessage` ou nos hooks do React (`useEffect`) que possa estar a ser negligenciado?
