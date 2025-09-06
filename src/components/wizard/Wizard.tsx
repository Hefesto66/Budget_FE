
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from "zod";
import { Step2Results } from "./Step2Results";
import type { SolarCalculationResult, SolarCalculationInput, ClientFormData, Quote } from "@/types";
import { getCalculation, getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { solarCalculationSchema } from "@/types";
import { Button } from "../ui/button";
import { ArrowLeft, Save, Sparkles, Calculator, Plus, Trash2, Check, ChevronsUpDown, CheckCircle } from "lucide-react";
import { getLeadById, getQuoteById, saveQuote, generateNewQuoteId, getClientById, addHistoryEntry, getProducts, Product } from "@/lib/storage";
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
import { Step1DataInput } from "./Step1DataInput";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn, formatCurrency } from "@/lib/utils";
import type { SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Separator } from "../ui/separator";

const wizardSchema = z.object({
    calculationInput: solarCalculationSchema,
    billOfMaterials: z.array(z.object({
        productId: z.string().min(1),
        name: z.string(),
        manufacturer: z.string(),
        cost: z.number(),
        unit: z.string(),
        quantity: z.number().min(1),
    }))
});

type WizardFormData = z.infer<typeof wizardSchema>;

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
  
  const methods = useForm<WizardFormData>({
    // resolver: zodResolver(wizardSchema), // TODO: Add resolver
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
    // Load inventory
    setInventory(getProducts());
    
    const initialize = async () => {
      let initialData = { ...defaultValues };
      let clientToSet: any = null;
      let bomToSet: any[] = [];

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
                  address: foundClient.street || '',
              };
              if (foundClient.salespersonId) initialData.salespersonId = foundClient.salespersonId;
              if (foundClient.paymentTermId) initialData.paymentTermId = foundClient.paymentTermId;
              if (foundClient.priceListId) initialData.priceListId = foundClient.priceListId;
          }
      }
      
      methods.reset({ calculationInput: initialData, billOfMaterials: bomToSet });
      if(clientToSet) {
        setClientData(clientToSet);
      }

      setIsReady(true);
    };

    initialize();
  }, [leadId, quoteId, clienteId, methods, router]);


  const processForm = async (data: SolarCalculationInput) => {
    setIsLoading(true);
    
    const result = await getCalculation(data);
    setIsLoading(false);

    if (result.success && result.data) {
      setResults(result.data);

      const panel = inventory.find(p => p.type === 'PAINEL_SOLAR');
      const inverter = inventory.find(p => p.type === 'INVERSOR');
      const service = inventory.find(p => p.type === 'SERVICO');

      const bom : any[] = [];
      if(panel) bom.push({ productId: panel.id, name: panel.name, manufacturer: panel.technicalSpecifications?.['Fabricante'] || 'N/A', cost: panel.salePrice, unit: panel.unit, quantity: result.data.dimensionamento.quantidade_modulos });
      if(inverter) bom.push({ productId: inverter.id, name: inverter.name, manufacturer: inverter.technicalSpecifications?.['Fabricante'] || 'N/A', cost: inverter.salePrice, unit: inverter.unit, quantity: data.quantidade_inversores });
      if(service) bom.push({ productId: service.id, name: service.name, manufacturer: 'N/A', cost: service.salePrice, unit: service.unit, quantity: 1 });

      methods.setValue('billOfMaterials', bom);

      toast({
        title: "Itens Adicionados",
        description: "Os itens do simulador foram adicionados à lista de materiais abaixo.",
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
    
    // Recalculate final results based on BOM
    const finalSystemCost = billOfMaterials.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    const finalFormData = { ...formData, custo_sistema_reais: finalSystemCost };
    
    getCalculation(finalFormData).then(finalResults => {
        if (!finalResults.success || !finalResults.data) {
             toast({ title: "Erro ao Finalizar", description: "Não foi possível recalcular o resultado final antes de salvar.", variant: "destructive" });
             return;
        }

        const quoteToSave: Quote = {
            id: finalProposalId,
            leadId: leadId,
            createdAt: quoteId ? getQuoteById(quoteId)!.createdAt : new Date().toISOString(), 
            formData: finalFormData,
            results: finalResults.data,
            billOfMaterials: billOfMaterials
        };

        saveQuote(quoteToSave);

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
    });
  };

  const handleGoBackToLead = () => {
     if (leadId) router.push(`/crm/${leadId}`);
     else router.push('/crm');
  }

  const onProductSelect = (product: Product, index: number) => {
    update(index, {
        productId: product.id,
        name: product.name,
        manufacturer: product.technicalSpecifications?.['Fabricante'] || 'N/A',
        cost: product.salePrice,
        unit: product.unit,
        quantity: 1,
    });
    setOpenCombobox(null);
  }
  
  const handleAddNewItem = () => {
    append({ productId: '', name: '', manufacturer: '', cost: 0, unit: '', quantity: 1 });
  }
  
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
            manufacturer: product?.technicalSpecifications?.['Fabricante'] || 'N/A',
            cost: product?.salePrice || 0,
            unit: product?.unit || 'UN',
            quantity: item.quantidade,
        };
    });

    if(service) {
      bomFromAI.push({ productId: service.id, name: service.name, manufacturer: 'N/A', cost: service.salePrice, unit: service.unit, quantity: 1 });
    }
    
    methods.setValue('billOfMaterials', bomFromAI);
    setRefinedSuggestion(null); // Fecha o dialog
    
    toast({
        title: "Sugestão Aplicada!",
        description: "A lista de materiais foi atualizada com a sugestão da IA.",
      });
  };

  const watchedBOM = useWatch({ control: methods.control, name: 'billOfMaterials' });
  const totalCost = watchedBOM.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  if (!isReady) {
    return <div className="flex items-center justify-center h-64">Carregando Orçamento...</div>;
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {leadId && (
        <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                    Cotação para o Lead: <span className="text-primary font-bold">{getLeadById(leadId)?.title}</span>
                </h2>
                 <Button variant="outline" size="icon" onClick={handleAiRefinement} disabled={isRefining} title="Refinar com IA">
                    <Sparkles className={`h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleGoBackToLead}>
                    <ArrowLeft /> Voltar para o Lead
                </Button>
                 <Button onClick={handleSaveQuote}>
                    <Save /> {quoteId ? "Atualizar Cotação" : "Salvar Cotação"}
                </Button>
            </div>
        </div>
      )}
      
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((data) => processForm(data.calculationInput))}>
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
                      {fields.map((field, index) => (
                         <TableRow key={field.id}>
                            <TableCell>
                               <FormField
                                    control={methods.control}
                                    name={`billOfMaterials.${index}.name`}
                                    render={({ field }) => (
                                        <Popover open={openCombobox === index} onOpenChange={(isOpen) => setOpenCombobox(isOpen ? index : null)}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? inventory.find((item) => item.name === field.value)?.name : "Selecione um produto"}
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
                                                                    <Check className={cn("mr-2 h-4 w-4", item.name === field.value ? "opacity-100" : "opacity-0")}/>
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
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
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
            
            {totalCost > 0 && (
                <div className="flex justify-end">
                    <Button size="lg" onClick={() => setCurrentStep(1)}>Avançar para Resultados</Button>
                </div>
            )}


            <AnimatePresence>
            {results && currentStep === 1 && (
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


          </div>
        </form>
      </FormProvider>
    </div>
  );
}

    