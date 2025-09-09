
"use client";

import { useEffect, useState } from 'react';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';
import { Loader2 } from 'lucide-react';

interface ReceivedData {
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

export default function ProposalTemplatePage() {
  const [data, setData] = useState<ReceivedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Basic security check: ensure the message is from our app and has the expected structure.
      if (event.data && event.data.type === 'PROPOSAL_DATA') {
        const receivedData: ReceivedData = event.data.payload;
        setData(receivedData);

        // Tell the parent window we've received the data and are ready to print.
        if (window.opener) {
            window.opener.postMessage('data-received-and-ready', '*');
        }
        
        // Trigger print after a short delay to ensure the DOM is fully updated with the new data.
        setTimeout(() => {
          window.print();
        }, 500);
      }
    };

    window.addEventListener('message', handleMessage);

    // Set a timeout to show an error if data isn't received within a reasonable time.
    const timeoutId = setTimeout(() => {
      if (!data) {
        setError("Não foi possível carregar os dados da proposta. A comunicação com a janela principal falhou. Por favor, feche esta janela e tente novamente.");
      }
    }, 5000); // 5 seconds timeout

    // Cleanup function to remove the listener and timeout when the component unmounts.
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [data]); // Depend on `data` to clear the timeout once data is received.

  if (error) {
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px' }}>
            <h1 style={{ color: '#D9534F' }}>Erro ao Preparar a Proposta</h1>
            <p>{error}</p>
        </div>
    );
  }

  if (!data) {
    // Initial loading state, which is identical on server and client to avoid hydration errors.
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="h-8 w-8 animate-spin" />
            <h1>A aguardar dados da proposta...</h1>
            <p>Se esta mensagem persistir, feche esta janela e tente gerar a proposta novamente.</p>
        </div>
    );
  }

  // Once data is received, render the actual proposal document.
  return (
    <ProposalDocument
      {...data}
      // Convert ISO string dates back to Date objects for the document component
      proposalDate={new Date(data.proposalDate)}
      proposalValidity={new Date(data.proposalValidity)}
    />
  );
}
