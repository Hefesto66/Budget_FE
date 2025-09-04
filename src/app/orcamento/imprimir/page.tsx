
"use client";

import { useEffect, useState } from "react";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { Skeleton } from "@/components/ui/skeleton";

interface PrintData {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; 
  proposalValidity: string;
}

// The Broadcast Channel name must be consistent between emitter and listener.
const CHANNEL_NAME = "proposal_data_channel";

export default function PrintProposalPage() {
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This component acts as the "listener" for the broadcast.
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // Set up the message handler.
    channel.onmessage = (event) => {
      if (event.data) {
        setPrintData(event.data);
        setIsLoading(false);
        setError(null);
      } else {
        setError("Recebidos dados inválidos da página principal.");
        setIsLoading(false);
      }
      // Once the message is received and processed, we can close the channel.
      channel.close();
    };
    
    // Set a timeout to prevent waiting indefinitely.
    const timeoutId = setTimeout(() => {
        if (isLoading) {
            setError("Não foi possível receber os dados da proposta. Por favor, tente gerar o PDF novamente.");
            setIsLoading(false);
            channel.close();
        }
    }, 10000); // 10-second timeout

    // Cleanup function to close the channel when the component unmounts.
    return () => {
      clearTimeout(timeoutId);
      channel.close();
    };
  }, [isLoading]); // Rerun effect if isLoading changes, though it primarily runs once.

  useEffect(() => {
    // This effect triggers the print dialog once the data is ready.
    if (printData && !isLoading && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure content is fully rendered.
      return () => clearTimeout(timer);
    }
  }, [printData, isLoading, error]);

  if (isLoading || error) {
     return (
        <div className="p-8 font-sans text-center">
            {error ? (
                <div className="text-red-600">
                    <h2 className="text-xl font-bold">Erro</h2>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="animate-pulse">
                    <h2 className="text-xl font-bold">Aguardando dados...</h2>
                    <p>A preparar a pré-visualização do seu documento.</p>
                </div>
            )}
        </div>
    );
  }

  if (!printData) {
    // This case should ideally not be reached if timeout works correctly.
    return <div className="p-8 font-sans text-center">Dados da proposta não encontrados. Por favor, gere o orçamento novamente.</div>;
  }

  return (
    <div className="bg-white">
      <ProposalDocument
        results={printData.results}
        formData={printData.formData}
        companyData={printData.companyData}
        clientData={printData.clientData}
        customization={printData.customization}
        proposalId={printData.proposalId}
        proposalDate={new Date(printData.proposalDate)}
        proposalValidity={new Date(printData.proposalValidity)}
      />
    </div>
  );
}
