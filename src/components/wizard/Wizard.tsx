
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from "zod";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { SolarCalculationResult, SolarCalculationInput, Client, Quote } from "@/types";
import { getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { Button } from "../ui/button";
import { ArrowLeft, Plus, Trash2, Check, ChevronsUpDown, Loader2, ChevronRight } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId, getClientById, addHistoryEntry, getProducts, Product } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn, formatCurrency } from "@/lib/utils";
import { Step1DataInput } from "./Step1DataInput";

const Step2Results = dynamic(() => import('./Step2Results').then(mod => mod.Step2Results), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" />A carregar resultados...</div>,
});

const bomItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  category: z.string(),
  manufacturer: z.string(),
  cost: z.number(),
  unit: z.string(),
  quantity: z.number().min(1, "A quantidade deve ser pelo menos 1."),
  technicalSpecifications: z.record(z.string()).optional(),
});

const wizardSchema = z.object({
  calculationInput: solarCalculationSchema,
  billOfMaterials: z.array(bomItemSchema).min(1, "A lista de materiais não pode estar vazia.")
});


export type WizardFormData = z.infer<typeof wizardSchema>;

const DRAFT_QUOTE_SESSION_KEY = 'draftQuoteData';

const defaultValues: Partial<SolarCalculationInput> = {
    consumo_mensal_kwh: 500,
    valor_medio_fatura_reais: 450,
    adicional_bandeira_reais_kwh: 0,
    cip_iluminacao_publica_reais: 25,
    rede_fases: "mono",
    irradiacao_psh_kwh_m2_dia: 5.7,
    // Valores padrão para os campos opcionais
    fator_perdas_percent: 20,
    custo_om_anual_reais: 150,
    meta_compensacao_percent: 100,
    inflacao_energetica_anual_percent: 8.0,
    degradacao_anual_paineis_percent: 0.5,
    taxa_minima_atratividade_percent: 6.0,
}

// Função para garantir que todos os itens da BOM tenham uma estrutura válida
const normalizeBillOfMaterials = (bom: any[]): WizardFormData['billOfMaterials'] => {
  if (!Array.isArray(bom)) return [];
  return bom.map(item => ({
    productId: item?.productId || '',
    name: item?.name || '',
    category: item?.category || 'OUTRO',
    manufacturer: item?.manufacturer || (item?.technicalSpecifications?.Fabricante || ''),
    cost: item?.cost || (item?.salePrice || 0),
    unit: item?.unit || 'UN',
    quantity: item?.quantity || 1,
    technicalSpecifications: item?.technicalSpecifications || {},
  }));
};

export function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState<Partial<Client> | null>(null);
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
  
  const handleAddNewItem = () => {
    append({ 
        productId: '', 
        name: 'Selecione um produto', 
        category: 'OUTRO', 
        manufacturer: '', 
        cost: 0, 
        unit: 'UN', 
        quantity: 1, 
        technicalSpecifications: {} 
    });
  }

  useEffect(() => {
    
    const initialize = async () => {
      
      const products = await getProducts();
      setInventory(products);

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
            billOfMaterials: normalizeBillOfMaterials(draftData.formData?.billOfMaterials),
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
        const existingQuote = await getQuoteById(quoteId);
        if (existingQuote) {
          initialData = existingQuote.formData;
          loadedResults = existingQuote.results;
          if (existingQuote.billOfMaterials) {
            bomToSet = existingQuote.billOfMaterials;
          }
        }
      }
      
      if (clienteId) {
          const foundClient = await getClientById(clienteId);
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
      
      const normalizedBom = normalizeBillOfMaterials(bomToSet);
      if (normalizedBom.length === 0) {
        handleAddNewItem();
      }

      methods.reset({ 
        calculationInput: {...defaultValues, ...initialData}, 
        billOfMaterials: normalizedBom.length > 0 ? normalizedBom : methods.getValues('billOfMaterials')
      });

      if(clientToSet) setClientData(clientToSet);
      if(loadedResults) setResults(loadedResults);
      if(quoteId && loadedResults) setCurrentStep(1);

      setIsReady(true);
    };

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, quoteId, clienteId, methods, router]);

  const processForm = async (data: WizardFormData) => {
    setIsLoading(true);
    try {
      const billOfMaterials = data.billOfMaterials.filter(item => item.productId); // Ignorar linhas em branco
  
      const panelItem = billOfMaterials.find(item => item.category === 'PAINEL_SOLAR');
      const inverterItem = billOfMaterials.find(item => item.category === 'INVERSOR');
  
      if (!panelItem) {
        toast({ title: "Erro de Validação", description: "Adicione um 'Painel Solar' à lista de materiais.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!inverterItem) {
        toast({ title: "Erro de Validação", description: "Adicione um 'Inversor' à lista de materiais.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
  
      const panelPowerWp = parseFloat(panelItem.technicalSpecifications?.['Potência (Wp)'] || '0');
      const inverterEfficiencyPercent = parseFloat(inverterItem.technicalSpecifications?.['Eficiência (%)'] || '0');
  
      if (isNaN(panelPowerWp) || panelPowerWp <= 0) {
        toast({ title: "Dados Incompletos", description: "O painel solar selecionado não possui a especificação 'Potência (Wp)' ou o valor é inválido.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
  
      if (isNaN(inverterEfficiencyPercent) || inverterEfficiencyPercent <= 0) {
        toast({ title: "Dados Incompletos", description: "O inversor selecionado não possui a especificação 'Eficiência (%)' ou o valor é inválido.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
  
      const totalSystemCost = billOfMaterials.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  
      const calculationData: SolarCalculationInput = {
        ...(data.calculationInput as SolarCalculationInput),
        custo_sistema_reais: totalSystemCost,
        quantidade_modulos: panelItem.quantity,
        potencia_modulo_wp: panelPowerWp,
        eficiencia_inversor_percent: inverterEfficiencyPercent,
      };
  
      const finalValidatedData = solarCalculationSchema.parse(calculationData);
      const result = await getCalculation(finalValidatedData);
  
      if (result.success && result.data) {
        toast({ title: "Cálculo bem-sucedido!", description: "A exibir análise financeira." });
        setResults(result.data);
        methods.setValue('calculationInput', finalValidatedData as any);
        setCurrentStep(1);
      } else {
        toast({
          title: "Erro no Cálculo",
          description: result.error || "Ocorreu uma falha no servidor ao processar a cotação.",
          variant: "destructive",
        });
        console.error("Server-side calculation failed:", result.error);
      }
  
    } catch (error: any) {
      console.error("ERRO DE VALIDAÇÃO OU PROCESSAMENTO:", error);
      toast({
        title: "Erro de Validação",
        description: `Verifique os campos do formulário. Detalhe: ${error.errors?.[0]?.message || error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const currentFormValues = methods.getValues();
    processForm(currentFormValues);
  };
  
  const handleSaveQuote = async () => {
    if (!leadId || !clienteId) {
        toast({ title: "Erro", description: "Contexto do lead ou cliente não encontrados para salvar.", variant: "destructive" });
        return;
    }
    
    const finalProposalId = quoteId || await generateNewQuoteId();
    if (!proposalId) setProposalId(finalProposalId);

    const formData = methods.getValues('calculationInput') as SolarCalculationInput;
    const billOfMaterials = methods.getValues('billOfMaterials').filter(item => item.productId); // Salvar apenas linhas preenchidas
    
    if(!results) {
         toast({ title: "Erro ao Salvar", description: "Os resultados do cálculo não foram encontrados.", variant: "destructive" });
         return;
    }

    const existingQuote = quoteId ? await getQuoteById(quoteId) : null;

    const quoteToSave: Quote = {
        id: finalProposalId,
        leadId: leadId,
        clientId: clienteId,
        createdAt: existingQuote ? existingQuote.createdAt : new Date().toISOString(), 
        formData: formData,
        results: results,
        billOfMaterials: billOfMaterials
    };

    await saveQuote(quoteToSave);
    sessionStorage.removeItem(DRAFT_QUOTE_SESSION_KEY); // Clear draft on successful save

    const historyMessage = quoteId ? `Cotação ${finalProposalId} foi atualizada.` : `Nova cotação ${finalProposalId} foi criada.`;

    await addHistoryEntry({ 
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
    
    // Adicionar uma nova linha em branco se a linha atual preenchida era a última
    const bom = methods.getValues('billOfMaterials');
    if (index === bom.length - 1) {
        handleAddNewItem();
    }
  }
  
  const navigateToProduct = (productId: string) => {
    if (!productId) return;
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
        <form onSubmit={(e) => { e.preventDefault(); }}>
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
                                                                          className={cn("w-full justify-between font-normal", !field.productId && "text-muted-foreground")}
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
                                          <TableCell className="text-right">
                                              {formatCurrency(methods.watch(`billOfMaterials.${index}.cost`))}
                                          </TableCell>
                                          <TableCell className="text-center text-muted-foreground">
                                              {methods.watch(`billOfMaterials.${index}.unit`)}
                                          </TableCell>
                                          <TableCell>
                                              <FormField
                                                  control={methods.control}
                                                  name={`billOfMaterials.${index}.quantity`}
                                                  render={({ field: formField }) => (
                                                      <Input
                                                          type="number"
                                                          className="text-right"
                                                          {...formField}
                                                          onChange={e => formField.onChange(Number(e.target.value))}
                                                          disabled={!field.productId}
                                                      />
                                                  )}
                                              />
                                          </TableCell>
                                          <TableCell>
                                             {field.productId && (
                                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))}
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
                      <Button type="button" size="lg" disabled={isLoading} onClick={handleManualSubmit}>
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

    