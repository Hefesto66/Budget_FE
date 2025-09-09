
"use client";

import { useState, useEffect } from "react";
import ReactDOMServer from 'react-dom/server';
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getCalculation, getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Wallet, TrendingUp, DollarSign, BarChart, Zap, Calendar, FileDown, Loader2, FileSignature, CheckCircle, Pencil, Save, LineChart, Target, ChevronDown } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { SavingsChart } from "@/components/SavingsChart";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { ProposalDocument } from "../proposal/ProposalDocument";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useFormContext } from "react-hook-form";
import type { WizardFormData } from "./Wizard";
import { AnimatePresence, motion } from "framer-motion";

const COMPANY_DATA_KEY = "companyData";
const CUSTOMIZATION_KEY = "proposalCustomization";

interface Step2ResultsProps {
  results: SolarCalculationResult;
  proposalId: string;
  clientData: ClientFormData | null;
  onBack: () => void;
  onRecalculate: (newResults: SolarCalculationResult) => void;
  onSave: () => void;
  onGoToDataInput: () => void;
  isEditing: boolean;
}

export function Step2Results({ 
  results, 
  proposalId,
  clientData,
  onBack, 
  onRecalculate, 
  onSave, 
  onGoToDataInput, 
  isEditing 
}: Step2ResultsProps) {
  const { toast } = useToast();
  const formMethods = useFormContext<WizardFormData>();
  
  const [isExporting, setIsExporting] = useState(false);
  
  // State for the editable document details
  const [proposalDate, setProposalDate] = useState<Date>(new Date());
  const [proposalValidity, setProposalValidity] = useState<Date>(addDays(new Date(), 20));

  // State for AI Refinement
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);

  // State for advanced analysis visibility
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  useEffect(() => {
    // Automatically update validity date when proposal date changes
    setProposalValidity(addDays(proposalDate, 20));
  }, [proposalDate]);

  const paybackYears = results.financeiro.payback_simples_anos;
  const paybackText = isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anos` : "N/A";
  
  const tirValue = results.financeiro.tir_percentual;
  const tirText = isFinite(tirValue) ? `${formatNumber(tirValue, 2)}%` : "N/A";

  const handleExportPdf = async () => {
    setIsExporting(true);
    
    try {
      const companyData: CompanyFormData | null = JSON.parse(localStorage.getItem(COMPANY_DATA_KEY) || 'null');
      const customizationData = localStorage.getItem(CUSTOMIZATION_KEY);
      const customization: CustomizationSettings | null = customizationData ? JSON.parse(customizationData) : defaultCustomization;
      const formData = formMethods.getValues().calculationInput;

      if (!companyData) {
        toast({
          title: "Empresa não configurada",
          description: "Por favor, configure os dados da sua empresa na página 'Minha Empresa' antes de exportar.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }
      
      const docToRender = (
        <ProposalDocument
          results={results}
          formData={formData}
          companyData={companyData}
          clientData={clientData}
          customization={customization!}
          proposalId={proposalId}
          proposalDate={proposalDate}
          proposalValidity={proposalValidity}
        />
      );

      const htmlString = ReactDOMServer.renderToString(docToRender);
      
      sessionStorage.setItem('proposalHtmlToPrint', htmlString);
      
      const printWindow = window.open('/orcamento/imprimir', '_blank');
      if (printWindow) {
        printWindow.focus();
      } else {
        toast({
          title: "Bloqueador de Pop-up Ativado",
          description: "Por favor, desative o bloqueador de pop-ups para este site para gerar o PDF.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Failed to prepare for PDF export:", error);
      toast({
        title: "Erro ao Preparar para Exportação",
        description: "Não foi possível preparar os dados para o PDF. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };
  
  const handleAiRefinement = async () => {
    setIsRefining(true);
    setRefinedSuggestion(null);

    const data = formMethods.getValues();
    const response = await getRefinedSuggestions({
        calculationInput: data.calculationInput,
        billOfMaterials: data.billOfMaterials,
    });

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

  const handleApplySuggestion = () => {
    if (!refinedSuggestion) return;

    const { nova_quantidade_paineis } = refinedSuggestion.configuracao_otimizada;
    
    const bom = formMethods.getValues('billOfMaterials');
    const panelIndex = bom.findIndex(item => item.category === 'PAINEL_SOLAR');

    if (panelIndex !== -1) {
      formMethods.setValue(`billOfMaterials.${panelIndex}.quantity`, nova_quantidade_paineis);
      toast({
          title: "Sugestão Aplicada!",
          description: `Quantidade de painéis ajustada para ${nova_quantidade_paineis}. Recalcule para ver o impacto.`,
      });
      onGoToDataInput(); // Go back to the previous step
    } else {
        toast({ title: "Erro", description: "Nenhum painel solar encontrado na lista para aplicar a sugestão.", variant: "destructive" });
    }
    
    setRefinedSuggestion(null);
  };

  const totalCostFromBom = formMethods.watch('billOfMaterials').reduce((acc, item) => acc + (item.cost * item.quantity), 0);


  return (
    <>
      <div className="space-y-8 bg-background p-4 sm:p-0">
        <Card>
           <CardHeader>
            <CardTitle className="font-headline text-2xl">Sua Análise Financeira</CardTitle>
            <CardDescription>
             Esta é uma simulação com base nos dados fornecidos. Os valores são estimativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ResultCard
                  icon={<Wallet />}
                  title="Fatura Mensal SEM Sistema"
                  value={formatCurrency(results.conta_media_mensal_reais.antes)}
                />
                <ResultCard
                  icon={<TrendingUp />}
                  title="Fatura Mensal COM Sistema"
                  value={formatCurrency(results.conta_media_mensal_reais.depois)}
                  className="bg-accent/10 border-accent"
                />
                <ResultCard
                  icon={<DollarSign />}
                  title="Economia Média Mensal"
                  value={formatCurrency(results.financeiro.economia_mensal_reais)}
                />
                 <ResultCard
                  icon={<BarChart />}
                  title="Economia no 1º Ano"
                  value={formatCurrency(results.financeiro.economia_primeiro_ano)}
                  className="bg-accent/10 border-accent"
                />
              </div>
              <Separator className="my-6" />
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultCard
                    icon={<Zap />}
                    title="Sistema Sugerido"
                    value={`${results.dimensionamento.quantidade_modulos} painéis`}
                    description={`${formMethods.getValues().calculationInput.potencia_modulo_wp}Wp | ${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh/mês`}
                />
                <ResultCard
                  icon={<Calendar />}
                  title="Retorno (Payback)"
                  value={paybackText}
                  description="Período para o sistema se pagar"
                />
                <ResultCard
                  icon={<BarChart />}
                  title="Custo Total Estimado"
                  value={formatCurrency(results.financeiro.custo_sistema_reais)}
                  description="Valor do sistema + instalação"
                />
              </div>
               <Separator className="my-6" />

               {/* Advanced Analysis Toggle Button */}
               <div className="text-center">
                 <Button variant="link" onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}>
                    {showAdvancedAnalysis ? 'Ocultar Análise Avançada' : 'Mostrar Análise Avançada'}
                    <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", showAdvancedAnalysis && "rotate-180")} />
                 </Button>
               </div>
               
               {/* Advanced Analysis Section */}
               <AnimatePresence>
                {showAdvancedAnalysis && (
                  <motion.div
                    key="advanced-analysis"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-6">
                        <ResultCard
                            icon={<LineChart />}
                            title="Valor Presente Líquido (VPL)"
                            value={formatCurrency(results.financeiro.vpl_reais)}
                            description="Traz a valor presente o fluxo de caixa futuro"
                        />
                        <ResultCard
                            icon={<Target />}
                            title="Taxa Interna de Retorno (TIR)"
                            value={tirText}
                            description="Rentabilidade anual do investimento"
                        />
                    </div>
                   </motion.div>
                )}
                </AnimatePresence>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Projeção de Economia Acumulada</CardTitle>
                <CardDescription>Este gráfico mostra como sua economia cresce ao longo de 25 anos.</CardDescription>
            </CardHeader>
            <CardContent>
                <SavingsChart annualSavings={results.financeiro.economia_anual_reais} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <FileSignature />
                    Detalhes do Documento
                </CardTitle>
                <CardDescription>
                    Revise as informações de identificação e validade da proposta antes de a gerar.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="proposalId">ID da Proposta</Label>
                    <Input id="proposalId" value={proposalId || "A ser gerado"} disabled />
                </div>
                <div className="space-y-2">
                    <Label>Data do Documento</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !proposalDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {proposalDate ? format(proposalDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                            locale={ptBR}
                            mode="single"
                            selected={proposalDate}
                            onSelect={(date) => date && setProposalDate(date)}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Data de Vencimento</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !proposalValidity && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {proposalValidity ? format(proposalValidity, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                            locale={ptBR}
                            mode="single"
                            selected={proposalValidity}
                            onSelect={(date) => date && setProposalValidity(date)}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>

      </div>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            {isEditing && (
              <Button type="button" variant="outline" onClick={onGoToDataInput}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Dados
              </Button>
            )}

            <Button type="button" variant="outline" onClick={handleAiRefinement} disabled={isRefining}>
                {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Refinar com IA
            </Button>
            
            <Button type="button" onClick={onSave} disabled={isExporting}>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Atualizar Cotação" : "Salvar Cotação"}
            </Button>

            <Button type="button" onClick={handleExportPdf} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                {isExporting ? "A Preparar..." : "Gerar PDF"}
            </Button>
          </div>
      </div>
       <AlertDialog open={!!refinedSuggestion} onOpenChange={(isOpen) => !isOpen && setRefinedSuggestion(null)}>
        <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Sugestão de Dimensionamento
            </AlertDialogTitle>
            <AlertDialogDescription>
                Com base nos dados e produtos selecionados, este é o dimensionamento ideal para atender 100% do consumo.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
            {isRefining ? (
                    <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
            ) : refinedSuggestion && (
            <div className="space-y-6 text-sm">
                <div>
                    <h3 className="font-semibold mb-2 text-foreground">Análise do Engenheiro Virtual</h3>
                    <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{refinedSuggestion.analise_texto}</p>
                </div>
                
                <Separator />
                
                <div>
                    <h4 className="font-semibold text-foreground mb-4">Comparativo de Configuração</h4>
                    <div className="grid grid-cols-2 gap-x-6">
                        <div className="space-y-3">
                            <h5 className="font-medium text-muted-foreground">Sua Configuração</h5>
                                <ComparisonItem label="Painéis" value={`${formMethods.getValues('billOfMaterials').find(i => i.category === 'PAINEL_SOLAR')?.quantity} UN`} />
                                <ComparisonItem label="Custo Total" value={formatCurrency(totalCostFromBom)} />
                        </div>
                        <div className="space-y-3 rounded-md border border-primary bg-primary/5 p-4">
                                <h5 className="font-medium text-primary">Sugestão Otimizada</h5>
                                <ComparisonItem label="Painéis" value={`${refinedSuggestion.configuracao_otimizada.nova_quantidade_paineis} UN`} highlight />
                                <ComparisonItem label="Custo Total" value={formatCurrency(refinedSuggestion.configuracao_otimizada.novo_custo_total_reais)} highlight />
                                <ComparisonItem label="Payback" value={`${formatNumber(refinedSuggestion.configuracao_otimizada.novo_payback_anos, 1)} anos`} highlight />
                        </div>
                    </div>
                </div>

            </div>
            )}
        </div>
        <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setRefinedSuggestion(null)}>Ignorar</Button>
            <Button onClick={handleApplySuggestion}>
                <CheckCircle className="mr-2" />
                Aplicar e Voltar
            </Button>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

const defaultCustomization: CustomizationSettings = {
  colors: {
    primary: "#10B981",
    textOnPrimary: "#FFFFFF",
  },
  content: {
    showInvestmentTable: true,
    showFinancialSummary: true,
    showSystemPerformance: true,
    showTerms: true,
    showGenerationChart: false,
    showSavingsChart: true,
    showEnvironmentalImpact: false,
    showEquipmentDetails: false,
    showTimeline: false,
  },
};

const ComparisonItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-semibold text-base ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
);


    