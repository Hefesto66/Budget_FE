
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function PrintPageContent() {
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const encodedData = searchParams.get("data");

    if (encodedData) {
      try {
        // 1. Decode the Base64 string.
        const jsonString = atob(encodedData);
        // 2. Parse the JSON string back into an object.
        const data = JSON.parse(jsonString);
        setPrintData(data);
      } catch (err) {
        console.error("Failed to parse print data from URL", err);
        setError("Os dados no URL estão corrompidos ou são inválidos.");
      } finally {
        setIsLoading(false);
      }
    } else {
        setError("Dados da proposta não encontrados no URL.");
        setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (printData && !isLoading && !error) {
      // Give the browser a moment to render the content before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [printData, isLoading, error]);

  if (isLoading) {
    return (
        <div className="p-8">
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-40 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (error || !printData) {
    return <div className="p-8 font-sans text-center">{error || "Dados da proposta não encontrados. Por favor, gere o orçamento novamente."}</div>;
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


export default function PrintProposalPage() {
    return (
        <Suspense fallback={<div className="p-8">Carregando...</div>}>
            <PrintPageContent />
        </Suspense>
    )
}

    