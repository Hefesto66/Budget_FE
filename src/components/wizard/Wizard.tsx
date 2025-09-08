
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from "zod";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, Quote } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { Button } from "../ui/button";
import { ArrowLeft, Save, Sparkles, Calculator, Plus, Trash2, Check, ChevronsUpDown, CheckCircle, Loader2, FileDown, ChevronRight } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId, getClientById, addHistoryEntry, getProducts, Product, getProductById } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn, formatCurrency } from "@/lib/utils";
import { Step1DataInput } from "./Step1DataInput";

const Step2Results = dynamic(() => import('./Step2Results').then(mod => mod.Step2Results), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" />A carregar resultados...</div>,
});


const wizardSchema = z.object({
    calculationInput: solarCalculationSchema,
    billOfMaterials: z.array(z.object({
        productId: z.string().min(1, "Selecione um produto"),
        name: z.string(),
        category: z.string(),
        manufacturer: z.string(),
        cost: z.number(),
        unit: z.string(),
        quantity: z.number().min(1, "A quantidade deve ser pelo menos 1."),
        // Add technicalSpecifications to the schema to hold product specs
        technicalSpecifications: z.record(z.string()).optional(),
    }))
});

export type WizardFormData = z.infer<typeof wizardSchema>;

const DRAFT_QUOTE_SESSION_KEY = 'draftQuoteData';

const defaultValues: SolarCalculationInput = {
    consumo_mensal_kwh: 500,
    valor_medio_fatura_reais: 450,
    adicional_bandeira_reais_kwh: 0,
    cip_iluminacao_publica_reais: 25,
    concessionaria: "Equatorial GO",
    rede_fases: "mono",
    irradiacao_psh_kwh_m2_dia: 5.7,
    fator_perdas_percent: 20,
    custo_om_anual_reais: 150,
    meta_compensacao_percent: 100,
}

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
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
  
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
        calculationInput: defaultValues,
        billOfMaterials: [],
    }
  });
  
  const { fields, append, remove, update } = useFieldArray({
      control: methods.control,
      name: "billOfMaterials",
  });

  const [inventory, setInventory] = useState<Product[]>([]);
  const [openCombobox, setOpenCombobox] = useState<number | null>(null);
  
  useEffect(() => {
    setInventory(getProducts());
    
    const initialize = async () => {
      let draftData: any = null;
      try {
        const draftDataStr = sessionStorage.getItem(DRAFT_QUOTE_SESSION_KEY);
        if (draftDataStr) {
          draftData = JSON.parse(draftDataStr);
        }
      } catch (e) {
        console.error("Could not parse draft data from session storage", e);
        sessionStorage.removeItem(DRAFT_QUOTE_SESSION_KEY);
      }

      if (draftData) {
          methods.reset({
            calculationInput: { ...defaultValues, ...(draftData.formData?.calculationInput || {}) },
            billOfMaterials: draftData.formData?.billOfMaterials || [],
          });
          if (draftData.results) setResults(draftData.results);
          if (draftData.clientData) setClientData(draftData.clientData);
          if (draftData.proposalId) setProposalId(draftData.proposalId);
          if (draftData.currentStep) setCurrentStep(draftData.currentStep);
          setIsReady(true);
          return;
      }

      let initialData: Partial<SolarCalculationInput> = {};
      let clientToSet: any = null;
      let bomToSet: any[] = [];
      let loadedResults: SolarCalculationResult | null = null;

      if (quoteId) {
        setProposalId(quoteId);
        const existingQuote = getQuoteById(quoteId);
        if (existingQuote) {
          initialData = existingQuote.formData;
          loadedResults = existingQuote.results;
          if (existingQuote.billOfMaterials) {
            bomToSet = existingQuote.billOfMaterials;
          }
        }
      }
      
      if (clienteId) {
          const foundClient = getClientById(clienteId);
          if(foundClient) {
              clientToSet = {
                  name: foundClient.name,
                  document: foundClient.cnpj || '',
                  address: `${foundClient.street || ''}, ${foundClient.cityState || ''}`,
              };
              if (foundClient.salespersonId) initialData.salespersonId = foundClient.salespersonId;
              if (foundClient.paymentTermId) initialData.paymentTermId = foundClient.paymentTermId;
              if (foundClient.priceListId) initialData.priceListId = foundClient.priceListId;
          }
      }
      
      methods.reset({ 
        calculationInput: {...defaultValues, ...initialData}, 
        billOfMaterials: bomToSet 
      });

      if(clientToSet) setClientData(clientToSet);
      if(loadedResults) setResults(loadedResults);
      if(quoteId && loadedResults) setCurrentStep(1);

      setIsReady(true);
    };

    initialize();
  }, [leadId, quoteId, clienteId, methods, router]);


  const processForm = async (data: WizardFormData) => {
    setIsLoading(true);
    toast({ title: "Iniciando cálculo...", description: "A validar os dados de entrada..." });

    const bom = data.billOfMaterials;
    const panelItem = bom.find(item => item.category === 'PAINEL_SOLAR');
    const inverterItem = bom.find(item => item.category === 'INVERSOR');
    const serviceItem = bom.find(item => item.category === 'SERVICO');

    if (!panelItem || !inverterItem || !serviceItem) {
        toast({ title: "Lista de Materiais Incompleta", description: "É necessário ter pelo menos um Painel Solar, um Inversor e um Serviço na lista para calcular.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const productInInventory = getProductById(panelItem.productId);
     if (!productInInventory) {
      toast({ title: "Erro de Inventário", description: `O produto "${panelItem.name}" não foi encontrado no inventário.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const panelPowerWp = parseFloat(productInInventory.technicalSpecifications?.['Potência (Wp)'] || '0');
    if (!panelPowerWp || panelPowerWp === 0) {
      toast({ title: "Erro de Especificação", description: `O painel "${panelItem.name}" não tem a especificação "Potência (Wp)" definida no inventário.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const inverterInInventory = getProductById(inverterItem.productId);
     if (!inverterInInventory) {
      toast({ title: "Erro de Inventário", description: `O produto "${inverterItem.name}" não foi encontrado no inventário.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const inverterEfficiency = parseFloat(inverterInInventory.technicalSpecifications?.['Eficiência (%)'] || '0');
     if (!inverterEfficiency || inverterEfficiency === 0) {
      toast({ title: "Erro de Especificação", description: `O inversor "${inverterItem.name}" não tem a especificação "Eficiência (%)" definida no inventário.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const totalCostFromBom = bom.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

    const calculationData: SolarCalculationInput = {
        ...data.calculationInput,
        custo_sistema_reais: totalCostFromBom,
        quantidade_modulos: panelItem.quantity,
        potencia_modulo_wp: panelPowerWp,
        eficiencia_inversor_percent: inverterEfficiency,
        preco_modulo_reais: panelItem.cost,
        fabricante_modulo: panelItem.manufacturer,
        garantia_defeito_modulo_anos: 12,
        garantia_geracao_modulo_anos: 25,
        quantidade_inversores: inverterItem.quantity,
        custo_inversor_reais: inverterItem.cost,
        fabricante_inversor: inverterItem.manufacturer,
        modelo_inversor: inverterItem.name,
        potencia_inversor_kw: 5, // Placeholder, not used in calculation
        tensao_inversor_v: 220, // Placeholder
        garantia_inversor_anos: 5, // Placeholder
        custo_fixo_instalacao_reais: serviceItem.cost,
    };
    
    toast({ title: "A enviar para o servidor...", description: "Os dados foram validados." });
    console.log("Submitting to server:", calculationData);

    const result = await getCalculation(calculationData);

    setIsLoading(false);

    if (result.success && result.data) {
      toast({ title: "Cálculo bem-sucedido!", description: "A exibir análise financeira." });
      setResults(result.data);
      methods.setValue('calculationInput', calculationData); 
      setCurrentStep(1);
    } else {
      toast({
        title: "Erro no Cálculo",
        description: result.error || "Ocorreu uma falha no servidor ao processar a cotação.",
        variant: "destructive",
      });
      console.error("Server-side calculation failed:", result.error);
    }
  };
  
  const handleRecalculate = (newResults: SolarCalculationResult) => {
    setResults(newResults);
  }

  const handleSaveQuote = () => {
    if (!leadId || !clienteId) {
        toast({ title: "Erro", description: "Contexto do lead ou cliente não encontrados para salvar.", variant: "destructive" });
        return;
    }
    
    const finalProposalId = quoteId || generateNewQuoteId();
    if (!proposalId) setProposalId(finalProposalId);

    const formData = methods.getValues('calculationInput');
    const billOfMaterials = methods.getValues('billOfMaterials');
    
    if(!results) {
         toast({ title: "Erro ao Salvar", description: "Os resultados do cálculo não foram encontrados.", variant: "destructive" });
         return;
    }

    const quoteToSave: Quote = {
        id: finalProposalId,
        leadId: leadId,
        createdAt: quoteId ? getQuoteById(quoteId)!.createdAt : new Date().toISOString(), 
        formData: formData,
        results: results,
        billOfMaterials: billOfMaterials
    };

    saveQuote(quoteToSave);
    sessionStorage.removeItem(DRAFT_QUOTE_SESSION_KEY); // Clear draft on successful save

    const historyMessage = quoteId ? `Cotação ${finalProposalId} foi atualizada.` : `Nova cotação ${finalProposalId} foi criada.`;

    addHistoryEntry({ 
        clientId: clienteId, 
        text: historyMessage, 
        type: 'log-quote',
        refId: finalProposalId,
        quoteInfo: { leadId: leadId, clientId: clienteId }
    });

    toast({ title: quoteId ? "Cotação Atualizada!" : "Cotação Salva!", description: "A cotação foi salva com sucesso." });
    router.push(`/crm/${leadId}`);
  };

  const handleGoBackToLead = () => {
     sessionStorage.removeItem(DRAFT_QUOTE_SESSION_KEY);
     if (leadId) router.push(`/crm/${leadId}`);
     else router.push('/crm');
  }

  const onProductSelect = (product: Product, index: number) => {
    update(index, {
        productId: product.id,
        name: product.name,
        category: product.category,
        manufacturer: product.technicalSpecifications?.['Fabricante'] || 'N/A',
        cost: product.salePrice,
        unit: product.unit,
        quantity: 1,
        technicalSpecifications: product.technicalSpecifications || {},
    });
    setOpenCombobox(null);
  }
  
  const handleAddNewItem = () => {
    append({ productId: '', name: '', category: 'OUTRO', manufacturer: '', cost: 0, unit: '', quantity: 1, technicalSpecifications: {} });
  }

  const navigateToProduct = (productId: string) => {
    const draftData = {
      formData: methods.getValues(),
      results,
      clientData,
      proposalId,
      currentStep
    };
    sessionStorage.setItem(DRAFT_QUOTE_SESSION_KEY, JSON.stringify(draftData));
    router.push(`/inventario/${productId}`);
  };

  
  const watchedBOM = useWatch({ control: methods.control, name: 'billOfMaterials' });
  const totalCost = watchedBOM.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  
  if (!isReady) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" />A carregar Orçamento...</div>;
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(processForm)}>
          <AnimatePresence mode="wait">
            {currentStep === 0 ? (
               <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                    {leadId && (
                        <div className="mb-8 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Cotação para a Oportunidade: <span className="text-primary font-bold">{getLeadById(leadId)?.title}</span>
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleGoBackToLead}>
                                    <ArrowLeft /> Voltar para a Oportunidade
                                </Button>
                                <Button type="button" onClick={handleSaveQuote}>
                                    <Save /> {quoteId ? "Atualizar Cotação" : "Salvar Cotação"}
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        <Card>
                          <CardHeader>
                              <CardTitle className="font-headline">Dados de Consumo e do Local</CardTitle>
                              <CardDescription>Informações básicas para o cálculo da viabilidade.</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4">
                            <Step1DataInput isLoading={isLoading} />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                              <CardTitle className="font-headline">Lista de Materiais</CardTitle>
                              <CardDescription>Insumos que irão compor a proposta comercial.</CardDescription>
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
                                  {fields.map((field, index) => (
                                      <TableRow key={field.id}>
                                          <TableCell>
                                              <div className="flex items-center gap-2">
                                                  <FormField
                                                      control={methods.control}
                                                      name={`billOfMaterials.${index}.name`}
                                                      render={({ field: formField }) => (
                                                          <Popover open={openCombobox === index} onOpenChange={(isOpen) => setOpenCombobox(isOpen ? index : null)}>
                                                              <PopoverTrigger asChild>
                                                                  <FormControl>
                                                                      <Button
                                                                          variant="outline"
                                                                          role="combobox"
                                                                          className={cn("w-full justify-between font-normal", !formField.value && "text-muted-foreground")}
                                                                      >
                                                                          {formField.value || "Selecione um produto"}
                                                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                      </Button>
                                                                  </FormControl>
                                                              </PopoverTrigger>
                                                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                  <Command>
                                                                      <CommandInput placeholder="Pesquisar produto..." />
                                                                      <CommandList>
                                                                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                                                          <CommandGroup>
                                                                              {inventory.map((item) => (
                                                                                  <CommandItem
                                                                                      value={item.name}
                                                                                      key={item.id}
                                                                                      onSelect={() => onProductSelect(item, index)}
                                                                                  >
                                                                                      <Check className={cn("mr-2 h-4 w-4", item.name === formField.value ? "opacity-100" : "opacity-0")}/>
                                                                                      {item.name}
                                                                                  </CommandItem>
                                                                              ))}
                                                                          </CommandGroup>
                                                                      </CommandList>
                                                                  </Command>
                                                              </PopoverContent>
                                                          </Popover>
                                                      )}
                                                  />
                                                  {field.productId && (
                                                      <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                                                          onClick={() => navigateToProduct(field.productId)}
                                                      >
                                                          <ChevronRight className="h-5 w-5" />
                                                      </Button>
                                                  )}
                                              </div>
                                          </TableCell>
                                          <TableCell className="text-muted-foreground">
                                              {methods.watch(`billOfMaterials.${index}.manufacturer`)}
                                          </TableCell>
                                          <TableCell className="text-right text-muted-foreground">
                                              {formatCurrency(methods.watch(`billOfMaterials.${index}.cost`))}
                                          </TableCell>
                                          <TableCell className="text-center text-muted-foreground">
                                              {methods.watch(`billOfMaterials.${index}.unit`)}
                                          </TableCell>
                                          <TableCell>
                                              <FormField
                                                  control={methods.control}
                                                  name={`billOfMaterials.${index}.quantity`}
                                                  render={({ field }) => (
                                                      <Input
                                                          type="number"
                                                          className="text-right"
                                                          {...field}
                                                          onChange={e => field.onChange(Number(e.target.value))}
                                                      />
                                                  )}
                                              />
                                          </TableCell>
                                          <TableCell>
                                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                                      <TableRow>
                                          <TableCell colSpan={6}>
                                              <Button type="button" variant="link" onClick={handleAddNewItem}>
                                                  <Plus className="mr-2 h-4 w-4"/>
                                                  Adicionar Item
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  </TableBody>
                              </Table>
                              <div className="flex justify-end mt-4">
                                  <div className="w-full max-w-xs space-y-2">
                                      <div className="flex justify-between font-semibold text-lg">
                                          <span>Total Geral:</span>
                                          <span>{formatCurrency(totalCost)}</span>
                                      </div>
                                  </div>
                              </div>
                          </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button type="submit" size="lg" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              A Calcular...
                            </>
                          ) : (
                            "Avançar para Resultados"
                          )}
                      </Button>
                    </div>
                </motion.div>
            ) : (
              results && (
                 <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
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
              )
            )}
          </AnimatePresence>
        </form>
      </FormProvider>
    </div>
  );
}
