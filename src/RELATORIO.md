# Relatório Técnico: Diagnóstico de Erros na Geração de PDF e Bloqueios de Segurança da IA

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Resumo Executivo

O objetivo de criar uma experiência de utilizador fluida e inteligente na aplicação Solaris tem enfrentado dois desafios técnicos principais e persistentes:
1.  A **geração de um documento PDF** profissional a partir dos dados da proposta.
2.  O **bloqueio consistente por filtros de segurança** da funcionalidade "Refinar com IA".

Este relatório documenta a evolução de cada problema, as arquiteturas tentadas e as razões pelas quais falharam, culminando na situação atual.

---

## 2. Desafio 1: A Geração do PDF

### Fase 1: Geração Client-Side com `html2canvas`
- **Estratégia:** Utilizar `html2canvas` para "fotografar" o conteúdo da proposta e `jspdf` para fatiar essa imagem em páginas PDF.
- **Problema Fundamental:** `html2canvas` não interpreta as regras de impressão do CSS (`@media print`). A diretiva `page-break-inside: avoid`, crucial para evitar que secções sejam cortadas, era ignorada.
- **Conclusão:** A abordagem de "fotografar e fatiar" é inerentemente falha para documentos complexos que exigem controlo de paginação.

### Fase 2: Geração Server-Side com `Puppeteer`
- **Estratégia:** Mover a lógica para o servidor, usando um *headless browser* (Puppeteer) que interpreta CSS corretamente.
- **Problema Fundamental:** Conflito com a fronteira cliente-servidor do Next.js.
- **Erro Manifestado:** **`You're importing a component that imports react-dom/server...`**
- **Análise:** O sistema de *build* do Next.js impediu que código de servidor (`puppeteer`) fosse incluído no pacote do cliente, e as tentativas de isolar o código falharam.
- **Conclusão:** A complexidade de isolar o código do servidor na arquitetura do Next.js tornou a abordagem inviável.

### Fase 3: Impressão Nativa do Navegador (Atual)
- **Estratégia:** Alavancar a funcionalidade "Imprimir para PDF" do navegador, que respeita as regras de CSS, passando os dados para uma nova aba (`/orcamento/imprimir`).
- **Problema Fundamental:** Falha na transferência de dados para a nova aba de impressão.
- **Análise das Falhas:** Tentativas com `localStorage` e `sessionStorage` falharam devido a *race conditions* (a nova aba lia os dados antes de serem escritos) e à complexidade de garantir a sincronização. A abordagem de injetar o HTML dinamicamente também se mostrou frágil.
- **Conclusão:** A impressão nativa é a mais promissora, mas requer uma solução 100% confiável para a transferência de dados no momento da abertura da página.

---

## 3. Desafio 2: Bloqueios de Segurança na IA ("Refinar com IA")

O erro **"Falha ao obter sugestão da IA. A resposta pode ter sido bloqueada por filtros de segurança"** tem sido a constante, apesar de múltiplas refatorações.

### Tentativa 1: Simplificação do Prompt
- **Hipótese:** O *prompt* original, que pedia uma longa cadeia de pensamento, era demasiado complexo.
- **Ação:** O *prompt* foi simplificado para pedir apenas uma análise curta e direta.
- **Resultado:** **Falhou.** O erro persistiu, indicando que o problema não era o comprimento do *prompt*, mas o seu conteúdo.

### Tentativa 2: Simplificação do Input de Dados
- **Hipótese:** Enviar um objeto JSON complexo (`technicalSpecifications`) dentro do *prompt* poderia estar a ser confundido com código malicioso.
- **Ação:** Em vez de enviar o JSON completo, o *prompt* foi alterado para enviar apenas o valor numérico da potência do painel (ex: `Potência: 550`).
- **Resultado:** **Falhou.** O erro persistiu.

### Tentativa 3: Mudança de Modelo de IA
- **Hipótese:** O modelo `gemini-2.5-flash` poderia ser excessivamente sensível para este caso de uso.
- **Ação:** O fluxo foi forçado a usar um modelo diferente e mais robusto, o `gemini-1.5-flash-latest`.
- **Resultado:** **Falhou.** O erro persistiu, demonstrando que o problema é fundamental para a política de segurança da plataforma, independentemente do modelo.

### Tentativa 4: Separação de Responsabilidades (Cálculo no Código, Análise na IA)
- **Hipótese:** Pedir à IA para realizar qualquer tipo of cálculo ou análise financeira era o gatilho.
- **Ação:** A arquitetura foi refatorada. O código TypeScript tornou-se responsável por todos os cálculos (quantidade ideal de painéis, novo custo, etc.). A IA recebia apenas os números já calculados e a sua única tarefa era gerar o texto da análise.
- **Resultado:** **Falhou.** Mesmo com esta separação, o contexto de "produtos", "custos" e "otimização" parece ser suficiente para acionar os filtros.

---

## 4. Conclusão Geral e Hipótese Atual

A análise de todas as tentativas falhadas leva a uma conclusão central:

**A combinação de um contexto comercial (produtos, custos, dimensionamento) com a tarefa de geração de texto, por mais simplificada que seja, está a ser consistentemente interpretada pelos modelos de linguagem como uma violação das políticas de segurança, provavelmente relacionadas com a proibição de dar aconselhamento financeiro ou comercial automatizado.**

O sistema de segurança não está apenas a olhar para palavras-chave, mas para o *padrão de uso* completo. A nossa abordagem, independentemente da implementação, encaixa-se neste padrão proibido. A próxima tentativa terá de abandonar completamente a ideia de usar uma IA generativa para analisar ou comentar sobre os dados da proposta, focando-se em soluções puramente algorítmicas ou em interfaces que permitam ao próprio utilizador fazer a comparação, sem a intervenção da IA.