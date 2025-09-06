
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from "zod";
import Link from 'next/link';
import { Step2Results } from "./Step2Results";
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, Quote } from "@/types";
import { getCalculation, getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { Button } from "../ui/button";
import { ArrowLeft, Save, Sparkles, Calculator, Plus, Trash2, Check, ChevronsUpDown, CheckCircle, Loader2, FileDown, ChevronRight } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId, getClientById, addHistoryEntry, getProducts, Product, getProductById } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
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
import type { SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Step1DataInput } from "./Step1DataInput";


const wizardSchema = z.object({
    calculationInput: solarCalculationSchema,
    billOfMaterials: z.array(z.object({
        productId: z.string().min(1),
        name: z.string(),
        type: z.string(),
        manufacturer: z.string(),
        cost: z.number(),
        unit: z.string(),
        quantity: z.number().min(1),
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
    potencia_modulo_wp: 550,
    quantidade_modulos: 10,
    eficiencia_inversor_percent: 97,
    custo_inversor_reais: 4500,
    quantidade_inversores: 1,
    custo_fixo_instalacao_reais: 2000,
    preco_modulo_reais: 750,
    custo_sistema_reais: 0,
    salespersonId: "",
    paymentTermId: "",
    priceListId: "",
    modelo_inversor: "",
    fabricante_inversor: "",
    potencia_inversor_kw: 5,
    tensao_inversor_v: 0,
    garantia_inversor_anos: 0,
    fabricante_modulo: "",
    garantia_defeito_modulo_anos: 0,
    garantia_geracao_modulo_anos: 0,
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
  
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);

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
          setCurrentStep(draftData.currentStep);
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

    const bom = data.billOfMaterials;
    const panelItem = bom.find(item => item.type === 'PAINEL_SOLAR');
    const inverterItem = bom.find(item => item.type === 'INVERSOR');
    const serviceItem = bom.find(item => item.type === 'SERVICO');

    if (!panelItem) {
        toast({ title: "Item Faltando", description: "A lista de materiais precisa conter pelo menos um item do tipo 'Painel Solar'.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    if (!inverterItem) {
        toast({ title: "Item Faltando", description: "A lista de materiais precisa conter um item do tipo 'Inversor'.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    if (!serviceItem) {
        toast({ title: "Item Faltando", description: "A lista de materiais precisa conter um item do tipo 'Serviço' para o custo de instalação.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const panelProduct = getProductById(panelItem.productId);
    const inverterProduct = getProductById(inverterItem.productId);
    
    if (!panelProduct) {
         toast({ title: "Erro de Produto", description: `Painel Solar "${panelItem.name}" não foi encontrado no inventário. Verifique a lista.`, variant: "destructive" });
         console.error("Failed to find panel product with ID:", panelItem.productId);
        setIsLoading(false);
        return;
    }
     if (!inverterProduct) {
         toast({ title: "Erro de Produto", description: `Inversor "${inverterItem.name}" não foi encontrado no inventário. Verifique a lista.`, variant: "destructive" });
         console.error("Failed to find inverter product with ID:", inverterItem.productId);
        setIsLoading(false);
        return;
    }

    const totalCostFromBom = bom.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    
    const panelPower = parseFloat(panelProduct.technicalSpecifications?.['Potência (Wp)'] || '0');
    const inverterEfficiency = parseFloat(inverterProduct.technicalSpecifications?.['Eficiência (%)'] || '0');
    const inverterPower = parseFloat(inverterProduct.technicalSpecifications?.['Potência de Saída (kW)'] || '0');

    if (panelPower === 0) {
        toast({ title: "Dado Faltando", description: `O produto "${panelProduct.name}" não tem a especificação "Potência (Wp)".`, variant: "destructive" });
        setIsLoading(false); return;
    }
    if (inverterEfficiency === 0) {
        toast({ title: "Dado Faltando", description: `O produto "${inverterProduct.name}" não tem a especificação "Eficiência (%)".`, variant: "destructive" });
        setIsLoading(false); return;
    }
    if (inverterPower === 0) {
        toast({ title: "Dado Faltando", description: `O produto "${inverterProduct.name}" não tem a especificação "Potência de Saída (kW)".`, variant: "destructive" });
        setIsLoading(false); return;
    }

    const calculationData: SolarCalculationInput = {
        ...data.calculationInput,
        custo_sistema_reais: totalCostFromBom,
        quantidade_modulos: panelItem.quantity,
        preco_modulo_reais: panelItem.cost,
        potencia_modulo_wp: panelPower,
        fabricante_modulo: panelProduct.technicalSpecifications?.['Fabricante'] || 'N/A',
        garantia_defeito_modulo_anos: 12, 
        garantia_geracao_modulo_anos: 25, 
        quantidade_inversores: inverterItem.quantity,
        custo_inversor_reais: inverterItem.cost,
        eficiencia_inversor_percent: inverterEfficiency,
        fabricante_inversor: inverterProduct.technicalSpecifications?.['Fabricante'] || 'N/A',
        modelo_inversor: inverterProduct.name,
        potencia_inversor_kw: inverterPower,
        tensao_inversor_v: 220, 
        garantia_inversor_anos: 5, 
        custo_fixo_instalacao_reais: serviceItem.cost,
    };
    
    console.log("[DEBUG] Data sent to calculation:", JSON.stringify(calculationData, null, 2));
    
    const result = await getCalculation(calculationData);
    
    console.log("[DEBUG] Response from calculation:", JSON.stringify(result, null, 2));

    setIsLoading(false);

    if (result.success && result.data) {
      setResults(result.data);
      methods.setValue('calculationInput', calculationData); 
      setCurrentStep(1);
      toast({
        title: "Cálculo Concluído",
        description: "Os resultados foram gerados com base nos seus dados.",
      });

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
        type: product.type,
        manufacturer: product.technicalSpecifications?.['Fabricante'] || 'N/A',
        cost: product.salePrice,
        unit: product.unit,
        quantity: 1,
    });
    setOpenCombobox(null);
  }
  
  const handleAddNewItem = () => {
    append({ productId: '', name: '', type: 'OUTRO', manufacturer: '', cost: 0, unit: '', quantity: 1 });
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

  
  const handleAiRefinement = async () => {
    setIsRefining(true);
    setRefinedSuggestion(null);

    const formData = methods.getValues('calculationInput');
    const allProducts = getProducts();
    const panels = allProducts.filter(p => p.type === 'PAINEL_SOLAR');
    const inverters = allProducts.filter(p => p.type === 'INVERSOR');
    
    const response = await getRefinedSuggestions({ ...formData, inventory: { panels, inverters }});

    if (response.success && response.data) {
      setRefinedSuggestion(response.data);
    } else {
      toast({
        title: "Erro na Sugestão",
        description: response.error || "Não foi possível obter uma sugestão da IA. Tente novamente.",
        variant: "destructive",
      });
    }

    setIsRefining(false);
  };
  
  const handleApplySuggestion = async () => {
    if (!refinedSuggestion) return;
    
    const service = inventory.find(p => p.type === 'SERVICO');

    const bomFromAI = refinedSuggestion.configuracao_otimizada.itens.map(item => {
        const product = getProductById(item.produtoId);
        return {
            productId: item.produtoId,
            name: item.nomeProduto,
            type: product?.type || 'OUTRO',
            manufacturer: product?.technicalSpecifications?.['Fabricante'] || 'N/A',
            cost: product?.salePrice || 0,
            unit: product?.unit || 'UN',
            quantity: item.quantidade,
        };
    });

    if(service) {
      bomFromAI.push({ productId: service.id, name: service.name, type: service.type, manufacturer: 'N/A', cost: service.salePrice, unit: service.unit, quantity: 1 });
    }
    
    methods.setValue('billOfMaterials', bomFromAI);
    setRefinedSuggestion(null);
    
    toast({
        title: "Sugestão Aplicada!",
        description: "A lista de materiais foi atualizada com a sugestão da IA.",
      });
  };

  const watchedBOM = useWatch({ control: methods.control, name: 'billOfMaterials' });
  const totalCost = watchedBOM.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  
  if (!isReady) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" />Carregando Orçamento...</div>;
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
                                    Cotação para o Lead: <span className="text-primary font-bold">{getLeadById(leadId)?.title}</span>
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleGoBackToLead}>
                                    <ArrowLeft /> Voltar para o Lead
                                </Button>
                                <Button type="button" onClick={handleSaveQuote}>
                                    <Save /> {quoteId ? "Atualizar Cotação" : "Salvar Cotação"}
                                </Button>
                                <Button type="button" variant="outline" size="icon" onClick={handleAiRefinement} disabled={isRefining} title="Refinar com IA">
                                    <Sparkles className={`h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
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
                              Calculando...
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
            
             <AlertDialog open={!!refinedSuggestion} onOpenChange={(isOpen) => !isOpen && setRefinedSuggestion(null)}>
                <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-accent" />
                    Sugestão Otimizada por IA
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    Analisamos seu perfil e os produtos em seu inventário para encontrar a configuração com melhor custo-benefício.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
                    {refinedSuggestion && (
                    <div className="space-y-6 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2 text-foreground">Análise da IA</h3>
                            <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{refinedSuggestion.analise_texto}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Configuração Otimizada Sugerida</h4>
                             <div className="rounded-md border border-primary bg-primary/5 p-4 space-y-2">
                               {refinedSuggestion.configuracao_otimizada.itens.map(item => (
                                <div key={item.produtoId} className="flex justify-between items-center">
                                    <span>{item.nomeProduto}</span>
                                    <span className="font-bold">{item.quantidade} UN</span>
                                </div>
                               ))}
                               <Separator className="my-2 bg-primary/20"/>
                                <div className="flex justify-between items-center text-base font-bold text-primary">
                                    <span>Novo Custo Total</span>
                                    <span>{formatCurrency(refinedSuggestion.configuracao_otimizada.custo_total)}</span>
                                 </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>Novo Payback Estimado</span>
                                    <span>{refinedSuggestion.configuracao_otimizada.payback.toFixed(1)} anos</span>
                                 </div>
                            </div>
                        </div>

                    </div>
                    )}
                </div>
                <AlertDialogFooter>
                    <Button variant="ghost" onClick={() => setRefinedSuggestion(null)}>Cancelar</Button>
                    <Button onClick={handleApplySuggestion}>
                        <CheckCircle className="mr-2" />
                        Aplicar e Usar Itens
                    </Button>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
      </FormProvider>
    </div>
  );
}
