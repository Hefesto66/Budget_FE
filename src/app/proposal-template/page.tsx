
"use client";

import { useEffect, useState } from 'react';
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

export default function ProposalTemplatePage() {
  const [data, setData] = useState<ReceivedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const rid = search.get("requestId");
      if (rid) setRequestId(rid);
    } catch (err) {
      console.warn("Could not parse requestId from URL", err);
    }

    function onMessage(e: MessageEvent) {
      try {
        if (e.origin !== origin) {
            console.warn(`Message from different origin ignored: ${e.origin}`);
            return;
        }

        const msg = e.data;
        if (!msg || typeof msg !== "object") return;

        if (msg.type === "PROPOSAL_DATA") {
          const currentUrlRequestId = new URLSearchParams(window.location.search).get("requestId");
          if (currentUrlRequestId && msg.requestId && msg.requestId !== currentUrlRequestId) {
            console.warn("Message requestId mismatch", msg.requestId, currentUrlRequestId);
            return;
          }
          
          setData(msg.payload);

          try {
            window.opener?.postMessage(
              { type: "PROPOSAL_ACK", requestId: msg.requestId },
              e.origin
            );
          } catch (err) {
            console.warn("Failed to post ACK to opener", err);
          }
        }
      } catch (err: any) {
        console.error("onMessage error", err);
        setError(err.message || 'Erro ao processar dados recebidos.');
      }
    }

    window.addEventListener("message", onMessage);

    const timeout = setTimeout(() => {
        if (!data) {
            setError("Tempo esgotado. Não foi possível carregar os dados da proposta. Por favor, feche esta janela e tente novamente.");
            try {
                 window.opener?.postMessage({ type: "PROPOSAL_ERROR", requestId, error: 'Timeout' }, origin);
            } catch(e) {}
        }
    }, 10000); // 10 second timeout

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
    };
  }, [origin]); // Removed requestId from deps to avoid re-running listener

  useEffect(() => {
    if (!data) return;

    const t = setTimeout(() => {
      try {
        window.print();
        window.opener?.postMessage({ type: "PRINT_STARTED", requestId }, origin);
      } catch (err: any) {
        console.error("window.print error", err);
        setError(`Erro ao iniciar a impressão: ${err.message}`);
        try {
          window.opener?.postMessage({ type: "PROPOSAL_ERROR", requestId, error: String(err) }, origin);
        } catch (e) {}
      }
    }, 100);

    return () => clearTimeout(t);
  }, [data, requestId, origin]);

  if (error) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Alert variant="destructive" className="max-w-lg">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erro ao Preparar a Proposta</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!data) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4 text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h1 className="text-xl font-semibold text-foreground">A aguardar dados da proposta...</h1>
            <p className="text-muted-foreground max-w-md">Se esta mensagem persistir, verifique se a janela principal ainda está aberta e se os pop-ups estão permitidos.</p>
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
