
"use client";

import { useEffect, useState } from 'react';
import { ProposalDocument } from '@/components/proposal/ProposalDocument';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from '@/types';
import type { CompanyFormData } from '@/app/minha-empresa/page';
import type { WizardFormData } from '@/components/wizard/Wizard';
import { Loader2 } from 'lucide-react';

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

// Esta é a página de impressão que comunica com a janela principal.
export default function ProposalTemplatePage() {
  const [data, setData] = useState<ReceivedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Avisa a janela principal que esta página está pronta para receber os dados.
    if (window.opener) {
        window.opener.postMessage('ready-for-data', '*');
    } else {
        setError("Esta página foi aberta de forma inválida. Não foi possível encontrar a janela de origem.");
    }
    
    // 2. Adiciona um "ouvinte" para esperar pelos dados.
    const handleMessage = (event: MessageEvent) => {
      // Pequena verificação de segurança para garantir que a mensagem é da nossa aplicação
      if (event.data && event.data.type === 'PROPOSAL_DATA') {
        const receivedData: ReceivedData = event.data.payload;
        setData(receivedData);
        
        // Aciona a impressão após um pequeno delay para garantir que o DOM foi atualizado com os novos dados.
        setTimeout(() => {
          window.print();
        }, 500);

      }
    };

    window.addEventListener('message', handleMessage);

    // 3. Limpa o ouvinte quando o componente for desmontado para evitar fugas de memória.
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // O array de dependências vazio [] é crucial para que isto execute apenas uma vez.

  if (error) {
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px' }}>
            <h1 style={{ color: '#D9534F' }}>Erro ao Preparar a Proposta</h1>
            <p>{error}</p>
        </div>
    );
  }

  if (!data) {
    // Estado de carregamento inicial, que é idêntico no servidor e no cliente para evitar erros de hidratação.
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="h-8 w-8 animate-spin" />
            <h1>A aguardar dados da proposta...</h1>
            <p>Se esta mensagem persistir, feche esta janela e tente gerar a proposta novamente.</p>
        </div>
    );
  }

  // Uma vez que os dados são recebidos, renderiza o documento da proposta.
  return (
    <ProposalDocument
      {...data}
      // Converte as datas em string ISO de volta para objetos Date
      proposalDate={new Date(data.proposalDate)}
      proposalValidity={new Date(data.proposalValidity)}
    />
  );
}
