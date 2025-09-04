
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import React from 'react';

// Define the expected structure of the POST request body
interface PdfRequestBody {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; // ISO string
  proposalValidity: string; // ISO string
}

export async function POST(req: NextRequest) {
  try {
    const body: PdfRequestBody = await req.json();

    // Reconstruct date objects from ISO strings
    const proposalDate = new Date(body.proposalDate);
    const proposalValidity = new Date(body.proposalValidity);

    // Use React's renderToStaticMarkup to get a static HTML string
    // This function is safe to use on the server
    const html = renderToStaticMarkup(
      React.createElement(ProposalDocument, {
        ...body,
        proposalDate,
        proposalValidity,
      })
    );
    
    // Add a basic HTML structure with necessary styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap');
            
            body, html {
              margin: 0;
              padding: 0;
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: A4;
              margin: 2cm;
            }
            
            .proposal-document {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              font-family: "PT Sans", sans-serif;
            }

            .pdf-section {
              page-break-inside: avoid !important;
              break-inside: avoid-page !important;
            }

            .pdf-page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    const browser = await puppeteer.launch({ 
      headless: true,
      // Important for running in environments like Vercel or Cloud Functions
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Set content and wait for network activity to be idle, ensuring all resources (like images) are loaded
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      }
    });

    await browser.close();

    // Return the PDF buffer with the correct headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${body.proposalId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse(
        'Falha ao gerar o PDF.', 
        { status: 500 }
    );
  }
}
