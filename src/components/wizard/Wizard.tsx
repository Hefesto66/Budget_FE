"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Step1DataInput } from "./Step1DataInput";
import { Step2Results } from "./Step2Results";
import { StepIndicator } from "./StepIndicator";
import type { SolarCalculationResult, SolarCalculationInput } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/ai/flows/calculate-solar";

const steps = [
  { id: "01", name: "Dados de Consumo" },
  { id: "02", name: "Resultados e Configuração" },
];

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const methods = useForm<z.infer<typeof solarCalculationSchema>>({
    resolver: zodResolver(solarCalculationSchema),
    defaultValues: {
      concessionaria: "Equatorial GO",
      classe: "residencial",
      rede_fases: "mono",
      bandeira_tarifaria: "verde",
      cip_iluminacao_publica_reais: 25,
      consumo_mensal_kwh: 500,
      meta_compensacao_percent: 100,
      cidade: "Goiânia",
      uf: "GO",
      // irradiacao_psh_kwh_m2_dia will be fetched or defaulted in the backend
      potencia_modulo_wp: 550,
      // All other fields will use defaults defined in the schema on the backend
    },
  });

  const processForm = async (data: SolarCalculationInput) => {
    setIsLoading(true);
    // Ensure numeric values are correctly formatted
    const parsedData = {
        ...data,
        consumo_mensal_kwh: Number(data.consumo_mensal_kwh),
        cip_iluminacao_publica_reais: Number(data.cip_iluminacao_publica_reais),
        potencia_modulo_wp: Number(data.potencia_modulo_wp),
    };
    
    const result = await getCalculation(parsedData);
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
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </FormProvider>
    </div>
  );
}
