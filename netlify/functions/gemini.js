
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import ReactDOMServer from 'react-dom/server';
import React from 'react'; // Import React for JSX
import { ProposalDocument } from '../../src/components/proposal/ProposalDocument';
import { solarCalculationSchema } from '../../src/types';

// Helper function to render component and generate HTML
const createHtmlString = (props) => {
    // Re-create the component structure here, as we can't import the React component directly
    // This is a simplified version of ProposalDocument for server-side rendering in this environment.
    // NOTE: This is a major simplification. In a real-world scenario, you would share component logic.
    // For this isolated function, we will focus on getting the props and generating a basic structure.
    
    const { 
        results, 
        formData,
        billOfMaterials,
        companyData, 
        clientData, 
        customization,
        proposalId,
        proposalDate, // This will be an ISO string
        proposalValidity // This will be an ISO string
    } = props;
    
    // We need to recreate or import the ProposalDocument logic here.
    // For now, let's assume ProposalDocument can be rendered to string.
    // The key is that this function needs to be self-contained or have its dependencies managed separately.
    const proposalComponent = React.createElement(ProposalDocument, {
        results,
        formData,
        billOfMaterials,
        companyData,
        clientData,
        customization,
        proposalId,
        proposalDate: new Date(proposalDate),
        proposalValidity: new Date(proposalValidity),
    });

    const reactHtml = ReactDOMServer.renderToString(proposalComponent);

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Proposta</title>
           <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
          <style>
            body { font-family: 'Inter', sans-serif; background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .proposal-document { margin: auto; width: 210mm; min-height: 297mm; box-sizing: border-box; }
            .pdf-block { page-break-inside: avoid !important; }
            .pdf-page-break-before { page-break-before: always !important; }
          </style>
      </head>
      <body>
          ${reactHtml}
      </body>
      </html>
    `;
};


export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const props = JSON.parse(event.body);

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${props.proposalId}.pdf"`,
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF.', details: error.message }),
    };
  }
};
