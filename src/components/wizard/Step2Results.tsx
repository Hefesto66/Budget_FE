"use client";

import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { CalculationResults, FormData, RefinedSuggestion } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/solar-calculations";
import { ResultCard } from "@/components/ResultCard";
import { SavingsChart } from "@/components/SavingsChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { PANEL_MODELS } from "@/lib/constants";
import { getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { Zap, Calendar, DollarSign, BarChart, ArrowLeft, RefreshCw, Sparkles, Download, Share2, Info } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface Step2ResultsProps {
  results: CalculationResults;
  onRecalculate: () => void;
  onBack: () => void;
  formData: FormData;
}

export function Step2Results({ results, onRecalculate, onBack, formData }: Step2ResultsProps) {
  const form = useFormContext();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<RefinedSuggestion | null>(null);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    const input = reportRef.current;
    if (input) {
      try {
        const canvas = await html2canvas(input, { scale: 2, backgroundColor: "hsl(var(--background))" });
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
        const width = pdfWidth - 40; // with margin
        const height = width / ratio;

        pdf.addImage(imgData, "PNG", 20, 20, width, height);
        pdf.save("orcamento_solar_ecocalc.pdf");
      } catch (error) {
        toast({
          title: "Erro ao gerar PDF",
          description: "Houve um problema ao tentar exportar o orçamento. Tente novamente.",
          variant: "destructive",
        });
        console.error(error);
      }
    }
    setIsGeneratingPdf(false);
  };
  
  const handleShare = (platform: 'whatsapp' | 'email') => {
    const text = `Confira meu orçamento de energia solar da EcoCalc Solar!\n\nEconomia Anual Estimada: ${formatCurrency(results.annualSavings)}\nRetorno do Investimento: ${results.paybackPeriod.toFixed(1)} anos\n\nFaça sua simulação também!`;
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
      energyConsumption: formData.consumption,
      energyBill: formData.bill,
      location: formData.location,
      initialPanelQuantity: results.panelQuantity,
      panelModel: results.panelModel,
      totalCostEstimate: results.totalCost,
      estimatedSavings: results.annualSavings,
      paybackPeriod: results.paybackPeriod,
    };
    
    const response = await getRefinedSuggestions(inputForAI);
    if(response.success && response.data) {
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


  return (
    <>
      <div ref={reportRef} className="space-y-8 bg-background p-4 sm:p-0">
        <Card>
           <CardHeader>
            <CardTitle className="font-headline text-2xl">Seu Orçamento Personalizado</CardTitle>
            <CardDescription>
              Aqui está a análise baseada nos dados que você forneceu. Você pode ajustar a configuração abaixo e recalcular.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ResultCard
                  icon={<DollarSign />}
                  title="Economia Anual"
                  value={formatCurrency(results.annualSavings)}
                  description={`~ ${formatCurrency(results.monthlySavings)} / mês`}
                />
                <ResultCard
                  icon={<Calendar />}
                  title="Retorno (Payback)"
                  value={`${formatNumber(results.paybackPeriod, 1)} anos`}
                  description="Período para o sistema se pagar"
                />
                <ResultCard
                  icon={<Zap />}
                  title="Sistema Sugerido"
                  value={`${results.panelQuantity} painéis`}
                  description={`${results.panelModel} | ${formatNumber(results.monthlyProduction)} kWh/mês`}
                />
                <ResultCard
                  icon={<BarChart />}
                  title="Custo Estimado"
                  value={formatCurrency(results.totalCost)}
                  description="Valor total do sistema instalado"
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
            <SavingsChart annualSavings={results.annualSavings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Ajustar Configuração</CardTitle>
            <CardDescription>
              Altere a quantidade ou o modelo dos painéis e clique em "Recalcular" para ver o impacto nos resultados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="panelQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Painéis</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="panelModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo do Painel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PANEL_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onRecalculate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalcular
              </Button>
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
            <Button type="button" variant="secondary" onClick={handleAiRefinement} disabled={isRefining}>
                <Sparkles className={`mr-2 h-4 w-4 ${isRefining ? 'animate-spin' : ''}`} />
                {isRefining ? "Analisando..." : "Refinar com IA"}
            </Button>
            <div className="flex gap-4">
                <Button type="button" onClick={() => handleShare('whatsapp')} variant="outline"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
                <Button type="button" onClick={handleExportPdf} disabled={isGeneratingPdf}>
                    <Download className={`mr-2 h-4 w-4 ${isGeneratingPdf ? 'animate-pulse' : ''}`} />
                    {isGeneratingPdf ? "Gerando..." : "Exportar PDF"}
                </Button>
            </div>
          </div>
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
                      <ComparisonItem label="Painéis" value={`${results.panelQuantity} de ${results.panelModel}`} />
                      <ComparisonItem label="Custo Total" value={formatCurrency(results.totalCost)} />
                      <ComparisonItem label="Payback" value={`${formatNumber(results.paybackPeriod, 1)} anos`} />
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
