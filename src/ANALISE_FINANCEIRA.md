# Relatório Técnico: Módulo de Análise Financeira

**Data:** 25/07/2024
**Autor:** Assistente de IA - Firebase Studio
**Status:** **Análise Concluída**

## 1. Resumo Executivo

Este documento fornece uma análise técnica detalhada do módulo de cálculo financeiro implementado no fluxo `calculateSolarFlow` (`src/ai/flows/calculate-solar.ts`). O objetivo é auditar as fontes de dados, as fórmulas utilizadas e a sua correta implementação para garantir a precisão das projeções de economia e retorno do investimento (payback) para o cliente final.

A análise confirma que as fórmulas matemáticas para o cálculo da economia e do payback estão **corretamente implementadas** de acordo com a lógica de negócio padrão para sistemas de geração distribuída no Brasil. No entanto, a precisão dos resultados é **altamente dependente da qualidade e correção dos dados de entrada (inputs)**. A principal fonte de erro, como investigado anteriormente, tem sido a falha em fornecer dados corretos a partir da lista de materiais (BOM).

---

## 2. Arquitetura do Cálculo Financeiro

O coração da análise financeira reside no ficheiro `src/ai/flows/calculate-solar.ts`. Este fluxo recebe um objeto de dados (`SolarCalculationInput`) e retorna um objeto de resultados (`SolarCalculationResult`) contendo o dimensionamento, a geração e a análise financeira.

### 2.1. Fontes de Dados (Inputs) Utilizadas

Os seguintes campos do `SolarCalculationInput` são cruciais para a análise financeira:

**Dados da Fatura do Cliente:**
*   `valor_medio_fatura_reais`: O valor total da conta de luz antes do sistema solar. **(Input Primário)**
*   `consumo_mensal_kwh`: O consumo de energia em kWh. Usado para calcular a tarifa.
*   `cip_iluminacao_publica_reais`: Taxa de iluminação pública, um custo fixo que permanece após a instalação.
*   `rede_fases`: ("mono", "bi", "tri"): Determina o custo de disponibilidade.

**Dados do Sistema (Derivados da Lista de Materiais):**
*   `custo_sistema_reais`: O custo total do investimento (equipamentos + instalação). **(Input Primário para Payback)**
*   `potencia_modulo_wp`, `quantidade_modulos`, `eficiencia_inversor_percent`, `irradiacao_psh_kwh_m2_dia`: Estes campos determinam a `geracao_media_mensal_kwh`, que é a base para o cálculo da economia.

**Parâmetros Financeiros:**
*   `custo_om_anual_reais`: Custo de operação e manutenção anual (afeta a economia do primeiro ano).
*   `adicional_bandeira_reais_kwh`: Custos adicionais de bandeiras tarifárias.

---

## 3. Análise das Fórmulas e Implementação

As fórmulas estão implementadas no fluxo `calculateSolarFlow`. A seguir, uma descrição da sua aplicação.

### Etapa 1: Cálculo da Tarifa de Energia
*   **Fórmula:** `tarifa_energia_reais_kwh = valor_medio_fatura_reais / consumo_mensal_kwh`
*   **Implementação:**
    ```typescript
    const tarifa_energia_reais_kwh = data.consumo_mensal_kwh > 0 ? data.valor_medio_fatura_reais / data.consumo_mensal_kwh : 0;
    ```
*   **Avaliação:** **Correto.** A fórmula calcula o custo médio por kWh com base na fatura do cliente. A verificação `> 0` evita a divisão por zero.

### Etapa 2: Cálculo da Geração de Energia
*   **Lógica:** A geração mensal (`geracao_media_mensal_kwh`) é calculada com base na potência do sistema e na irradiação solar.
*   **Avaliação:** **Correto.** Esta parte do cálculo não é financeira, mas é o input mais crítico para a economia. Se a geração for zero, a economia será zero.

### Etapa 3: Cálculo da Nova Conta de Luz (Pós-Sistema)
*   **Lógica:** A nova conta é composta pelo **maior valor** entre o custo de disponibilidade e o consumo não compensado, mais a taxa de iluminação pública.
*   **Implementação:**
    1.  **Custo de Disponibilidade (kWh):** É determinado pelo tipo de rede (`DISPONIBILITY_COST_KWH`).
        ```typescript
        const custo_disponibilidade_kwh = DISPONIBILITY_COST_KWH[data.rede_fases]; // 30, 50 ou 100 kWh
        ```
    2.  **Energia Compensada:** O sistema compensa a energia consumida, descontando o custo de disponibilidade.
        ```typescript
        const energia_compensada_kwh = Math.min(geracao_media_mensal_kwh, Math.max(0, data.consumo_mensal_kwh - custo_disponibilidade_kwh));
        ```
    3.  **Custo da Nova Conta:**
        ```typescript
        const conta_depois_reais = Math.max(custo_disponibilidade_reais, consumo_faturado_com_gd_reais) + data.cip_iluminacao_publica_reais;
        ```
*   **Avaliação:** **Correto.** A lógica segue as regras da ANEEL para a compensação de energia e o faturamento mínimo baseado no custo de disponibilidade.

### Etapa 4: Cálculo da Economia
*   **Fórmula da Economia Mensal:** `economia_mensal_reais = conta_antes_reais - conta_depois_reais`
*   **Implementação:**
    ```typescript
    const economia_mensal_reais = Math.max(0, conta_antes_reais - conta_depois_reais);
    ```
*   **Avaliação:** **Correto.** A função `Math.max(0, ...)` garante que a economia nunca seja negativa.

### Etapa 5: Cálculo do Payback Simples
*   **Fórmula:** `payback_simples_anos = custo_sistema_reais / (economia_mensal_reais * 12)`
*   **Implementação:**
    ```typescript
    const economia_anual_reais = economia_mensal_reais * 12;
    const payback_simples_anos = economia_anual_reais > 0 ? (custo_sistema_reais / economia_anual_reais) : Infinity;
    ```
*   **Avaliação:** **Correto.** A fórmula é a definição padrão de payback simples. A verificação `economia_anual_reais > 0` evita a divisão por zero e retorna `Infinity` se não houver economia, o que é um tratamento de erro adequado.

---

## 4. Conclusão e Recomendações

O módulo de análise financeira está **logicamente correto e bem implementado** do ponto de vista das fórmulas. O problema que enfrentamos não reside nas fórmulas em si, mas na **qualidade dos dados que as alimentam**.

**Ponto Crítico de Falha (Já Identificado):**
A falha persistente em extrair `potencia_modulo_wp`, `quantidade_modulos`, `eficiencia_inversor_percent`, e `custo_sistema_reais` da lista de materiais (`billOfMaterials`) no frontend (`Wizard.tsx`) é o que corrompe todo o cálculo. Quando estes valores chegam como `0` ou `undefined` ao backend, o resultado é:
*   `geracao_media_mensal_kwh` torna-se `0`.
*   `economia_mensal_reais` torna-se `0` (ou um valor muito baixo).
*   `payback_simples_anos` torna-se `Infinity`.

**Próximos Passos:**
A prioridade máxima é garantir que o `processForm` no frontend seja capaz de ler e extrair os dados técnicos da lista de materiais de forma consistente, como foi detalhado na nossa última investigação. Uma vez que os inputs corretos sejam fornecidos ao fluxo `calculateSolarFlow`, as fórmulas existentes produzirão os resultados financeiros esperados.