# Relatório de Incidente: Falha Crítica no Fluxo de Cálculo do Orçamento

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio
**Status:** **Crítico - Não Resolvido**

## 1. Resumo Executivo

O fluxo de criação de orçamentos, funcionalidade central da aplicação, encontra-se num estado de falha persistente e crítico. O sintoma principal é a total ausência de reação do botão "Avançar para Resultados" quando a lista de materiais (`billOfMaterials`) contém itens, especificamente o painel solar e o inversor. Paradoxalmente, o cálculo é processado corretamente quando a lista de materiais está vazia.

Este comportamento indica um erro fundamental na validação dos dados no *frontend* (navegador), que bloqueia a submissão do formulário de forma silenciosa, sem fornecer qualquer feedback ao utilizador. Este relatório documenta as tentativas de correção, as razões pelas quais falharam e apresenta uma análise estruturada do problema.

---

## 2. Anatomia do Problema

O fluxo de trabalho pretendido é o seguinte:
1.  O utilizador preenche os dados de consumo e a lista de materiais no Passo 1 (`Wizard.tsx`).
2.  Ao clicar em "Avançar para Resultados", a função `processForm` é acionada.
3.  `processForm` recolhe os dados, valida-os usando um *schema* da biblioteca Zod, e envia-os para a ação de servidor `getCalculation`.
4.  O servidor executa a lógica de negócio em `calculateSolarFlow` e retorna os resultados.
5.  O frontend exibe os resultados no Passo 2.

**O Ponto de Falha:** O processo está a ser interrompido **antes do passo 3**. A validação do Zod no *frontend* está a falhar silenciosamente, impedindo que a função `processForm` seja executada.

---

## 3. Histórico de Tentativas de Correção e Análise de Falhas

### Tentativa 1: Flexibilização da Validação no Backend
- **Ação:** Modifiquei o fluxo `calculateSolarFlow` no *backend* para aceitar valores `0` para campos como `potencia_modulo_wp`, pensando que o erro era uma rejeição do servidor.
- **Por que Falhou:** O problema não estava no *backend*. A submissão dos dados nunca chegava a acontecer. O erro estava a ocorrer no *frontend*, antes da chamada de rede.

### Tentativa 2: Remoção do Botão Duplicado
- **Ação:** Identifiquei um botão de *submit* escondido no componente `Step1DataInput.tsx` e removi-o, acreditando que poderia estar a causar um conflito de formulário.
- **Por que Falhou:** Embora fosse uma boa prática de higiene do código, não era a causa raiz. O problema de validação subjacente persistiu.

### Tentativa 3: Ajuste do Schema para `.gte(0)`
- **Ação:** Alterei a validação de `consumo_mensal_kwh` de `.positive()` para `.gte(0)`, suspeitando que a inserção de um `0` temporário pelo utilizador estava a invalidar o formulário.
- **Por que Falhou:** Esta foi uma correção válida para um problema secundário, mas não resolveu o problema principal. O bloqueio continuou quando a lista de materiais era preenchida, indicando que o conflito de validação era mais complexo.

### Tentativa 4: Simplificação do `wizardSchema` e Validação Lógica
- **Ação:** A minha hipótese era que o *schema* aninhado (`solarCalculationSchema` dentro do `wizardSchema`) estava a criar um conflito. Tentei simplificá-lo e mover a lógica de validação para dentro da função `processForm`.
- **Por que Falhou:** A abordagem foi correta na intenção, mas a execução foi falha. Eu não consegui desacoplar completamente a dependência entre a `billOfMaterials` e a `calculationInput` a nível da validação do Zod. O formulário ainda tentava validar um estado inconsistente de dados, onde os valores da lista de materiais (ex: potência) ainda não tinham sido formalmente transferidos para os campos correspondentes do `calculationInput` no momento da validação.

---

## 4. Hipótese Atual e Causa Raiz Provável

**O problema é um conflito de validação no frontend causado por uma dependência circular implícita.**

1.  O nosso formulário principal (`Wizard.tsx`) usa um único *schema* Zod (`wizardSchema`) para validar todo o seu estado.
2.  Este *schema* inclui o `solarCalculationSchema`, que contém campos como `potencia_modulo_wp`.
3.  O valor de `potencia_modulo_wp` **só pode ser conhecido depois de processar a `billOfMaterials`**.
4.  No entanto, o Zod tenta validar **tudo de uma só vez**. No momento da validação, o campo `potencia_modulo_wp` dentro do objeto do formulário está vazio ou com o valor padrão, mesmo que um painel solar já tenha sido adicionado à `billOfMaterials`.
5.  Esta discrepância — ter um painel na lista, mas não ter a sua potência refletida no campo `potencia_modulo_wp` no mesmo instante — invalida o formulário.
6.  Como não há uma mensagem de erro explicitamente ligada a este campo no Passo 1, a falha é **silenciosa**. O botão não faz nada.

Em suma, estamos a pedir ao Zod para validar o resultado de um processamento que ainda não aconteceu.

**Próximos Passos Sugeridos:**
A solução definitiva exige o total desacoplamento da validação dos dados de entrada do utilizador da validação dos dados processados. Devemos:
1.  Simplificar radicalmente o `wizardSchema` para validar apenas os campos que o utilizador insere diretamente.
2.  Construir o objeto `calculationData` final dentro da função `processForm` **após** a validação bem-sucedida dos dados de entrada.
3.  Só então, opcionalmente, validar este objeto `calculationData` final contra o `solarCalculationSchema` antes de o enviar para o servidor.

Isto quebra a dependência circular e garante que a validação ocorra apenas em dados consistentes e totalmente processados.