# Relatório Técnico: Análise da Falha na Comunicação Inter-Abas

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Resumo do Problema

Este relatório foca-se na falha da abordagem de comunicação entre abas que utilizou a API `localStorage` em conjunto com um `EventListener` (`window.addEventListener('storage', ...)`). O objetivo era transferir os dados da proposta da página principal para uma nova aba de impressão.

Apesar de ser teoricamente robusta, a implementação continuou a resultar no erro **"Dados da proposta não encontrados"** na aba de impressão, indicando que a transferência de dados não ocorreu ou não foi detetada a tempo.

## 2. Estratégia da Última Tentativa

A abordagem foi desenhada para eliminar a *race condition* que suspeitávamos ser a causa das falhas anteriores. O fluxo era o seguinte:

1.  **Aba Emissora (`Step2Results.tsx`):**
    *   Ao clicar em "Exportar PDF", o código primeiro abria a nova aba (`/orcamento/imprimir`).
    *   Imediatamente a seguir, escrevia os dados da proposta no `localStorage`. A expectativa era que esta ação de escrita disparasse um evento global.

2.  **Aba Ouvinte (`imprimir/page.tsx`):**
    *   Ao carregar, a página não tentava ler os dados imediatamente.
    *   Em vez disso, ela adicionava um "ouvinte" (`addEventListener`) para o evento `storage`.
    *   A lógica era: a página ficaria em estado de "espera" até que o ouvinte detetasse a mudança no `localStorage` feita pela aba emissora.
    *   Ao detetar a mudança, ela leria os dados, renderizaria o documento e chamaria `window.print()`.

## 3. Análise da Causa da Falha

A razão pela qual esta abordagem falhou é subtil e está relacionada com as especificações da `Storage API` e o comportamento dos navegadores modernos:

**Causa Fundamental: O evento `storage` não é acionado na aba que o origina.**

O ponto crucial da especificação do evento `storage` é que ele foi projetado para notificar **OUTRAS** abas sobre uma mudança, mas não a aba que iniciou a mudança. No nosso fluxo:

1.  A aba principal (emissora) abre a nova aba de impressão.
2.  A aba principal **escreve** no `localStorage`.

O problema é que, em muitos navegadores modernos, por razões de otimização e segurança, a nova aba aberta é considerada "filha" ou parte do mesmo contexto de navegação da aba "mãe" que a abriu. Como resultado, o navegador pode tratar a escrita no `localStorage` pela aba mãe como se fosse uma ação da própria aba filha, e, portanto, **não dispara o evento `storage` na aba filha**.

Em suma, a aba de impressão ficou a "ouvir" por um evento que nunca chegou, porque o navegador considerou que ela própria era a fonte da mudança. O `timeout` que implementámos para exibir o erro após 10 segundos era consistentemente ativado porque o evento de `storage` nunca o interrompia.

## 4. Conclusão

A falha desta abordagem prova que a comunicação entre abas para este fim específico é inerentemente frágil e sujeita a inconsistências de implementação entre diferentes navegadores. A estratégia de passar dados após a abertura da janela (seja via `localStorage` ou `BroadcastChannel`) demonstrou ser o ponto de falha.

A solução mais confiável deve ser uma que **não dependa de eventos de comunicação post-facto**. É necessário voltar a uma abordagem onde os dados são garantidamente passados para a nova janela no momento da sua criação, como a tentativa falhada de usar parâmetros de URL. O erro `414 URI Too Large` que recebemos anteriormente indica que o desafio não está na comunicação, mas sim no **volume dos dados** que estamos a tentar transferir.