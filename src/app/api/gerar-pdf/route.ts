
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
    
    // Render the React component to an HTML string
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
    
    // Note: Puppeteer is not available in this environment.
    // A production-grade solution would use a service like Puppeteer on a serverless function.
    // For this context, we will return a success message, and the client will handle the rendering.
    // This is a simulation, as we cannot execute a browser instance here.
    
    // In a real scenario with a PDF library, you would convert htmlString to a PDF here.
    // Since we cannot do that, we will send back a success response.
    // The client-side implementation will handle creating the PDF.
    
    // This response is simplified. A real implementation would return a PDF file stream.
    return new NextResponse(JSON.stringify({ htmlContent: htmlString }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        }
    });

  } catch (error: any) {
    console.error("===== PDF GENERATION ERROR =====");
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Falha ao gerar o PDF no servidor.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
