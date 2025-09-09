
import { NextRequest, NextResponse } from 'next/server';
import ReactDOMServer from 'react-dom/server';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, CustomizationSettings, Quote } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';

// Esta é uma camada extra de segurança para garantir que a API não quebre se o frontend enviar dados
// incompletos.
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

// A API Route agora é um "serviço burro". Ela não calcula nada.
// Apenas recebe os dados prontos do frontend e renderiza o HTML.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Destrutura todos os dados esperados do corpo da requisição
    const {
      results,
      formData,
      companyData,
      clientData,
      customization = defaultCustomization, // Usa o padrão se não for fornecido
      proposalId,
      proposalDate,
      proposalValidity
    } = body as {
      results: SolarCalculationResult;
      formData: SolarCalculationInput;
      companyData: CompanyFormData;
      clientData: ClientFormData; // O frontend garantirá que isso nunca seja nulo
      customization: CustomizationSettings;
      proposalId: string;
      proposalDate: string; 
      proposalValidity: string;
    };

    // Validação de segurança para garantir que os dados essenciais foram recebidos
    if (!results || !formData || !companyData || !proposalId) {
      return new NextResponse(JSON.stringify({ error: 'Dados insuficientes para gerar a proposta. O frontend não enviou todas as informações.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Renderiza o componente React para uma string de HTML com os dados recebidos
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


    // O fluxo de geração de PDF real agora é tratado pelo cliente.
    // Esta API apenas fornece o HTML renderizado. A lógica de conversão para PDF
    // foi movida para o frontend para evitar o erro de build.
    return new NextResponse(JSON.stringify({
      message: "Renderização do HTML bem-sucedida.",
      htmlContent: htmlString, 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error("===== ERRO NA API DE GERAÇÃO DE HTML =====");
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Falha ao renderizar o HTML no servidor.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
