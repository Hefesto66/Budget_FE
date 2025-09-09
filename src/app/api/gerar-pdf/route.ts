import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';

interface ProposalRequestData {
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

// Helper function to render component and generate HTML
const createHtmlString = (props: ProposalRequestData): string => {
    const proposalComponent = React.createElement(ProposalDocument, {
        ...props,
        // Convert ISO strings back to Date objects for the component
        proposalDate: new Date(props.proposalDate),
        proposalValidity: new Date(props.proposalValidity),
    });

    const reactHtml = ReactDOMServer.renderToString(proposalComponent);

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Proposta ${props.proposalId}</title>
           <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              background-color: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .proposal-document { 
              margin: auto; 
              width: 210mm; 
              min-height: 297mm; 
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
          ${reactHtml}
      </body>
      </html>
    `;
};


export async function POST(req: NextRequest) {
  try {
    const props: ProposalRequestData = await req.json();

    const html = createHtmlString(props);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="proposta-${props.proposalId}.pdf"`,
        },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse(
        JSON.stringify({ error: 'Failed to generate PDF.', details: error.message }),
        { status: 500 }
    );
  }
}
