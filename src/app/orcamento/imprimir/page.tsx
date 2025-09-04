
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import lzString from 'lz-string';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationInput, SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProposalData {
  results: SolarCalculationResult;
  formData: SolarCalculationInput;
  companyData: CompanyFormData;
  clientData: ClientFormData | null;
  customization: CustomizationSettings;
  proposalId: string;
  proposalDate: string; // Dates are passed as ISO strings
  proposalValidity: string;
}

export default function PrintPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProposalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const compressedData = searchParams.get('data');
    if (compressedData) {
      try {
        const decompressed = lzString.decompressFromEncodedURIComponent(compressedData);
        if (!decompressed) {
            throw new Error("A descompressão resultou em nulo. Os dados podem estar malformados.");
        }
        const parsedData = JSON.parse(decompressed);
        
        // Re-hydrate dates from ISO strings
        parsedData.proposalDate = new Date(parsedData.proposalDate);
        parsedData.proposalValidity = new Date(parsedData.proposalValidity);
        
        setData(parsedData);
      } catch (e: any) {
        console.error("Falha ao decodificar dados da proposta:", e);
        setError(`Não foi possível carregar os dados da proposta. Eles podem estar corrompidos ou em um formato inválido. Detalhe: ${e.message}`);
      }
    } else {
        setError("Nenhum dado da proposta foi encontrado na URL. Esta página não pode ser acessada diretamente.");
    }
  }, [searchParams]);

  useEffect(() => {
    // Once data is successfully loaded, trigger the print dialog
    if (data) {
        const timeoutId = setTimeout(() => {
            window.print();
        }, 500); // Small delay to ensure content is rendered

        return () => clearTimeout(timeoutId);
    }
  }, [data]);

  if (error) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-8 text-center">
            <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-md">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h1 className="mt-4 text-2xl font-bold font-headline text-red-700">Erro ao Carregar Proposta</h1>
                <p className="mt-2 text-gray-600">{error}</p>
                <Button onClick={() => window.close()} className="mt-6">Fechar Aba</Button>
            </div>
        </div>
    );
  }

  if (!data) {
    return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h1 className="text-xl font-semibold text-foreground">A preparar a sua proposta para impressão...</h1>
                <p className="text-muted-foreground">Por favor, aguarde um momento.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white">
        <ProposalDocument
            results={data.results}
            formData={data.formData}
            companyData={data.companyData}
            clientData={data.clientData}
            customization={data.customization}
            proposalId={data.proposalId}
            proposalDate={data.proposalDate}
            proposalValidity={data.proposalValidity}
        />
    </div>
  );
}


    