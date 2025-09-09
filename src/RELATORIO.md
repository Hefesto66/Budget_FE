# Relatório de Incidente: Falha Crítica na Geração de Propostas PDF

**Data:** 25/07/2024
**Autor:** Assistente de IA - Firebase Studio
**Status:** **Análise Concluída - Causa Raiz Identificada**

## 1. Resumo Executivo

O sistema está a enfrentar uma falha crítica e persistente que impede a geração de propostas em PDF, manifestando-se ao utilizador final como o erro "O conteúdo da proposta não foi encontrado". Após múltiplas tentativas de correção focadas em sintomas (renderização de PDF, passagem de dados), uma análise mais profunda revelou que a causa raiz não está no sistema de exportação, mas sim na **lógica de processamento de dados do formulário da cotação**.

O sistema está a falhar silenciosamente na extração de especificações técnicas essenciais (potência do painel, eficiência do inversor) da lista de materiais. Isto resulta num cálculo financeiro com valores nulos ou zero, produzindo um objeto de resultados (`results`) inválido. Este objeto de resultados inválido, quando passado para o componente de renderização do PDF (`ProposalDocument`), quebra o processo, resultando num conteúdo de proposta vazio e no erro subsequente.

Este relatório detalha a cronologia das tentativas de correção, a razão técnica para as suas falhas e apresenta a solução definitiva focada na causa raiz.

---

## 2. Cronologia do Incidente e Análise das Tentativas de Correção

### Tentativa 1: Correção do Componente de Proposta (`ProposalDocument.tsx`)

*   **Ação Realizada:** A hipótese inicial era que o componente de renderização do PDF não estava a lidar corretamente com dados de cliente ausentes (`clientData`). A correção focou-se em adicionar "optional chaining" (`?.`) e valores de fallback (ex: "Cliente Final") para evitar erros de `null reference`.
*   **Porque Falhou:** Esta correção foi superficial. Embora tenha tornado o componente de *template* mais robusto, ela tratou apenas um sintoma. O problema real não era a ausência de dados do cliente, mas sim a invalidade de todo o objeto de `results` do cálculo financeiro. O componente continuava a receber `results` corrompidos (com `NaN` ou `Infinity` nos valores financeiros), e o processo de renderização para HTML continuava a falhar antes mesmo de chegar à secção do cliente.

### Tentativa 2: Validação na Função de Exportação (`handleExportPdf`)

*   **Ação Realizada:** A hipótese mudou para um problema na função que aciona a exportação, `handleExportPdf`. A correção focou-se em garantir que os dados da empresa (`companyData`) fossem carregados do `localStorage` antes de prosseguir. A ideia era interromper o fluxo se os dados essenciais não estivessem presentes.
*   **Porque Falhou:** Esta tentativa também falhou porque partiu de uma premissa incorreta. O utilizador confirmou que os dados da empresa estavam preenchidos. A validação adicionada era correta, mas não era a causa do problema. O fluxo passava por esta verificação e falhava mais à frente, na mesma etapa de renderização do `ProposalDocument` com dados de cálculo inválidos.

### Tentativa 3 (Análise Correta): O Problema da Extração de Dados

*   **Diagnóstico Final:** A verdadeira causa raiz foi identificada na função `processForm` dentro de `src/components/wizard/Wizard.tsx`. Esta função, que deveria atuar como um "controlador" entre o formulário e o motor de cálculo, não estava a cumprir a sua função mais crítica:
    1.  **Não lia o `technicalSpecifications`:** Ela não estava a aceder ao objeto `technicalSpecifications` dentro dos itens da `billOfMaterials` para extrair a potência e a eficiência.
    2.  **Não validava a presença de itens:** Não verificava se um "Painel Solar" ou um "Inversor" sequer existiam na lista antes de tentar o cálculo.
    3.  **Não calculava o custo dinamicamente:** O `custo_sistema_reais` era passado como um valor fixo ou `undefined`, em vez de ser a soma dos custos dos itens na lista.

*   **Consequência Técnica:** Devido a estas falhas, o objeto `calculationData` era enviado para o `calculateSolarFlow` com `potencia_modulo_wp: 0` e `eficiencia_inversor_percent: 0`. O motor de cálculo, embora funcional, executava divisões por zero ou cálculos sem sentido, resultando em `NaN` e `Infinity` no objeto `results` final. Quando `ReactDOMServer.renderToString` tentava renderizar um componente com estes valores numéricos inválidos, o processo falhava, retornando uma string vazia e causando o erro final para o utilizador.

---

## 3. Solução Estratégica e Definitiva

A solução requer uma refatoração focada em `Wizard.tsx` para garantir a integridade dos dados *antes* de qualquer chamada ao backend.

1.  **Refatorar `processForm` para Extração Explícita:** A função deve ser modificada para usar `find` na `billOfMaterials`, aceder a `item.technicalSpecifications['Potência (Wp)']`, converter para número e validar. O mesmo para a eficiência do inversor.
2.  **Cálculo Dinâmico de Custo:** Implementar um `.reduce()` na `billOfMaterials` para calcular o `custo_sistema_reais` total.
3.  **Validação Bloqueante com Feedback:** Antes de chamar `getCalculation`, verificar se os itens e especificações essenciais foram encontrados. Se não, exibir um `toast` de erro claro e descritivo para o utilizador (ex: "Adicione um Painel Solar com a especificação 'Potência (Wp)' para continuar.") e **interromper o processo**.
4.  **Flexibilizar o Schema do Zod:** O `solarCalculationSchema` em `src/types/index.ts` deve ser ajustado para tornar os campos preenchidos pela `processForm` (como `potencia_modulo_wp`) opcionais. A validação de negócio (se o campo *deve* existir) pertence à `processForm`, não à validação de tipo de dados.
5.  **Robustez no Backend:** Como uma camada final de defesa, o `calculateSolarFlow` deve usar o operador "nullish coalescing" (`??`) para aplicar valores padrão seguros a quaisquer parâmetros opcionais, garantindo que ele nunca falhe por dados em falta.

A implementação desta solução em três frentes (frontend, tipos, backend) irá erradicar a causa raiz do problema, garantindo a integridade dos dados em todo o fluxo e tornando a aplicação robusta e fiável.