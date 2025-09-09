
import { NextRequest, NextResponse } from 'next/server';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, StyleDictionary, TFontDictionary } from 'pdfmake/interfaces';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';

interface ProposalData {
  results: SolarCalculationResult;
  formData: WizardFormData['calculationInput'];
  billOfMaterials: WizardFormData['billOfMaterials'];
  companyData: CompanyFormData;
  clientData: ClientFormData;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; // ISO string
  proposalValidity: string; // ISO string
}

// Initialize printer without custom fonts to use the default embedded Roboto font.
const printer = new PdfPrinter();

async function generatePdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: ProposalData = await req.json();
    const { results, billOfMaterials, companyData, clientData, customization, proposalId, proposalDate, proposalValidity } = body;

    const styles: StyleDictionary = {
      header: { fontSize: 20, bold: true, margin: [0, 0, 0, 20], color: customization.colors.primary },
      subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5], color: customization.colors.primary },
      bodyText: { fontSize: 10, margin: [0, 0, 0, 5] },
      tableHeader: { bold: true, fontSize: 11, color: customization.colors.textOnPrimary, fillColor: customization.colors.primary },
      tableCell: { fontSize: 10 },
      totalRow: { bold: true, fontSize: 12, color: customization.colors.textOnPrimary, fillColor: customization.colors.primary },
      companyHeader: { fontSize: 16, bold: true, color: customization.colors.primary },
      clientInfo: { margin: [0, 10, 0, 20] },
      footer: { fontSize: 8, alignment: 'center', margin: [0, 20, 0, 0], color: '#666' }
    };
    
    const bomBody = billOfMaterials.map(item => [
      { text: `${item.name}\n${item.manufacturer}`, style: 'tableCell' },
      { text: item.quantity, style: 'tableCell', alignment: 'center' },
      { text: formatCurrency(item.cost), style: 'tableCell', alignment: 'right' },
      { text: formatCurrency(item.cost * item.quantity), style: 'tableCell', alignment: 'right' },
    ]);

    const tirValue = results.financeiro.tir_percentual;
    const tirText = (isFinite(tirValue) && tirValue !== Infinity) 
        ? `${formatNumber(tirValue, 2)}%` 
        : 'N/A';
    
    const docDefinition: TDocumentDefinitions = {
      content: [
        // Header
        {
          columns: [
            companyData.logo ? { image: companyData.logo, width: 120 } : { text: '' },
            [
              { text: companyData.name, style: 'companyHeader', alignment: 'right' },
              { text: companyData.address, alignment: 'right' },
              { text: `CNPJ: ${companyData.cnpj}`, alignment: 'right' },
              { text: `Contato: ${companyData.phone} | ${companyData.email}`, alignment: 'right' },
            ]
          ],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#ccc' }] },
        
        // Proposal Title & Client Info
        { text: 'Proposta de Sistema Fotovoltaico', style: 'header', alignment: 'center' },
        {
          style: 'clientInfo',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: `ID Proposta:\n${proposalId}`, bold: true },
                { text: `Data:\n${formatDate(new Date(proposalDate))}`, bold: true },
                { text: `Validade:\n${formatDate(new Date(proposalValidity))}`, bold: true },
              ]
            ]
          },
          layout: 'noBorders'
        },
        {
            table: {
                widths: ['*'],
                body: [[{ text: `Preparado para: ${clientData.name}\n${clientData.address || ''}\nCPF/CNPJ: ${clientData.document || ''}`, style: 'bodyText' }]],
            },
            layout: {
                hLineWidth: () => 1, vLineWidth: () => 1,
                hLineColor: () => '#ddd', vLineColor: () => '#ddd',
            },
            margin: [0, 0, 0, 20]
        },

        // Investment Table
        { text: 'Descrição do Sistema e Investimento', style: 'subheader' },
        {
            table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [
                    ['Descrição', 'Qtde.', 'Preço Unit.', 'Preço Total'],
                    ...bomBody,
                    [
                      { text: 'Valor Total do Investimento', colSpan: 3, style: 'totalRow', alignment: 'right'}, {}, {}, 
                      { text: formatCurrency(results.financeiro.custo_sistema_reais), style: 'totalRow', alignment: 'right' }
                    ]
                ]
            },
            layout: {
                fillColor: function (rowIndex) {
                    if (rowIndex === 0) return customization.colors.primary;
                    if (rowIndex === billOfMaterials.length + 1) return customization.colors.primary;
                    return (rowIndex! % 2 === 0) ? '#f9f9f9' : null;
                }
            }
        },

        // Financial & Performance Analysis
        { text: 'Análise Financeira e de Geração', style: 'subheader', pageBreak: 'before' },
        {
            columns: [
                [
                    { text: 'Resumo Financeiro', bold: true, margin: [0,0,0,5] },
                    { text: `Conta Média Atual: ${formatCurrency(results.conta_media_mensal_reais.antes)}`},
                    { text: `Conta Média Estimada: ${formatCurrency(results.conta_media_mensal_reais.depois)}`},
                    { text: `Economia Mensal: ${formatCurrency(results.financeiro.economia_mensal_reais)}`},
                    { text: `Payback Simples: ${formatNumber(results.financeiro.payback_simples_anos, 1)} anos`},
                ],
                [
                    { text: 'Desempenho do Sistema', bold: true, margin: [0,0,0,5] },
                    { text: `Potência do Sistema: ${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp` },
                    { text: `Geração Média Mensal: ${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh` },
                ]
            ],
            margin: [0, 0, 0, 20]
        },

        // Advanced Analysis
        { text: 'Análise de Investimento Avançada', style: 'subheader' },
        {
            columns: [
                 { text: `VPL (Valor Presente Líquido):\n${formatCurrency(results.financeiro.vpl_reais)}`, style: 'bodyText' },
                 { text: `TIR (Taxa Interna de Retorno):\n${tirText}`, style: 'bodyText' },
            ]
        }
      ],
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.15
      },
      styles: styles,
      footer: {
        text: customization.footer.customText,
        style: 'footer'
      }
    };

    const pdfBuffer = await generatePdf(docDefinition);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate PDF.', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
