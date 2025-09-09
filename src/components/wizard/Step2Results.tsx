
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getRefinedSuggestions } from "@/app/orcamento/actions";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Wallet, TrendingUp, DollarSign, BarChart, Zap, Calendar, FileDown, Loader2, FileSignature, CheckCircle, Pencil, Save, LineChart, Target, ChevronDown, Power, Wrench, Package } from "lucide-react";
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart } from "recharts"


const COMPANY_DATA_KEY = "companyData";
const CUSTOMIZATION_KEY = "proposalCustomization";

interface Step2ResultsProps {
  results: SolarCalculationResult;
  proposalId: string;
  clientData: ClientFormData | null;
  onBack: () => void;
  onSave: () => void;
  onGoToDataInput: () => void;
  isEditing: boolean;
}

export function Step2Results({ 
  results, 
  proposalId,
  clientData,
  onBack, 
  onSave, 
  onGoToDataInput, 
  isEditing 
}: Step2ResultsProps) {
  const { toast } = useToast();
  const formMethods = useFormContext<WizardFormData>();
  
  const [isExporting, setIsExporting] = useState(false);
  
  const [proposalDate, setProposalDate] = useState<Date>(new Date());
  const [proposalValidity, setProposalValidity] = useState<Date>(addDays(new Date(), 20));

  const [isRefining, setIsRefining] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);

  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const billOfMaterials = formMethods.watch('billOfMaterials');
  
  // Prepare data for the cost breakdown chart
  const costBreakdownData = [
    { component: "Módulos", value: (billOfMaterials.find(i => i.category === 'PAINEL_SOLAR')?.cost || 0) * (billOfMaterials.find(i => i.category === 'PAINEL_SOLAR')?.quantity || 0), fill: "var(--color-modules)" },
    { component: "Inversor", value: (billOfMaterials.find(i => i.category === 'INVERSOR')?.cost || 0) * (billOfMaterials.find(i => i.category === 'INVERSOR')?.quantity || 0), fill: "var(--color-inverter)" },
    { component: "Instalação", value: (billOfMaterials.find(i => i.category === 'SERVICO')?.cost || 0) * (billOfMaterials.find(i => i.category === 'SERVICO')?.quantity || 0), fill: "var(--color-installation)" },
  ];

  const chartConfig: ChartConfig = {
    value: { label: "Custo" },
    modules: { label: "Módulos", color: "hsl(var(--chart-1))" },
    inverter: { label: "Inversor", color: "hsl(var(--chart-2))" },
    installation: { label: "Instalação", color: "hsl(var(--chart-3))" },
  };

  useEffect(() => {
    setProposalValidity(addDays(proposalDate, 20));
  }, [proposalDate]);

  const paybackYears = results?.financeiro?.payback_simples_anos;
  const paybackText = isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anos` : "N/A";
  
  const tirValue = results?.financeiro?.tir_percentual;
  const tirText = isFinite(tirValue) ? `${formatNumber(tirValue, 2)}%` : "N/A";

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // ETAPA 1: VALIDAÇÃO DE SEGURANÇA
      // Garante que os resultados do cálculo existem antes de prosseguir.
      if (!results || !results.financeiro || !results.dimensionamento) {
          console.error("ERRO CRÍTICO: Tentativa de gerar PDF com dados de cálculo inválidos.", results);
          toast({
              title: "Erro ao Gerar PDF",
              description: "Os dados do cálculo parecem estar incompletos. Por favor, recalcule a proposta.",
              variant: "destructive"
          });
          setIsExporting(false);
          return;
      }
      
      // 2. Gather all data
      const companyData: CompanyFormData | null = JSON.parse(localStorage.getItem(COMPANY_DATA_KEY) || 'null');
      if (!companyData || !companyData.name) {
        toast({
          title: "Empresa não configurada",
          description: "Aceda a Definições > Minha Empresa para configurar os seus dados.",
          variant: "destructive"
        });
        setIsExporting(false);
        return;
      }

      const customization: CustomizationSettings = JSON.parse(localStorage.getItem(CUSTOMIZATION_KEY) || JSON.stringify(defaultCustomization));
      const formData = formMethods.getValues().calculationInput;

      const props = {
        results,
        formData,
        companyData,
        clientData: clientData || { name: "Cliente Final", document: "-", address: "-" },
        customization,
        proposalId,
        proposalDate: proposalDate,
        proposalValidity: proposalValidity,
      };

      // 3. Render component to HTML string
      const htmlString = ReactDOMServer.renderToString(<ProposalDocument {...props} />);

      // 4. Store in sessionStorage and open print view
      sessionStorage.setItem('proposalHtmlToPrint', htmlString);
      window.open('/orcamento/imprimir', '_blank');

    } catch (error: any) {
      console.error("Falha ao gerar o PDF:", error);
      toast({
        title: "Erro ao Gerar PDF",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <ResultCard
                  icon={<Wallet className="text-red-500" />}
                  title="Fatura Anterior"
                  value={formatCurrency(results.conta_media_mensal_reais.antes)}
                  description="Custo médio mensal s/ solar"
                />
                <ResultCard
                  icon={<TrendingUp className="text-green-500" />}
                  title="Nova Fatura Estimada"
                  value={formatCurrency(results.conta_media_mensal_reais.depois)}
                  description="Custo com energia solar"
                />
                <ResultCard
                  icon={<DollarSign className="text-green-500" />}
                  title="Economia Mensal"
                  value={formatCurrency(results.financeiro.economia_mensal_reais)}
                   description="Valor economizado por mês"
                />
                 <ResultCard
                  icon={<Calendar className="text-blue-500" />}
                  title="Retorno (Payback)"
                  value={paybackText}
                  description="Tempo para o sistema se pagar"
                />
            </div>
            
             <AnimatePresence>
                {showAdvancedAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <ResultCard
                          icon={<LineChart className="text-purple-500" />}
                          title="VPL (Valor Presente Líquido)"
                          value={formatCurrency(results.financeiro.vpl_reais)}
                          description="Lucro total do projeto em valor de hoje. VPL > 0 indica um bom investimento."
                        />
                        <ResultCard
                          icon={<Target className="text-orange-500" />}
                          title="TIR (Taxa Interna de Retorno)"
                          value={tirText}
                          description="Rentabilidade anual do seu investimento."
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center">
                <Button variant="link" onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}>
                    <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", showAdvancedAnalysis && "rotate-180")} />
                    {showAdvancedAnalysis ? 'Ocultar Análise Avançada' : 'Mostrar Análise Avançada'}
                </Button>
            </div>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Projeção de Economia Acumulada (25 anos)</CardTitle>
                </CardHeader>
                <CardContent>
                    <SavingsChart annualSavings={results.financeiro.economia_anual_reais} />
                </CardContent>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
             <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Sistema Sugerido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg"><Zap className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Potência Total</p>
                            <p className="font-bold text-lg">{`${formatNumber(results.dimensionamento.potencia_sistema_kwp, 2)} kWp`}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg"><Package className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Módulos</p>
                            <p className="font-bold text-lg">{`${results.dimensionamento.quantidade_modulos} x ${formMethods.getValues().calculationInput.potencia_modulo_wp}Wp`}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg"><Power className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Geração Estimada</p>
                            <p className="font-bold text-lg">{`${formatNumber(results.geracao.media_mensal_kwh, 0)} kWh/mês`}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Composição do Custo Total</CardTitle>
                    <CardDescription>{formatCurrency(results.financeiro.custo_sistema_reais)}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
                        <PieChart>
                             <ChartTooltip content={<ChartTooltipContent nameKey="component" hideLabel />} />
                            <Pie data={costBreakdownData} dataKey="value" nameKey="component" innerRadius={50} strokeWidth={2} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between items-center">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar e Editar Dados
          </Button>
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
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
                {isExporting ? "A Gerar..." : "Gerar PDF"}
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
