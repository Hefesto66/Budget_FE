
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import type { z } from "zod";
import { Step1DataInput } from "./Step1DataInput";
import { Step2Results } from "./Step2Results";
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, Quote } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { Button } from "../ui/button";
import { ArrowLeft, Save, Sparkles, Calculator, Plus, Trash2 } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId, getClientById, addHistoryEntry } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
    // A quantidade de módulos aqui é do FORMULÁRIO e não o resultado final.
    quantidade_modulos: undefined,
    // Vendas
    salespersonId: "",
    paymentTermId: "",
    priceListId: ""
}

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0); // 0 for form, 1 for results
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [proposalId, setProposalId] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const quoteId = searchParams.get('quoteId');
  const clienteId = searchParams.get('clienteId');
  
  const methods = useForm<z.infer<typeof solarCalculationSchema>>({
    resolver: zodResolver(solarCalculationSchema),
    defaultValues
  });
  
  useEffect(() => {
    const initialize = async () => {
      let initialData = { ...defaultValues };
      let clientToSet: any = null;

      if (quoteId) {
        setProposalId(quoteId);
        const existingQuote = getQuoteById(quoteId);
        if (existingQuote) {
          initialData = existingQuote.formData;
          const calcResult = await getCalculation(initialData);
          if (calcResult.success) {
            setResults(calcResult.data);
            setCurrentStep(1); // Go to results page if loading an existing quote
          }
        }
      }
      
      if (clienteId) {
          const foundClient = getClientById(clienteId);
          if(foundClient) {
              clientToSet = {
                  name: foundClient.name,
                  document: foundClient.cnpj || '',
                  address: foundClient.street || '',
              };
              if (foundClient.salespersonId) initialData.salespersonId = foundClient.salespersonId;
              if (foundClient.paymentTermId) initialData.paymentTermId = foundClient.paymentTermId;
              if (foundClient.priceListId) initialData.priceListId = foundClient.priceListId;
          }
      }
      
      methods.reset(initialData);
      if(clientToSet) {
        setClientData(clientToSet);
      }

      setIsReady(true);
    };

    initialize();
  }, [leadId, quoteId, clienteId, methods, router]);


  const processForm = async (data: SolarCalculationInput) => {
    setIsLoading(true);

    const parsedData = solarCalculationSchema.safeParse({
        ...data,
        // Ensure numeric types are correct
        consumo_mensal_kwh: Number(data.consumo_mensal_kwh),
        valor_medio_fatura_reais: Number(data.valor_medio_fatura_reais),
        cip_iluminacao_publica_reais: Number(data.cip_iluminacao_publica_reais),
        irradiacao_psh_kwh_m2_dia: Number(data.irradiacao_psh_kwh_m2_dia),
        // Pass other numeric fields similarly...
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
  
  const handleRecalculate = (newResults: SolarCalculationResult) => {
    setResults(newResults);
  }

  const handleSaveQuote = () => {
    if (!leadId || !results || !proposalId || !clienteId) {
        toast({ title: "Erro", description: "Contexto do lead, cliente, resultados do cálculo ou ID da proposta não encontrados para salvar.", variant: "destructive" });
        return;
    }

    const formData = methods.getValues();
    
    const quoteToSave: Quote = {
        id: proposalId,
        leadId: leadId,
        createdAt: quoteId ? getQuoteById(quoteId)!.createdAt : new Date().toISOString(), 
        formData: formData,
        results: results,
    };

    saveQuote(quoteToSave);

    const historyMessage = quoteId ? `Cotação ${proposalId} foi atualizada.` : `Nova cotação ${proposalId} foi criada.`;

    addHistoryEntry({ 
        clientId: clienteId, 
        text: historyMessage, 
        type: 'log-quote',
        refId: proposalId,
        quoteInfo: { leadId: leadId, clientId: clienteId }
    });

    toast({ title: quoteId ? "Cotação Atualizada!" : "Cotação Salva!", description: "A cotação foi salva com sucesso." });
    router.push(`/crm/${leadId}`);
  };

  const handleGoBackToLead = () => {
     if (leadId) router.push(`/crm/${leadId}`);
     else router.push('/crm');
  }

  if (!isReady) {
    return <div className="flex items-center justify-center h-64">Carregando Orçamento...</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
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
      
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(processForm)}>
          <div className="space-y-6">
            {/* Toolbar */}
             <Card>
                <CardContent className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="simulador-manual" className="border-0">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Calculator className="h-5 w-5" /> Simulador Manual
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <Step1DataInput isLoading={isLoading} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="dimensionamento-ia" className="border-0">
                       <AccordionTrigger>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Sparkles className="h-5 w-5" /> Dimensionamento por IA
                        </div>
                      </AccordionTrigger>
                       <AccordionContent className="pt-4">
                         <p className="text-center text-muted-foreground p-8">O formulário para dimensionamento com IA estará disponível aqui em breve.</p>
                       </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
             </Card>

            {/* Bill of Materials */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">Lista de Materiais</CardTitle>
                        <CardDescription>Insumos que irão compor a proposta comercial.</CardDescription>
                    </div>
                    <Button type="button">
                        <Plus className="mr-2"/> Adicionar Item
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Descrição</TableHead>
                            <TableHead>Fabricante</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                            <TableHead className="text-center">Un.</TableHead>
                            <TableHead className="w-[100px] text-right">Qtde.</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhum item adicionado. Use o simulador ou adicione itens manualmente.
                          </TableCell>
                      </TableRow>
                    </TableBody>
                </Table>
              </CardContent>
            </Card>

            <AnimatePresence>
            {results && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6"
              >
                <Step2Results 
                  results={results}
                  proposalId={proposalId}
                  clientData={clientData}
                  onBack={() => { setResults(null); setCurrentStep(0); }}
                  onRecalculate={handleRecalculate}
                  onSave={handleSaveQuote}
                  onGoToDataInput={() => setCurrentStep(0)}
                  isEditing={!!quoteId}
                />
              </motion.div>
            )}
            </AnimatePresence>

          </div>
        </form>
      </FormProvider>
    </div>
  );
}
