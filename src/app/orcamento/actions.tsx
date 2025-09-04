
"use server";

import {
  suggestRefinedPanelConfig,
  type SuggestRefinedPanelConfigInput,
} from "@/ai/flows/suggest-refined-panel-config";
import {
  calculateSolar,
} from "@/ai/flows/calculate-solar";
import { revalidatePath } from "next/cache";
import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import React from 'react';

export async function getRefinedSuggestions(
  input: SuggestRefinedPanelConfigInput
) {
  try {
    const suggestion = await suggestRefinedPanelConfig(input);
    revalidatePath("/orcamento");
    return { success: true, data: suggestion };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return { success: false, error: "Falha ao obter sugestão da IA." };
  }
}

export async function getCalculation(input: SolarCalculationInput) {
  try {
    const result = await calculateSolar(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Calculation failed:", error);
    const errorMessage =
      error.cause?.message || "Falha ao calcular. Verifique os dados.";
    return { success: false, error: errorMessage };
  }
}


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
                    body { font-family: "PT Sans", sans-serif; }
                    .pdf-section { page-break-inside: avoid !important; }
                    .pdf-page-break-before { page-break-before: always !important; }
                     /* You might need to add more specific styles from your app's CSS here if they don't render correctly */
                </style>
            </head>
            <body>
                <div id="proposal-content-wrapper">${proposalHtml}</div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Add fonts from Google Fonts
        await page.addStyleTag({url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap'});
        // Wait for fonts to load
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
