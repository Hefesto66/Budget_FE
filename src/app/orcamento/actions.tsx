
"use server";

import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import React from 'react';


interface PdfGenerationData {
    results: SolarCalculationResult;
    formData: SolarCalculationInput;
    companyData: CompanyFormData;
    clientData: ClientFormData | null;
    customization: CustomizationSettings;
    proposalId: string;
    proposalDate: string; // Pass dates as ISO strings
    proposalValidity: string;
}

export async function generatePdfAction(data: PdfGenerationData) {
    try {
        const proposalHtml = renderToStaticMarkup(
            <ProposalDocument
                results={data.results}
                formData={data.formData}
                companyData={data.companyData}
                clientData={data.clientData}
                customization={data.customization}
                proposalId={data.proposalId}
                proposalDate={new Date(data.proposalDate)}
                proposalValidity={new Date(data.proposalValidity)}
            />
        );

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: "PT Sans", sans-serif;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact; /* Important for colors in Chrome */
                        print-color-adjust: exact;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    .pdf-page-container {
                        width: 210mm;
                        height: 297mm;
                        padding: 1in;
                        box-sizing: border-box;
                        background-color: white;
                    }
                    .pdf-section { 
                        page-break-inside: avoid !important; 
                        margin-bottom: 32px;
                    }
                    .pdf-page-break-before { 
                        page-break-before: always !important; 
                    }
                </style>
                 <link
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div class="pdf-page-container">
                 ${proposalHtml}
                </div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Wait for fonts to be ready
        await page.evaluateHandle('document.fonts.ready');
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();

        return { success: true, data: pdfBuffer.toString('base64') };

    } catch (error) {
        console.error("Puppeteer PDF generation failed:", error);
        return { success: false, error: "Ocorreu um erro ao gerar o PDF no servidor." };
    }
}
