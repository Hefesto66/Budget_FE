// src/app/proposal-template/ProposalTemplateClient.tsx
"use client";
import React, { useEffect, useState } from "react";
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from "lucide-react";

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

export default function ProposalTemplateClient() {
  const [data, setData] = useState<ReceivedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Verificar se o script inline já capturou os dados.
    const preloadedData = (window as any).__PROPOSAL_DATA__;
    if (preloadedData) {
      console.log("[Client] Dados encontrados imediatamente via window.__PROPOSAL_DATA__", preloadedData);
      setData(preloadedData.payload);
      // A confirmação (ACK) já deve ter sido enviada pelo script inline, mas podemos limpá-la para evitar reprocessamento.
      delete (window as any).__PROPOSAL_DATA__; 
      return; // Sair para evitar adicionar outro listener.
    }

    // 2. Fallback: Adicionar um listener do React para mensagens que cheguem mais tarde.
    const handleMessage = (e: MessageEvent) => {
      // Validação de segurança: apenas aceitar mensagens da mesma origem.
      if (e.origin !== window.location.origin) {
        console.warn(`[Client] Mensagem ignorada de origem diferente: ${e.origin}`);
        return;
      }

      const msg = e.data;
      if (msg && msg.type === "PROPOSAL_DATA") {
        console.log("[Client] Dados recebidos via listener do React", msg);
        setData(msg.payload);
        
        // Enviar confirmação (ACK) para a janela que a abriu.
        try {
          e.source?.postMessage({ type: "PROPOSAL_ACK", requestId: msg.requestId }, e.origin);
        } catch (err) {
          console.warn("[Client] Falha ao enviar ACK para a janela que a abriu.", err);
        }
      }
    };
    
    window.addEventListener("message", handleMessage);

    // 3. Temporizador de segurança para evitar que a página fique em branco indefinidamente.
    const timeout = setTimeout(() => {
        if (!data && !error) { // Apenas definir erro se nenhum dado tiver sido recebido.
            setError("Tempo esgotado. Não foi possível carregar os dados da proposta. Por favor, feche esta janela e tente novamente.");
        }
    }, 10000); // Timeout de 10 segundos.

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
    };
  }, [data, error]); // Depender de `data` e `error` para evitar re-execução desnecessária.

  // 4. Efeito para acionar a impressão assim que os dados estiverem disponíveis.
  useEffect(() => {
    if (!data) return;

    // Aguardar um pequeno instante para garantir que o componente foi renderizado com os novos dados.
    const t = setTimeout(() => {
      try {
        window.print();
      } catch (err: any) {
        console.error("[Client] Erro ao chamar window.print():", err);
        setError(`Erro ao iniciar a impressão: ${err.message}`);
      }
    }, 100); // 100ms é geralmente suficiente.

    return () => clearTimeout(t);
  }, [data]);

  if (error) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Alert variant="destructive" className="max-w-lg">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erro ao Preparar a Proposta</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!data) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4 text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h1 className="text-xl font-semibold text-foreground">A aguardar dados da proposta...</h1>
            <p className="text-muted-foreground max-w-md">Se esta mensagem persistir, verifique se a janela principal ainda está aberta.</p>
        </div>
    );
  }

  return (
    <ProposalDocument
      {...data}
      proposalDate={new Date(data.proposalDate)}
      proposalValidity={new Date(data.proposalValidity)}
    />
  );
}
