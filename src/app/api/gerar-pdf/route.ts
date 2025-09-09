
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import ReactDOMServer from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';

export async function POST(req: NextRequest) {
  try {
    const { 
        results, 
        formData,
        billOfMaterials,
        companyData, 
        clientData, 
        customization,
        proposalId,
        proposalDate,
        proposalValidity
    }: { 
        results: SolarCalculationResult,
        formData: WizardFormData['calculationInput'],
        billOfMaterials: WizardFormData['billOfMaterials'],
        companyData: CompanyFormData,
        clientData: ClientFormData,
        customization: CustomizationSettings,
        proposalId: string,
        proposalDate: string, // Pass dates as ISO strings
        proposalValidity: string
    } = await req.json();

    // Render React component to HTML string
    const htmlString = ReactDOMServer.renderToString(
        <ProposalDocument
            results={results}
            formData={formData}
            billOfMaterials={billOfMaterials}
            companyData={companyData}
            clientData={clientData}
            customization={customization}
            proposalId={proposalId}
            proposalDate={new Date(proposalDate)}
            proposalValidity={new Date(proposalValidity)}
        />
    );
    
    // Inject global styles and the rendered HTML into a full HTML document
    // This is crucial for Puppeteer to render it correctly with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposta</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
          <style>
              /* Include critical CSS here for Puppeteer */
              body {
                  font-family: 'Inter', sans-serif;
                  background-color: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              .proposal-document {
                  margin: auto;
                  width: 210mm; /* A4 width */
                  min-height: 297mm; /* A4 height */
                  box-sizing: border-box;
              }
              .pdf-block {
                  page-break-inside: avoid !important;
              }
              .pdf-page-break-before {
                  page-break-before: always !important;
              }
          </style>
      </head>
      <body>
          ${htmlString}
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('==================== PDF Generation Error ====================');
    console.error(error);
    console.error('==============================================================');
    return new NextResponse(JSON.stringify({ error: 'Failed to generate PDF', details: error.message }), { status: 500 });
  }
}
