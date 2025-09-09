import { NextRequest, NextResponse } from 'next/server';
import ReactDOMServer from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, CustomizationSettings, Quote } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';

// This is a placeholder for where you might have default settings
const defaultCustomization: CustomizationSettings = {
  colors: {
    primary: "#10B981",
    textOnPrimary: "#FFFFFF",
  },
  content: {
    showInvestmentTable: true,
    showFinancialSummary: true,
    showSystemPerformance: true,
    showTerms: true,
    showGenerationChart: false,
    showSavingsChart: true,
    showEnvironmentalImpact: false,
    showEquipmentDetails: false,
    showTimeline: false,
  },
};

// POST function to handle PDF generation requests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Destructure all required data from the request body
    const {
      results,
      formData,
      companyData,
      clientData,
      customization = defaultCustomization, // Use default if not provided
      proposalId,
      proposalDate,
      proposalValidity
    } = body as {
      results: SolarCalculationResult;
      formData: SolarCalculationInput;
      companyData: CompanyFormData;
      clientData: ClientFormData;
      customization: CustomizationSettings;
      proposalId: string;
      proposalDate: string; // Dates will come as ISO strings
      proposalValidity: string;
    };

    // Basic validation to ensure essential data is present
    if (!results || !formData || !companyData || !proposalId) {
      return new NextResponse(JSON.stringify({ error: 'Dados insuficientes para gerar a proposta.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // RENDERIZAÇÃO SEGURA DO DOCUMENTO
    // A sintaxe JSX foi corrigida para usar auto-fechamento (/>)
    const htmlString = ReactDOMServer.renderToString(
      <ProposalDocument
        results={results}
        formData={formData}
        companyData={companyData}
        clientData={clientData}
        customization={customization}
        proposalId={proposalId}
        proposalDate={new Date(proposalDate)}
        proposalValidity={new Date(proposalValidity)}
      />
    );


    // This API route has been deprecated in favor of a client-side rendering approach.
    // The client-side implementation will handle creating the PDF.
    // This response is simplified and kept for reference, but the primary logic
    // is now in `src/components/wizard/Step2Results.tsx`
    return new NextResponse(JSON.stringify({
      message: "API DEPRECATED: PDF generation is now handled client-side.",
      htmlContent: htmlString, // Still return content for potential debugging
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error("===== PDF GENERATION ERROR (API) =====");
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Falha ao gerar o HTML no servidor.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
