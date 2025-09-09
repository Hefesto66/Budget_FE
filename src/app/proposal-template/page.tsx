
"use client";

import { useEffect, useState } from 'react';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';
import { Loader2 } from 'lucide-react';

interface ProposalData {
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

// This is a special page that is not meant to be navigated to directly by the user.
// It acts as a client-side renderer for the print dialog.
export default function ProposalTemplatePage() {
  const [data, setData] = useState<ProposalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This logic now runs only on the client, after hydration
    try {
      const storedData = sessionStorage.getItem('proposalDataForPrint');
      if (storedData) {
        const parsedData: ProposalData = JSON.parse(storedData);
        setData(parsedData);
        // Clean up immediately after reading
        sessionStorage.removeItem('proposalDataForPrint');
        
        // Trigger print dialog after a short delay to allow the page to render with the new data
        setTimeout(() => {
          window.print();
        }, 500);

      } else {
        setError("Não foi possível carregar os dados da proposta. Por favor, feche esta janela e tente novamente.");
      }
    } catch (err) {
      console.error("Failed to parse or load proposal data", err);
      setError("Ocorreu um erro ao processar os dados da proposta. Verifique a consola para mais detalhes.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount, on the client-side.

  if (error) {
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px' }}>
            <h1 style={{ color: '#D9534F' }}>Erro ao Preparar a Proposta</h1>
            <p>{error}</p>
        </div>
    );
  }

  if (!data) {
    // This is the initial state rendered on both server and client, ensuring no hydration mismatch.
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="h-8 w-8 animate-spin" />
            <h1>A preparar a sua proposta para impressão...</h1>
            <p>A caixa de diálogo de impressão deverá aparecer em breve.</p>
        </div>
    );
  }

  // Once data is loaded on the client, this part will be rendered.
  return (
    <ProposalDocument
      {...data}
      // Convert ISO strings back to Date objects for the component
      proposalDate={new Date(data.proposalDate)}
      proposalValidity={new Date(data.proposalValidity)}
    />
  );
}
