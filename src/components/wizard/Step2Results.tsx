
"use client";

import { useState, useEffect } from "react";
import ReactDOMServer from 'react-dom/server';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings, SolarCalculationInput } from "@/types";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getRefinedSuggestions, getCalculation } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Wallet, TrendingUp, DollarSign, BarChart, Zap, Calendar, FileDown, Loader2, FileSignature, CheckCircle, Pencil } from "lucide-react";
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
import { useSearchParams } from "next/navigation";


const COMPANY_DATA_KEY = "companyData";
const CUSTOMIZATION_KEY = "proposalCustomization";

interface Step2ResultsProps {
  results: SolarCalculationResult;
  onBack: () => void;
  onRecalculate: (newResults: SolarCalculationResult) => void;
  onSave: (proposalId: string) => void;
  onGoToDataInput: () => void;
  isEditing: boolean;
}

export function Step2Results({ results, onBack, onRecalculate, onSave, onGoToDataInput, isEditing }: Step2ResultsProps) {
  const { toast } = useToast();
  const formMethods = useFormContext<SolarCalculationInput>();
  const searchParams = useSearchParams();
  
  const [isRefining, setIsRefining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);

  // State for the editable document details
  const [proposalId, setProposalId] = useState('');
  const [proposalDate, setProposalDate] = useState<Date>(new Date());
  const [proposalValidity, setProposalValidity] = useState<Date>(addDays(new Date(), 20));

  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    if (quoteId) {
      setProposalId(quoteId);
    } else {
      // For new quotes, we display a placeholder. The real ID is generated on save.
      setProposalId("A ser gerado");
    }
  }, [searchParams]);

  useEffect(() => {
    // Automatically update validity date when proposal date changes
    setProposalValidity(addDays(proposalDate, 20));
  }, [proposalDate]);

  const paybackYears = results.payback_simples_anos;
  const paybackText = isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anos` : "N/A";

  const handleAiRefinement = async () => {
    setIsRefining(true);
    setRefinedSuggestion(null);

    const formData = formMethods.getValues();
    const response = await getRefinedSuggestions(formData);

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
  
    const { quantidade_modulos } = refinedSuggestion.configuracao_otimizada;
    formMethods.setValue("quantidade_modulos", quantidade_modulos);
  
    const currentFormData = formMethods.getValues();
    
    // Mostra um toast de carregamento
    const { id: toastId } = toast({
      title: "Aplicando Sugestão...",
      description: "Recalculando o orçamento com a nova configuração.",
    });

    const result = await getCalculation(currentFormData);

    if (result.success && result.data) {
      onRecalculate(result.data);
      toast({
        id: toastId,
        title: "Sucesso!",
        description: "Orçamento atualizado com a sugestão da IA.",
      });
    } else {
      toast({
        id: toastId,
        title: "Erro ao Recalcular",
        description: result.error || "Não foi possível aplicar a sugestão.",
        variant: "destructive",
      });
    }
  
    setRefinedSuggestion(null); // Fecha o dialog
  };


  const handleExportPdf = async () => {
    setIsExporting(true);
    
    try {
      const companyData: CompanyFormData | null = JSON.parse(localStorage.getItem(COMPANY_DATA_KEY) || 'null');
      const customizationData = localStorage.getItem(CUSTOMIZATION_KEY);
      const customization: CustomizationSettings | null = customizationData ? JSON.parse(customizationData) : defaultCustomization;
      const formData = formMethods.getValues();

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
          clientData={null} // TODO: Pass client data if available
          customization={customization!}
          proposalId={proposalId}
          proposalDate={proposalDate}
          proposalValidity={proposalValidity}
        />
      );

      const htmlString = ReactDOMServer.renderToString(docToRender);
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '800px'; 
      container.innerHTML = htmlString;
      document.body.appendChild(container);
      
      const images = Array.from(container.querySelectorAll('img'));
      const imagePromises = images.map(img => new Promise(resolve => {
        if (img.complete) {
            resolve(true);
        } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        }
      }));

      await Promise.all(imagePromises);

      const canvas = await html2canvas(container, {
          scale: 2, 
          useCORS: true,
          logging: false,
      });

      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`proposta-${proposalId}.pdf`);

    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        title: "Erro ao Exportar",
        description: "Não foi possível gerar o PDF. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };
  
  const handleSave = () => {
    // The actual ID is passed from the Wizard component on save.
    // Here we just pass a placeholder or the existing ID.
    onSave(proposalId);
  }


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
                  value={formatCurrency(results.economia_mensal_reais)}
                />
                 <ResultCard
                  icon={<BarChart />}
                  title="Economia no 1º Ano"
                  value={formatCurrency(results.economia_primeiro_ano)}
                  className="bg-accent/10 border-accent"
                />
              </div>
              <Separator className="my-6" />
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultCard
                    icon={<Zap />}
                    title="Sistema Sugerido"
                    value={`${results.dimensionamento.quantidade_modulos} painéis`}
                    description={`${formMethods.getValues().potencia_modulo_wp}Wp | ${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh/mês`}
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
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Projeção de Economia Acumulada</CardTitle>
                <CardDescription>Este gráfico mostra como sua economia cresce ao longo de 25 anos.</CardDescription>
            </CardHeader>
            <CardContent>
                <SavingsChart annualSavings={results.economia_anual_reais} />
            </CardContent>
        </Card>

        {/* Document Details Card */}
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
                    <Input id="proposalId" value={proposalId} onChange={(e) => setProposalId(e.target.value)} disabled />
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
            {/* Hidden button to be triggered by the parent Wizard component */}
            <Button id="save-quote-button" onClick={handleSave} className="hidden" />

            {isEditing && (
              <Button type="button" variant="outline" onClick={onGoToDataInput}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Dados de Consumo
              </Button>
            )}

            <Button type="button" variant="secondary" onClick={handleAiRefinement} disabled={isRefining}>
                <Sparkles className={`mr-2 h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
                {isRefining ? "Analisando..." : "Refinar com IA"}
            </Button>
            <Button type="button" onClick={handleExportPdf} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                {isExporting ? "Exportando..." : "Exportar PDF"}
            </Button>
          </div>
      </div>
      
      <AlertDialog open={!!refinedSuggestion} onOpenChange={(isOpen) => !isOpen && setRefinedSuggestion(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Sugestão Otimizada por IA
            </AlertDialogTitle>
            <AlertDialogDescription>
              Analisamos seu perfil e encontramos uma configuração que pode ser mais vantajosa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
            {isRefining ? <SuggestionSkeleton /> : refinedSuggestion && (
              <div className="space-y-6 text-sm">
                <div>
                    <h3 className="font-semibold mb-2 text-foreground">Análise da IA</h3>
                    <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{refinedSuggestion.analise_texto}</p>
                </div>
                
                <Separator />
                
                <div>
                    <h4 className="font-semibold text-foreground mb-4">Comparativo da Configuração</h4>
                    <div className="grid grid-cols-2 gap-x-6">
                        <div className="space-y-3">
                            <h5 className="font-medium text-muted-foreground">Configuração Atual</h5>
                             <ComparisonItem label="Painéis" value={`${results.dimensionamento.quantidade_modulos} de ${formMethods.getValues().potencia_modulo_wp}Wp`} />
                             <ComparisonItem label="Custo Total" value={formatCurrency(results.financeiro.custo_sistema_reais)} />
                             <ComparisonItem label="Payback" value={paybackText} />
                        </div>
                        <div className="space-y-3 rounded-md border border-primary bg-primary/5 p-4">
                             <h5 className="font-medium text-primary">Sugestão Otimizada</h5>
                             <ComparisonItem label="Painéis" value={`${refinedSuggestion.configuracao_otimizada.quantidade_modulos} de ${formMethods.getValues().potencia_modulo_wp}Wp`} highlight />
                             <ComparisonItem label="Custo Total" value={formatCurrency(refinedSuggestion.configuracao_otimizada.custo_total)} highlight />
                             <ComparisonItem label="Payback" value={`${formatNumber(refinedSuggestion.configuracao_otimizada.payback, 1)} anos`} highlight />
                        </div>
                    </div>
                </div>

              </div>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setRefinedSuggestion(null)}>Cancelar</Button>
            <Button onClick={handleApplySuggestion} disabled={isRefining}>
                <CheckCircle className="mr-2" />
                Aplicar Sugestão
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const ComparisonItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-semibold text-base ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
)

const SuggestionSkeleton = () => (
    <div className="space-y-6">
        <div>
            <h3 className="font-semibold mb-2 text-foreground">Análise da IA</h3>
            <Skeleton className="h-24 w-full" />
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Configuração Inicial</h4>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-2/3" />
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold text-primary">Configuração Otimizada</h4>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-2/3" />
            </div>
        </div>
    </div>
);


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
