"use client";

import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from "@/types";
import { ResultCard } from "@/components/ResultCard";
import { SavingsChart } from "@/components/SavingsChart";
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
import { getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { Zap, Calendar, DollarSign, BarChart, ArrowLeft, Sparkles, Download, Share2, Wallet, TrendingUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { CompanyFormData } from "@/app/minha-empresa/page";
import { ProposalDocument } from "../proposal/ProposalDocument";

interface Step2ResultsProps {
  results: SolarCalculationResult;
  onBack: () => void;
  formData: any;
  clientData: ClientFormData | null;
}

const COMPANY_DATA_KEY = "companyData";
const CUSTOMIZATION_KEY = "proposalCustomization";

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
  },
};

export function Step2Results({ results, onBack, formData, clientData }: Step2ResultsProps) {
  const { toast } = useToast();
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [customization, setCustomization] = useState<CustomizationSettings>(defaultCustomization);

  useEffect(() => {
    try {
      const savedCompanyData = localStorage.getItem(COMPANY_DATA_KEY);
      if (savedCompanyData) {
        setCompanyData(JSON.parse(savedCompanyData));
      }
      const savedCustomization = localStorage.getItem(CUSTOMIZATION_KEY);
      if (savedCustomization) {
        setCustomization(JSON.parse(savedCustomization));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const paybackYears = results.payback_simples_anos;
  const paybackText = isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anos` : "N/A";

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    const pdfContainer = document.getElementById("pdf-container");
    
    if (pdfContainer) {
       // Temporarily make it visible for rendering
      pdfContainer.style.display = 'block';
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px'; // Move off-screen
      
      try {
        const canvas = await html2canvas(pdfContainer, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let width = pdfWidth;
        let height = width / ratio;

        if (height > pdfHeight) {
          height = pdfHeight;
          width = height * ratio;
        }
        
        const xOffset = (pdfWidth - width) / 2;
        const yOffset = (pdfHeight - height) / 2;

        pdf.addImage(imgData, "PNG", xOffset, yOffset, width, height);
        pdf.save("orcamento_solar_fe.pdf");
      } catch (error) {
        toast({
          title: "Erro ao gerar PDF",
          description: "Houve um problema ao tentar exportar o orçamento. Tente novamente.",
          variant: "destructive",
        });
        console.error(error);
      } finally {
         // Hide it again
        pdfContainer.style.display = 'none';
      }
    }
    setIsGeneratingPdf(false);
  };
  
  const handleShare = (platform: 'whatsapp' | 'email') => {
    const text = `Confira meu orçamento de energia solar da FE Sistema Solar!\n\nEconomia Anual Estimada: ${formatCurrency(results.economia_anual_reais)}\nRetorno do Investimento: ${paybackText}\n\nFaça sua simulação também!`;
    const encodedText = encodeURIComponent(text);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    } else {
      window.open(`mailto:?subject=Orçamento Energia Solar&body=${encodedText}`, '_blank');
    }
  };

  const handleAiRefinement = async () => {
    setIsRefining(true);
    setRefinedSuggestion(null);

    const inputForAI = {
      consumption: formData.consumo_mensal_kwh,
      bill: results.conta_media_mensal_reais.antes,
      location: `${formData.concessionaria}`, // Simplified location
      initialPanelQuantity: results.dimensionamento.quantidade_modulos,
      panelModel: `${formData.potencia_modulo_wp}W`,
      totalCostEstimate: results.financeiro.custo_sistema_reais,
      estimatedAnnualSavings: results.economia_anual_reais,
      paybackPeriod: results.payback_simples_anos,
    };
    
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `
          Consumo: ${inputForAI.consumption} kWh
          Conta: R$ ${inputForAI.bill}
          Localização: ${inputForAI.location}
          Painéis iniciais: ${inputForAI.initialPanelQuantity}
          Modelo: ${inputForAI.panelModel}
          Custo: R$ ${inputForAI.totalCostEstimate}
          Economia anual: R$ ${inputForAI.estimatedAnnualSavings}
          Payback: ${inputForAI.paybackPeriod} anos

          Gere uma sugestão refinada de configuração de painéis solares, no formato JSON conforme instruções originais.
        `
      })
    });
    const data = await response.json();
    if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      setRefinedSuggestion(JSON.parse(data.candidates[0].content.parts[0].text));
    } else {
      toast({
        title: "Erro na Sugestão",
        description: "Não foi possível obter uma sugestão da IA. Tente novamente.",
        variant: "destructive",
      });
    }

    setIsRefining(false);
  };


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
                    description={`${formData.potencia_modulo_wp}Wp | ${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh/mês`}
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
            <CardTitle className="font-headline text-2xl">Projeção de Economia (25 anos)</CardTitle>
             <CardDescription>
              Veja como sua economia acumulada cresce ao longo da vida útil do sistema solar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsChart annualSavings={results.economia_anual_reais} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            <Button type="button" variant="secondary" onClick={handleAiRefinement} disabled={isRefining}>
                <Sparkles className={`mr-2 h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
                {isRefining ? "Analisando..." : "Refinar com IA"}
            </Button>
            <div className="flex gap-4">
                <Button type="button" onClick={() => handleShare('whatsapp')} variant="outline"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
                <Button type="button" onClick={handleExportPdf} disabled={isGeneratingPdf || !companyData}>
                    <Download className={`mr-2 h-4 w-4 ${isGeneratingPdf ? 'animate-pulse' : ''}`} />
                    {isGeneratingPdf ? "Gerando..." : "Exportar PDF"}
                </Button>
            </div>
          </div>
      </div>

      {/* Hidden container for PDF rendering */}
      <div id="pdf-container" style={{ display: 'none' }}>
        {companyData && (
          <ProposalDocument
            results={results}
            formData={formData}
            companyData={companyData}
            clientData={clientData}
            customization={customization}
          />
        )}
      </div>


      <AlertDialog open={!!refinedSuggestion} onOpenChange={() => setRefinedSuggestion(null)}>
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
                    <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{refinedSuggestion.reasoning}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Configuração Inicial</h4>
                      <ComparisonItem label="Painéis" value={`${results.dimensionamento.quantidade_modulos} de ${formData.potencia_modulo_wp}Wp`} />
                      <ComparisonItem label="Custo Total" value={formatCurrency(results.financeiro.custo_sistema_reais)} />
                      <ComparisonItem label="Payback" value={paybackText} />
                  </div>
                  <div className="space-y-4 rounded-md border border-primary bg-primary/5 p-4">
                      <h4 className="font-semibold text-primary">Configuração Otimizada</h4>
                      <ComparisonItem label="Painéis" value={`${refinedSuggestion.refinedPanelQuantity} de ${refinedSuggestion.refinedPanelModel}`} highlight />
                      <ComparisonItem label="Custo Total" value={formatCurrency(refinedSuggestion.refinedTotalCostEstimate)} highlight />
                      <ComparisonItem label="Payback" value={`${formatNumber(refinedSuggestion.refinedPaybackPeriod, 1)} anos`} highlight />
                  </div>
                </div>

              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const ComparisonItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
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
