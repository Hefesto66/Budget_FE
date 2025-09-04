
"use client";

import { useEffect, useState } from "react";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { Skeleton } from "@/components/ui/skeleton";

const PROPOSAL_DATA_KEY = "current_proposal_data_for_print";

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

export default function PrintProposalPage() {
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedDataString = localStorage.getItem(PROPOSAL_DATA_KEY);
      if (savedDataString) {
        const data = JSON.parse(savedDataString);
        setPrintData(data);
      } else {
        setError("Dados da proposta não encontrados. Por favor, volte e tente gerar o PDF novamente.");
      }
    } catch (e) {
      console.error("Failed to load or parse proposal data from localStorage:", e);
      setError("Falha ao processar os dados da proposta. Eles podem estar corrompidos ou mal formatados.");
    }
  }, []);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure content is fully rendered before printing.
      return () => clearTimeout(timer);
    }
  }, [printData]);

  if (error) {
    return (
      <div className="p-8 font-sans text-center text-red-600">
        <h2 className="text-xl font-bold">Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!printData) {
    return (
      <div className="p-8 font-sans text-center animate-pulse">
        <h2 className="text-xl font-bold">A preparar a pré-visualização...</h2>
        <p>A carregar os dados do seu documento.</p>
        <div className="max-w-2xl mx-auto mt-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
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
        proposalValidity={new Date(printa.proposalValidity)}
      />
    </div>
  );
}

    