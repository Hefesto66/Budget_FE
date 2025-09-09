import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';

// This interface must match the one in the API route
interface ProposalDocumentProps {
  results: SolarCalculationResult;
  formData: WizardFormData['calculationInput'];
  billOfMaterials: WizardFormData['billOfMaterials'];
  companyData: CompanyFormData;
  clientData: ClientFormData;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: Date;
  proposalValidity: Date;
}

// This function isolates the react-dom/server logic
export const renderProposalToHtml = (props: ProposalDocumentProps): string => {
    const proposalComponent = React.createElement(ProposalDocument, props);
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
