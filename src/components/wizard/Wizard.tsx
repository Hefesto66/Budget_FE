"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Step1DataInput } from "./Step1DataInput";
import { Step2Results } from "./Step2Results";
import { StepIndicator } from "./StepIndicator";
import type { FormData, CalculationResults } from "@/types";
import { calculateSystem } from "@/lib/solar-calculations";
import { PANEL_MODELS, LOCATIONS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  consumption: z.coerce.number().min(1, "O consumo deve ser maior que 0."),
  bill: z.coerce.number().min(1, "O valor da conta deve ser maior que 0."),
  location: z.string().nonempty("Por favor, selecione uma localização."),
  panelModel: z.string().nonempty("Por favor, selecione um modelo de painel."),
  panelQuantity: z.coerce.number().optional(),
});

const steps = [
  { id: "01", name: "Dados de Consumo" },
  { id: "02", name: "Resultados e Configuração" },
];

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const methods = useForm<FormData & { panelQuantity?: number }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      panelModel: PANEL_MODELS[1].value,
      location: LOCATIONS[2].value,
    },
  });

  const processForm = (data: FormData & { panelQuantity?: number }) => {
    const calculation = calculateSystem(data);
    setResults(calculation);
    methods.setValue("panelQuantity", calculation.panelQuantity);
    setCurrentStep(1);
  };
  
  const reCalculate = () => {
    const formData = methods.getValues();
    const calculation = calculateSystem(formData);
    setResults(calculation);
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
                <Step1DataInput />
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
                  onRecalculate={reCalculate}
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
