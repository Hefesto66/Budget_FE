
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

export default function PrintProposalPage() {
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const dataString = localStorage.getItem("proposalPrintData");
      if (dataString) {
        const data = JSON.parse(dataString);
        setPrintData(data);
        // Optional: remove the data from localStorage after reading it
        // localStorage.removeItem("proposalPrintData");
      }
    } catch (error) {
      console.error("Failed to load print data from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (printData && !isLoading) {
      // Give the browser a moment to render the content before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [printData, isLoading]);

  if (isLoading) {
    return (
        <div className="p-8">
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-40 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!printData) {
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
