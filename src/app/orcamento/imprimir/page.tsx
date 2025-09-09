
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import type { Quote, ClientFormData, CustomizationSettings } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { Loader2 } from "lucide-react";
import "./imprimir.css";

// Helper function to decompress the data
const decompressData = (compressedData: string): any | null => {
  try {
    const jsonString = Buffer.from(compressedData, "base64").toString("utf-8");
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to decompress or parse data:", error);
    return null;
  }
};

function PrintContent() {
    const searchParams = useSearchParams();
    const [quoteData, setQuoteData] = useState<Quote | null>(null);
    const [clientData, setClientData] = useState<ClientFormData | null>(null);
    const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
    const [customization, setCustomization] = useState<CustomizationSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const compressedQuote = searchParams.get('quote');
        const compressedClient = searchParams.get('client');
        const compressedCompany = searchParams.get('company');
        const compressedCustomization = searchParams.get('customization');

        if (!compressedQuote || !compressedClient || !compressedCompany || !compressedCustomization) {
            setError("Dados insuficientes para gerar a proposta. Por favor, tente novamente.");
            return;
        }

        const quote = decompressData(compressedQuote);
        const client = decompressData(compressedClient);
        const company = decompressData(compressedCompany);
        const customizationData = decompressData(compressedCustomization);

        if (!quote || !client || !company || !customizationData) {
            setError("Falha ao processar os dados da proposta. Os dados podem estar corrompidos.");
            return;
        }

        setQuoteData(quote);
        setClientData(client);
        setCompanyData(company);
        setCustomization(customizationData);

    }, [searchParams]);

    useEffect(() => {
        if (quoteData && clientData && companyData && customization) {
            // Give the browser a moment to render everything before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500); 
            return () => clearTimeout(timer);
        }
    }, [quoteData, clientData, companyData, customization]);

    if (error) {
        return <div className="print-error-container">{error}</div>;
    }

    if (!quoteData || !clientData || !companyData || !customization) {
        return (
            <div className="print-loading-container">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>A carregar dados da proposta...</p>
            </div>
        );
    }
    
    // We assume proposalId, proposalDate, and proposalValidity are part of the quote object.
    // If not, they would need to be passed separately. For this implementation, we'll use quote ID and creation date.
    return (
        <ProposalDocument
            results={quoteData.results}
            formData={quoteData.formData}
            companyData={companyData}
            clientData={clientData}
            customization={customization}
            proposalId={quoteData.id}
            proposalDate={new Date(quoteData.createdAt)}
            proposalValidity={new Date(new Date(quoteData.createdAt).setDate(new Date(quoteData.createdAt).getDate() + 20))}
        />
    );
}


export default function ImprimirPropostaPage() {
    return (
        <Suspense fallback={<div className="print-loading-container"><Loader2 className="h-8 w-8 animate-spin" />A carregar...</div>}>
            <PrintContent />
        </Suspense>
    );
}

