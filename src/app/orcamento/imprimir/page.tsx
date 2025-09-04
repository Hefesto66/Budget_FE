
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LZString from 'lz-string';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface PrintData {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; // Pass as ISO string
  proposalValidity: string; // Pass as ISO string
}

function PrintPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const compressedData = searchParams.get('data');
    if (compressedData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
        if (!decompressed) {
          throw new Error("A descompressão falhou. A string de dados pode estar malformada.");
        }
        const parsedData: PrintData = JSON.parse(decompressed);
        setData(parsedData);
      } catch (e) {
        console.error("Failed to parse print data:", e);
        setError("Não foi possível carregar os dados da proposta. O link pode estar corrompido ou os dados são inválidos.");
      }
    } else {
        setError("Dados da proposta não encontrados. Por favor, volte e tente gerar o documento novamente.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (data) {
      // Allow content to render before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure all assets are loaded
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Erro ao Carregar Proposta</h1>
            <p className="text-gray-600">{error}</p>
        </div>
    )
  }

  if (!data) {
    return (
        <div className="p-8 space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <ProposalDocument 
        {...data}
        proposalDate={new Date(data.proposalDate)} // Convert back to Date object
        proposalValidity={new Date(data.proposalValidity)} // Convert back to Date object
    />
  );
}


export default function PrintPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PrintPageContent />
        </Suspense>
    )
}
