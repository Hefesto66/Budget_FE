# Relatório de Incidente: Falha na Extração de Dados da Lista de Materiais

**Data:** 25/07/2024
**Autor:** Assistente de IA - Firebase Studio
**Status:** **Crítico - Análise Concluída**

## 1. Resumo Executivo

O fluxo de cálculo do orçamento, embora agora não bloqueie mais, está a produzir resultados incorretos. A causa raiz foi identificada: o sistema **não está a extrair corretamente os dados de especificações técnicas** (como "Potência (Wp)" do painel solar e "Eficiência (%)" do inversor) da lista de materiais (`billOfMaterials`).

Quando um painel e um inversor são adicionados, o cálculo prossegue como se a sua potência e eficiência fossem zero. Isto invalida completamente a análise financeira e de geração. Este relatório detalha a falha e apresenta a solução profissional para garantir a correta extração e processamento dos dados.

---

## 2. Anatomia do Problema

O fluxo de trabalho pretendido dentro da função `processForm` é:
1.  Receber os dados do formulário, que incluem a lista de materiais (`billOfMaterials`).
2.  Encontrar o item da categoria `PAINEL_SOLAR` na lista.
3.  Ler a sua especificação técnica `Potência (Wp)` do objeto `technicalSpecifications`.
4.  Encontrar o item da categoria `INVERSOR` na lista.
5.  Ler a sua especificação técnica `Eficiência (%)`.
6.  Usar estes valores para construir o objeto de dados de cálculo (`calculationData`) e enviá-lo para o servidor.

**O Ponto de Falha:** O processo falha nos passos 3 e 5. A lógica atual dentro de `processForm` não está a aceder corretamente ao objeto `technicalSpecifications` do item encontrado na lista. Em vez disso, está a tentar ler estes valores de um local incorreto ou a usar valores padrão de `0`, o que leva a um cálculo falho.

**Armazenamento dos Dados:** A forma como os dados estão a ser guardados está correta. Cada produto no inventário (`src/lib/storage.ts`) possui um campo `technicalSpecifications`, que é um objeto `Record<string, string>`. Quando um produto é adicionado à `billOfMaterials`, este objeto de especificações é corretamente copiado para o item da lista. O problema não é o armazenamento, mas sim a **leitura** desses dados no momento do processamento.

---

## 3. Solução Profissional e Estratégica

A solução requer uma abordagem limpa e desacoplada, onde cada parte do sistema tem uma responsabilidade clara.

### Etapa 1: Flexibilizar o Schema de Validação (`src/types/index.ts`)

A validação não deve conter lógica de negócio. Ela deve apenas garantir que os tipos de dados estão corretos.

- **Ação:** Modificar o `solarCalculationSchema` para que os campos que dependem da lista de materiais (`potencia_modulo_wp`, `eficiencia_inversor_percent`, etc.) sejam **genuinamente opcionais** e aceitem `0`. A regra de negócio (ex: "se existe um painel, a potência não pode ser zero") não deve estar na validação do Zod, mas sim na lógica de processamento.
- **Porquê:** Isto impede que o Zod bloqueie o formulário prematuramente. Ele simplesmente garante que, se o campo for fornecido, ele é um número.

### Etapa 2: Centralizar e Corrigir a Lógica de Extração em `processForm` (`src/components/wizard/Wizard.tsx`)

Esta é a etapa mais crítica. A função `processForm` deve ser a única responsável por ler a lista de materiais e construir o objeto de cálculo final.

- **Ação:** Refatorar a `processForm` para:
    1.  Encontrar o `panelItem` e o `inverterItem` na lista de materiais (`data.billOfMaterials`).
    2.  **Aceder diretamente ao objeto `item.technicalSpecifications`** do item encontrado.
    3.  Extrair a string (ex: `'550'`) e convertê-la para um número (`parseFloat`). Adicionar uma verificação para garantir que o resultado é um número válido (não `NaN`).
    4.  Usar estes valores extraídos para preencher os campos `potencia_modulo_wp` e `eficiencia_inversor_percent` no objeto `calculationData`.
    5.  Se um item não for encontrado, estes campos não serão definidos no objeto, e o backend irá usar os seus valores padrão.

### Etapa 3: Reforçar o Backend para ser Tolerante a Falhas (`src/ai/flows/calculate-solar.ts`)

O servidor não deve assumir que receberá sempre todos os dados. Ele deve ser capaz de funcionar com o mínimo de informação necessária.

- **Ação:** No fluxo `calculateSolarFlow`, para cada campo opcional (como `eficiencia_inversor_percent`), usar o operador "nullish coalescing" (`??`) para aplicar um valor padrão seguro caso o campo não seja fornecido pelo frontend.
    - Exemplo: `const eficiencia_inversor = (data.eficiencia_inversor_percent ?? 97) / 100;`
- **Porquê:** Isto torna o backend robusto. Ele pode realizar um cálculo mesmo que o frontend, por alguma razão, não envie todos os detalhes, evitando erros de "divisão por zero" ou `undefined`.

---

## 4. Resultado Esperado

Ao implementar esta arquitetura, o fluxo de dados torna-se claro e à prova de erros:
1.  O formulário do frontend recolhe os dados sem validações de negócio complexas.
2.  A função `processForm` atua como um "controlador", extraindo e transformando os dados da lista de materiais de forma explícita e segura.
3.  O backend recebe um objeto de cálculo e aplica a sua lógica de negócio, usando valores padrão para quaisquer dados opcionais em falta.

Isto não só corrige o erro atual, mas também cria um sistema mais estável, previsível e fácil de depurar no futuro.