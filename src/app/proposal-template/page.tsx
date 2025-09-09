
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
      // Security: only accept messages from same origin
      if (e.origin !== origin) {
        console.warn(`[ProposalTemplate] Ignored message from different origin: ${e.origin}`);
        return;
      }

      const msg = e.data;
      if (!msg || typeof msg !== "object" || !msg.type) {
        return;
      }

      if (msg.type === "PROPOSAL_DATA") {
        const currentUrlRequestId = new URLSearchParams(window.location.search).get("requestId");

        // Security: if a request ID is present in URL, it MUST match the message
        if (currentUrlRequestId && msg.requestId && msg.requestId !== currentUrlRequestId) {
          console.warn(`[ProposalTemplate] Message requestId mismatch. Expected ${currentUrlRequestId}, got ${msg.requestId}. Ignoring.`);
          return;
        }

        console.log(`[ProposalTemplate] Received PROPOSAL_DATA for requestId: ${msg.requestId}`);
        setData(msg.payload);

        // Send ACK back to opener to confirm receipt
        try {
          window.opener?.postMessage(
            { type: "PROPOSAL_ACK", requestId: msg.requestId },
            e.origin
          );
        } catch (err) {
          console.warn("[ProposalTemplate] Failed to post ACK to opener window.", err);
        }
      }
    }

    window.addEventListener("message", onMessage);

    const timeout = setTimeout(() => {
        if (!data && !error) { // only set error if no data has been received yet
            setError("Tempo esgotado. Não foi possível carregar os dados da proposta. Por favor, feche esta janela e tente novamente.");
            try {
                 window.opener?.postMessage({ type: "PROPOSAL_ERROR", requestId, error: 'Timeout waiting for data.' }, origin);
            } catch(e) {
                // Opener might be closed, ignore
            }
        }
    }, 10000); // 10 second timeout

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
    };
  }, [origin, data, error, requestId]); // Re-run if requestId is parsed from URL

  useEffect(() => {
    if (!data) return;

    // Wait for a short moment to ensure the component has rendered with the new data
    const t = setTimeout(() => {
      try {
        window.print();
        window.opener?.postMessage({ type: "PRINT_STARTED", requestId }, origin);
      } catch (err: any) {
        console.error("[ProposalTemplate] window.print() error:", err);
        setError(`Erro ao iniciar a impressão: ${err.message}`);
        try {
          window.opener?.postMessage({ type: "PROPOSAL_ERROR", requestId, error: String(err) }, origin);
        } catch (e) {
             // Opener might be closed, ignore
        }
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
