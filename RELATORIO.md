# Relatório Técnico: Desafios na Geração de PDF com Quebra de Página

**Data:** 24/07/2024
**Autor:** Assistente de IA - Firebase Studio

## 1. Problema Principal: Quebra de Página Incorreta na Geração de PDF

O objetivo central é gerar um documento PDF profissional e de várias páginas a partir de um conteúdo HTML dinâmico. O desafio mais crítico é controlar as quebras de página para garantir a integridade visual e a legibilidade do documento.

O comportamento indesejado observado é que secções lógicas de conteúdo (por exemplo, um título de secção e o seu conteúdo associado, como "Seu Impacto Positivo no Planeta") são "cortadas" ao meio quando uma página termina e a seguinte começa. Isto resulta numa aparência pouco profissional e numa má experiência de leitura.

O comportamento desejado é que o motor de geração de PDF trate estas secções como blocos "inseparáveis". Se um bloco de conteúdo não couber no espaço restante de uma página, ele deve ser movido integralmente para o topo da página seguinte.

## 2. Pilha de Tecnologia Utilizada

- **Biblioteca de Geração de PDF:** `jspdf`
- **Biblioteca de Renderização de HTML para Canvas:** `html2canvas`
- **Framework:** Next.js (React)

O fluxo de trabalho fundamental consiste em utilizar o `html2canvas` para capturar o conteúdo HTML da proposta e renderizá-lo para um elemento `<canvas>`. Em seguida, o `jspdf` pega a imagem desse canvas e insere-a num documento PDF.

## 3. Histórico de Soluções Tentadas e Resultados

Foram implementadas várias estratégias para resolver o problema da quebra de página. Abaixo está um resumo detalhado de cada abordagem e a razão pela qual não foi bem-sucedida.

### Tentativa 1: Utilização de Propriedades CSS de Impressão (`page-break-`)

- **Estratégia:** A abordagem mais padrão e semanticamente correta para controlar a impressão a partir do HTML. Foram aplicadas as seguintes regras de CSS às secções que não deveriam ser quebradas:
  - `page-break-inside: avoid !important;` para evitar quebras dentro de um elemento.
  - `page-break-before: always !important;` para forçar que uma secção comece sempre numa nova página (por exemplo, para gráficos importantes).

- **Razão da Falha:** Esta abordagem falhou porque o `html2canvas` não funciona como um navegador de impressão. Ele não interpreta as regras de `@media print` nem as propriedades de `page-break-*`. Em vez disso, ele renderiza o conteúdo HTML como uma única imagem longa e contínua num elemento `<canvas>`. A lógica subsequente no `jspdf` simplesmente "fatiava" esta imagem alta em pedaços do tamanho de uma página A4, ignorando completamente as diretivas de CSS e resultando nas quebras de página incorretas.

### Tentativa 2: Refatoração da Lógica para Cálculo Programático de Páginas

- **Estratégia:** Reconhecendo que o CSS não funcionaria, a abordagem foi alterada para uma solução programática. O plano era:
  1. Dar a cada secção inseparável uma classe CSS específica (ex: `pdf-section`).
  2. No `handleExportPdf`, iterar sobre cada elemento com a classe `pdf-section`.
  3. Medir a altura de cada secção.
  4. Manter um registo do espaço vertical restante na página atual do PDF.
  5. Antes de desenhar uma secção, verificar se a sua altura era maior do que o espaço restante. Se fosse, adicionar uma nova página (`pdf.addPage()`) antes de desenhar a secção.

- **Razão da Falha:** Esta abordagem, embora teoricamente sólida, foi impedida por um erro persistente originado no `html2canvas`: **`Unable to find element in cloned iframe`**. Este erro ocorre frequentemente quando a biblioteca tenta renderizar conteúdo complexo, como:
    - Imagens externas que ainda não foram totalmente carregadas.
    - Fontes personalizadas.
    - Componentes baseados em SVG com estruturas DOM complexas (como os gráficos da biblioteca `recharts`).
  
  O erro impedia que o canvas fosse gerado corretamente, pelo que a lógica de medição e quebra de página nunca chegava a ser executada.

### Tentativa 3: Resolução do Erro `html2canvas`

- **Estratégia:** O foco mudou para a resolução do erro `Unable to find element...`. As tentativas incluíram:
  1. **Aguardar pelo Carregamento de Imagens:** Adicionar lógica para garantir que todas as imagens (`<img>`) no documento tivessem concluído o carregamento antes de chamar o `html2canvas`.
  2. **Remoção de Conteúdo Complexo:** Isolar o problema removendo o componente do gráfico `SavingsChart` do documento durante a renderização para o PDF.
  
- **Razão da Falha:** Apesar destas medidas, o erro persistiu. Isto indica que a causa raiz é mais profunda do que simplesmente imagens ou gráficos, podendo estar relacionada com a forma como o Next.js e o React hidratam e estruturam o DOM, ou com outros componentes da UI (ShadCN) que o `html2canvas` tem dificuldade em clonar para o seu `iframe` de renderização.

## 4. Conclusão e Próximos Passos Sugeridos

A abordagem baseada em CSS falha devido à natureza do `html2canvas`. A abordagem programática, que é a solução correta em teoria, está a ser bloqueada por um problema de renderização fundamental dentro do próprio `html2canvas` no contexto desta aplicação específica.

Sugere-se que a próxima tentativa se concentre em **substituir `html2canvas`** por uma biblioteca de geração de PDF mais direta e poderosa que possa interpretar HTML e CSS, incluindo regras de impressão. Uma excelente alternativa é a biblioteca **`Puppeteer`**, que utiliza uma instância headless do Chrome para gerar o PDF, garantindo uma fidelidade de 100% com o que é renderizado no navegador, incluindo a aplicação correta das propriedades `page-break-*`. No entanto, o Puppeteer precisa de ser executado num ambiente de backend (Node.js), pelo que exigiria a criação de uma API route ou de uma server action no Next.js para lidar com a geração do PDF.