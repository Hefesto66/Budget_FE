
"use client";

import { useEffect, useState, Suspense } from "react";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import type { Quote, ClientFormData, CustomizationSettings } from "@/types";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { Loader2 } from "lucide-react";
import "./imprimir.css";

const PROPOSAL_DATA_SESSION_KEY = "printableProposalData";

interface PrintableData {
    quote: Quote;
    client: ClientFormData;
    company: CompanyFormData;
    customization: CustomizationSettings;
}

function PrintContent() {
    const [data, setData] = useState<PrintableData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const dataString = sessionStorage.getItem(PROPOSAL_DATA_SESSION_KEY);
            if (!dataString) {
                setError("Dados da proposta não encontrados na sessão. Por favor, tente gerar novamente.");
                return;
            }
            const parsedData = JSON.parse(dataString);
            setData(parsedData);
            // Clean up session storage after reading the data
            sessionStorage.removeItem(PROPOSAL_DATA_SESSION_KEY);
        } catch (err) {
            console.error("Failed to parse proposal data from session storage", err);
            setError("Falha ao processar os dados da proposta. Os dados podem estar corrompidos.");
        }
    }, []);

    useEffect(() => {
        if (data) {
            // Give the browser a moment to render everything before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [data]);

    if (error) {
        return <div className="print-error-container">{error}</div>;
    }

    if (!data) {
        return (
            <div className="print-loading-container">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>A carregar dados da proposta...</p>
            </div>
        );
    }

    const { quote, client, company, customization } = data;
    
    return (
        <ProposalDocument
            results={quote.results}
            formData={quote.formData}
            billOfMaterials={quote.billOfMaterials}
            companyData={company}
            clientData={client}
            customization={customization}
            proposalId={quote.id}
            proposalDate={new Date(quote.createdAt)}
            proposalValidity={new Date(new Date(quote.createdAt).setDate(new Date(quote.createdAt).getDate() + 20))}
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

    