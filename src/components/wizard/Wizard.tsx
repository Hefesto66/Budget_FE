
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import type { z } from "zod";
import { Step1DataInput } from "./Step1DataInput";
import { Step2Results } from "./Step2Results";
import { StepIndicator } from "./StepIndicator";
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, Quote } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { ClientRegistrationDialog } from "./ClientRegistrationDialog";
import { Button } from "../ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId } from "@/lib/storage";

const steps = [
  { id: "01", name: "Dados de Consumo" },
  { id: "02", name: "Resultados e Configuração" },
];

const defaultValues: SolarCalculationInput = {
    consumo_mensal_kwh: 500,
    valor_medio_fatura_reais: 450,
    adicional_bandeira_reais_kwh: 0,
    cip_iluminacao_publica_reais: 25,
    concessionaria: "Equatorial GO",
    rede_fases: "mono",
    irradiacao_psh_kwh_m2_dia: 5.7,
    // Módulos
    fabricante_modulo: "TongWei Bifacial",
    potencia_modulo_wp: 550,
    preco_modulo_reais: 750,
    garantia_defeito_modulo_anos: 12,
    garantia_geracao_modulo_anos: 30,
    // Inversor
    modelo_inversor: "Inversor Central - SIW300H (Híbrido)",
    fabricante_inversor: "WEG",
    potencia_inversor_kw: 5,
    tensao_inversor_v: 220,
    quantidade_inversores: 1,
    garantia_inversor_anos: 7,
    eficiencia_inversor_percent: 97,
    custo_inversor_reais: 4000,
    // Custos e Perdas
    fator_perdas_percent: 20,
    custo_fixo_instalacao_reais: 2500,
    custo_om_anual_reais: 150,
    meta_compensacao_percent: 100,
    quantidade_modulos: 7,
}

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false); 
  const [isReady, setIsReady] = useState(false);
  const [proposalId, setProposalId] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const quoteId = searchParams.get('quoteId');
  
  const methods = useForm<z.infer<typeof solarCalculationSchema>>({
    resolver: zodResolver(solarCalculationSchema),
    defaultValues
  });
  
  useEffect(() => {
    const initialize = async () => {
      let initialData = { ...defaultValues };

      if (quoteId) {
        setProposalId(quoteId);
        const existingQuote = getQuoteById(quoteId);
        if (existingQuote) {
          initialData = existingQuote.formData;
          const calcResult = await getCalculation(initialData);
          if (calcResult.success) {
            setResults(calcResult.data);
            setCurrentStep(1);
          }
        }
      }
      methods.reset(initialData);
      
      if (!leadId && !quoteId) {
        setIsClientDialogOpen(true);
      }
      
      setIsReady(true);
    };

    initialize();
  }, [leadId, quoteId, methods, router]);

  const handleClientDataSave = (data: ClientFormData) => {
    setClientData(data);
    setIsClientDialogOpen(false);
  };
  
  const handleSkipClient = () => {
    setClientData(null);
    setIsClientDialogOpen(false);
  }

  const processForm = async (data: SolarCalculationInput) => {
    setIsLoading(true);

    const parsedData = solarCalculationSchema.safeParse({
        ...data,
        consumo_mensal_kwh: Number(data.consumo_mensal_kwh),
        valor_medio_fatura_reais: Number(data.valor_medio_fatura_reais),
        cip_iluminacao_publica_reais: Number(data.cip_iluminacao_publica_reais),
        irradiacao_psh_kwh_m2_dia: Number(data.irradiacao_psh_kwh_m2_dia),
        potencia_modulo_wp: Number(data.potencia_modulo_wp),
        preco_modulo_reais: Number(data.preco_modulo_reais),
        eficiencia_inversor_percent: Number(data.eficiencia_inversor_percent),
        custo_inversor_reais: Number(data.custo_inversor_reais),
        fator_perdas_percent: Number(data.fator_perdas_percent),
        custo_fixo_instalacao_reais: Number(data.custo_fixo_instalacao_reais),
        custo_om_anual_reais: Number(data.custo_om_anual_reais),
        adicional_bandeira_reais_kwh: Number(data.adicional_bandeira_reais_kwh),
        quantidade_modulos: data.quantidade_modulos ? Number(data.quantidade_modulos) : undefined,
    });

    if (!parsedData.success) {
        const firstError = Object.values(parsedData.error.flatten().fieldErrors)[0]?.[0];
        toast({
            title: "Erro de Validação",
            description: firstError || "Por favor, verifique os campos do formulário.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    const result = await getCalculation(parsedData.data);
    setIsLoading(false);

    if (result.success && result.data) {
      setResults(result.data);
      // Generate the ID here for a new proposal, or keep the existing one.
      setProposalId(quoteId || generateNewQuoteId());
      setCurrentStep(1);
    } else {
      toast({
        title: "Erro no Cálculo",
        description: result.error,
        variant: "destructive",
      });
    }
  };
  
  const goBack = () => {
    // If we are in a lead context, just go back to the lead page.
    if(leadId) {
      router.push(`/crm/${leadId}`);
      return;
    }
    // Otherwise, restart the wizard.
    setCurrentStep(0);
    setResults(null);
    setProposalId("");
    methods.reset(defaultValues);
    if (!leadId) { 
        setIsClientDialogOpen(true);
    }
  }
  
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleRecalculate = (newResults: SolarCalculationResult) => {
    setResults(newResults);
  }

  const handleSaveQuote = () => {
    if (!leadId || !results || !proposalId) {
        toast({ title: "Erro", description: "Contexto do lead, resultados do cálculo ou ID da proposta não encontrados.", variant: "destructive" });
        return;
    }

    const formData = methods.getValues();
    
    const quoteToSave: Quote = {
        id: proposalId,
        leadId: leadId,
        // If editing, keep the original creation date. Otherwise, set a new one.
        createdAt: quoteId ? getQuoteById(quoteId)!.createdAt : new Date().toISOString(), 
        formData: formData,
        results: results,
    };

    saveQuote(quoteToSave);

    toast({
      title: quoteId ? "Cotação Atualizada!" : "Cotação Salva!",
      description: "A cotação foi salva com sucesso.",
    });
    
    router.push(`/crm/${leadId}`);
  };

  const handleGoBackToLead = () => {
     if (leadId) {
      router.push(`/crm/${leadId}`);
    }
  }

  if (!isReady) {
    return <div className="flex items-center justify-center h-64">Carregando Orçamento...</div>; // Or a skeleton loader
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <ClientRegistrationDialog
        isOpen={isClientDialogOpen}
        onSave={handleClientDataSave}
        onSkip={handleSkipClient}
      />
      
      <div className={isClientDialogOpen ? 'blur-sm' : ''}>
          {leadId && (
            <div className="mb-8 flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-foreground">
                    Cotação para o Lead: <span className="text-primary font-bold">{getLeadById(leadId)?.title}</span>
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGoBackToLead}>
                        <ArrowLeft /> Voltar para o Lead
                    </Button>
                     <Button onClick={() => results && document.getElementById('save-quote-button')?.click()} disabled={!results}>
                        <Save /> {quoteId ? "Atualizar Cotação" : "Salvar Cotação"}
                    </Button>
                </div>
            </div>
          )}
          <StepIndicator currentStep={currentStep} steps={steps} />
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(processForm)} className="mt-12">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Step1DataInput isLoading={isLoading} />
                  </motion.div>
                )}
                {currentStep === 1 && results && (
                   <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Step2Results 
                      results={results}
                      proposalId={proposalId}
                      onBack={goBack}
                      onRecalculate={handleRecalculate}
                      onSave={handleSaveQuote}
                      onGoToDataInput={() => goToStep(0)}
                      isEditing={!!quoteId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </FormProvider>
      </div>
    </div>
  );
}

    