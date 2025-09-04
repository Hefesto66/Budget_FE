# Relatório Técnico do Aplicativo: FE Sistema Solar

Este documento detalha a arquitetura, o fluxo de funcionamento, as tecnologias empregadas e a lógica de cálculo do aplicativo de orçamento para sistemas de energia solar.

## 1. Visão Geral e Objetivo

O aplicativo "FE Sistema Solar" é uma ferramenta web projetada para permitir que usuários simulem a instalação de um sistema de energia solar fotovoltaica. Seu principal objetivo é fornecer uma análise financeira e técnica detalhada, ajudando o usuário a entender a viabilidade, os custos, a economia e o tempo de retorno do investimento (payback).

O processo é guiado por um assistente (wizard) que coleta dados do usuário em etapas e apresenta um relatório completo e personalizado.

## 2. Tecnologias Utilizadas

A aplicação é construída sobre uma pilha de tecnologias moderna, focada em performance, escalabilidade e uma excelente experiência de desenvolvimento e de usuário.

- **Frontend Framework:** **Next.js 15** com App Router. Utilizado para renderização no servidor (SSR) e no cliente (CSR), otimizando a velocidade de carregamento e o SEO.
- **Linguagem:** **TypeScript**. Garante a segurança de tipos em todo o projeto, reduzindo bugs e facilitando a manutenção.
- **UI (Interface do Usuário):**
    - **React 18:** Biblioteca principal para a construção da interface de usuário reativa.
    - **ShadCN/UI:** Coleção de componentes de UI reutilizáveis, acessíveis e customizáveis, construídos sobre Radix UI e Tailwind CSS.
    - **Tailwind CSS:** Framework CSS "utility-first" para estilização rápida e consistente.
    - **Framer Motion:** Utilizada para as animações de transição entre as etapas do assistente, tornando a navegação mais fluida.
- **Backend e Lógica de Servidor:**
    - **Genkit (Firebase):** Framework de IA do Google, utilizado aqui para orquestrar as "flows" (fluxos) que rodam no servidor. Toda a lógica de cálculo pesada e a comunicação com a IA são encapsuladas em flows Genkit.
- **Validação de Dados:**
    - **Zod:** Biblioteca para declaração e validação de schemas. É usada para garantir que todos os dados enviados do formulário para o servidor estejam corretos e seguros.

## 3. Lógica de Funcionamento e Processos

O fluxo principal do usuário é simples e linear, dividido em três partes principais:

1.  **Página Inicial (`/`):** Atua como uma landing page. Apresenta os benefícios da energia solar e incentiva o usuário a iniciar um orçamento gratuito.
2.  **Página de Orçamento (`/orcamento`):** É o coração da aplicação. Contém o assistente de múltiplos passos.
    - **Passo 1: Coleta de Dados:** O usuário preenche um formulário detalhado com informações sobre seu consumo de energia, custos atuais, características técnicas da sua instalação e os equipamentos desejados (módulos e inversor).
    - **Passo 2: Apresentação dos Resultados:** Após o envio, os dados são processados no servidor e os resultados são devolvidos e exibidos em uma página de relatório.
3.  **Refinamento com IA:** Na página de resultados, o usuário tem a opção de solicitar uma "análise refinada por IA". Isso aciona um segundo fluxo no servidor que analisa os resultados iniciais e sugere otimizações, justificando as sugestões.

## 4. Análise de Orçamento Solar (Funcionalidade Principal)

Esta seção detalha como a funcionalidade de cálculo de orçamento é implementada.

### 4.1. Coleta de Dados (Campos de Entrada)

Os dados são coletados no componente `Step1DataInput.tsx` e validados pelo schema Zod (`solarCalculationSchema`) em `src/types/index.ts`. Os campos obrigatórios para o cálculo são:

**Informações de Consumo e Fatura:**
- `consumo_mensal_kwh`: Consumo médio mensal de energia (em kWh).
- `valor_medio_fatura_reais`: Custo médio da conta de luz (em R$).
- `cip_iluminacao_publica_reais`: Taxa de iluminação pública (CIP/COSIP), não compensável.
- `adicional_bandeira_reais_kwh`: Custo extra da bandeira tarifária por kWh (opcional).

**Detalhes Técnicos:**
- `concessionaria`: Nome da empresa de energia (limitado a "Equatorial GO" e "CHESP").
- `rede_fases`: Tipo de rede elétrica ("mono", "bi" ou "tri"), que define a taxa de disponibilidade.
- `irradiacao_psh_kwh_m2_dia`: Média de horas de sol pico no local.

**Equipamentos e Custos (Sistema):**
- `potencia_modulo_wp`: Potência de cada painel solar (em Wp).
- `preco_modulo_reais`: Custo unitário de cada painel.
- `quantidade_modulos`: Quantidade de painéis (opcional; se vazio, é calculado automaticamente).
- `eficiencia_inversor_percent`: Eficiência do inversor (em %).
- `custo_inversor_reais`: Custo do inversor.
- `fator_perdas_percent`: Perdas totais do sistema (sujeira, aquecimento, etc.).
- `custo_fixo_instalacao_reais`: Custos de mão de obra, projeto, etc.
- `custo_om_anual_reais`: Custo de operação e manutenção anual (opcional).

### 4.2. Lógica de Cálculo de Precificação

Toda a lógica de cálculo é executada de forma segura no servidor, dentro do flow Genkit em `src/ai/flows/calculate-solar.ts`. O processo segue a seguinte ordem:

1.  **Cálculo da Tarifa Efetiva:** A tarifa de energia (R$/kWh) é derivada da divisão entre o valor da fatura e o consumo mensal. A isso, soma-se o custo da bandeira para obter a tarifa final.
2.  **Custo da Fatura Atual:** O custo da fatura "antes" do sistema solar é simplesmente o valor médio da fatura informado pelo usuário.
3.  **Dimensionamento do Sistema:**
    - **Eficiência Efetiva:** Calcula-se a eficiência real do sistema, descontando as perdas da eficiência do inversor. `(eficiencia_inversor / 100) * (1 - perdas / 100)`.
    - **Geração por Módulo:** Estima-se a energia (kWh) que um único painel gera por mês. `(potencia_modulo_wp / 1000) * irradiacao * 30 * eficiencia_efetiva`.
    - **Quantidade de Módulos:** Se não for informada, é calculada dividindo o consumo mensal pela geração de um módulo, com o resultado sempre arredondado para cima.
4.  **Cálculo da Geração Total:** A geração média mensal do sistema é a geração por módulo multiplicada pela quantidade de módulos.
5.  **Cálculo da Energia Compensada:**
    - **Custo de Disponibilidade:** Define-se a energia mínima não compensável com base na rede: 30 kWh (mono), 50 kWh (bi) ou 100 kWh (tri).
    - **Energia Compensável:** A energia que o sistema pode de fato compensar é o consumo mensal menos a taxa de disponibilidade. O valor final compensado é o menor entre a geração total do sistema e essa parcela compensável.
6.  **Cálculo da Nova Fatura ("Depois" do Sistema):**
    - **Consumo Não Compensado:** É o consumo total menos a energia efetivamente compensada.
    - **Custo da Energia Pós-Solar:** É o consumo não compensado multiplicado pela tarifa final.
    - **Custo Mínimo:** A lógica garante que o valor cobrado pela energia nunca seja menor que o custo de disponibilidade (`custo_disponibilidade_kwh * tarifa_final_reais_kwh`).
    - **Valor Final da Fatura:** O valor final é o **maior** valor entre o custo da energia pós-solar e o custo mínimo, somado à taxa de iluminação pública (CIP).
7.  **Análise Financeira:**
    - **Economia Mensal:** `Fatura Antes - Fatura Depois`.
    - **Custo Total do Sistema:** Soma dos custos dos módulos, do inversor e da instalação.
    - **Payback Simples (Anos):** `Custo Total do Sistema / Economia Anual`.

Este processo garante uma simulação robusta, segura e alinhada às regras do setor elétrico brasileiro para geração distribuída.
