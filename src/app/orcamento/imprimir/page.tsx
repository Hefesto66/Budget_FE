
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import LZString from 'lz-string';

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
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const compressedData = searchParams.get("data");

    if (!compressedData) {
      setError("Nenhum dado da proposta foi encontrado no URL. Por favor, tente gerar o PDF novamente.");
      return;
    }

    try {
      const jsonString = LZString.decompressFromEncodedURIComponent(compressedData);
      if (!jsonString) {
          throw new Error("Falha ao descomprimir os dados. A string de dados pode estar corrompida.");
      }
      const data = JSON.parse(jsonString);
      setPrintData(data);
    } catch (e) {
      console.error("Failed to parse or decompress proposal data:", e);
      setError("Falha ao processar os dados da proposta. Eles podem estar mal formatados ou corrompidos.");
    }
  }, [searchParams]);

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
        <h2 className="text-xl font-bold">A processar os dados...</h2>
        <p>A preparar a pré-visualização do seu documento.</p>
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
        proposalValidity={new Date(printData.proposalValidity)}
      />
    </div>
  );
}


export default function PrintProposalPage() {
    return (
        <Suspense fallback={<div className="p-8 font-sans text-center">A carregar...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
