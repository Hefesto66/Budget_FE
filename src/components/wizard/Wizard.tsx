
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Step1DataInput } from "./Step1DataInput";
import { Step2Results } from "./Step2Results";
import { StepIndicator } from "./StepIndicator";
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { ClientRegistrationDialog } from "./ClientRegistrationDialog";

const steps = [
  { id: "01", name: "Dados de Consumo" },
  { id: "02", name: "Resultados e Configuração" },
];

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(true);


  const methods = useForm<z.infer<typeof solarCalculationSchema>>({
    resolver: zodResolver(solarCalculationSchema),
    defaultValues: {
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
    },
  });

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
        // Handle optional empty string from form input
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
    setCurrentStep(0);
    setResults(null);
    setIsClientDialogOpen(true);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <ClientRegistrationDialog
        isOpen={isClientDialogOpen}
        onSave={handleClientDataSave}
        onSkip={handleSkipClient}
      />
      {!isClientDialogOpen && (
        <>
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
                      onBack={goBack}
                      formData={methods.getValues()}
                      clientData={clientData}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </FormProvider>
        </>
      )}
    </div>
  );
}
