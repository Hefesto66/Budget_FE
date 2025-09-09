
"use client";

import { useState } from "react";
import type { SolarCalculationResult, ClientFormData, CustomizationSettings } from "@/types";
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
import { ArrowLeft, Sparkles, Wallet, TrendingUp, DollarSign, Zap, Calendar, FileDown, Loader2, CheckCircle, LineChart, Target, ChevronDown, Power, Package, Printer } from "lucide-react";
import type { SuggestRefinedPanelConfigOutput } from "@/ai/flows/suggest-refined-panel-config";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { SavingsChart } from "@/components/SavingsChart";
import { useFormContext } from "react-hook-form";
import type { WizardFormData } from "./Wizard";
import { AnimatePresence, motion } from "framer-motion";
import { DetailedAnalysisChart } from "./DetailedAnalysisChart";


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
    showSavingsChart: true,
    showCashflowTable: false,
    showAdvancedAnalysis: false,
    showNextSteps: false,
  },
  footer: {
    customText: "Condições de Pagamento: 50% de entrada, 50% na finalização da instalação.\nEsta proposta é válida por 20 dias.\n\n© 2024 Solaris. Todos os direitos reservados."
  }
};


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
  
  const [isRefining, setIsRefining] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<SuggestRefinedPanelConfigOutput | null>(null);

  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const billOfMaterials = formMethods.watch('billOfMaterials');
  
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
  
  const handleExportPdf = () => {
    setIsPrinting(true);
    toast({ title: "A preparar a proposta...", description: "A janela de impressão será aberta." });

    const printWindow = window.open('/proposal-template', '_blank');
    if (!printWindow) {
        toast({ title: "Erro", description: "Não foi possível abrir a janela de impressão. Verifique se o seu navegador está a bloquear pop-ups.", variant: "destructive" });
        setIsPrinting(false);
        return;
    }

    const messageHandler = (event: MessageEvent) => {
        if (event.source === printWindow && event.data === 'ready-for-data') {
            try {
                const companyDataStr = localStorage.getItem(COMPANY_DATA_KEY);
                const customizationStr = localStorage.getItem(CUSTOMIZATION_KEY);

                if (!companyDataStr) {
                    toast({ title: "Empresa não configurada", description: "Aceda a Definições > Minha Empresa para preencher os seus dados.", variant: "destructive" });
                    printWindow.close(); // Fecha a janela de impressão se houver um erro
                    return;
                }

                const companyData = JSON.parse(companyDataStr);
                const customization = customizationStr ? JSON.parse(customizationStr) : defaultCustomization;
                const formData = formMethods.getValues();
                const finalClientData = clientData || { name: "Cliente Final", document: "-", address: "-" };

                const dataForPrint = {
                    type: 'PROPOSAL_DATA',
                    payload: {
                        results: results,
                        formData: formData.calculationInput,
                        billOfMaterials: formData.billOfMaterials,
                        companyData: companyData,
                        clientData: finalClientData,
                        customization: customization,
                        proposalId: proposalId,
                        // As datas são convertidas para ISO string para serem serializáveis
                        proposalDate: new Date().toISOString(),
                        proposalValidity: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
                    }
                };

                printWindow.postMessage(dataForPrint, '*');

            } catch (error: any) {
                console.error("Erro ao preparar dados para impressão:", error);
                toast({
                    title: "Erro ao Preparar Impressão",
                    description: error.message || "Ocorreu um erro desconhecido.",
                    variant: "destructive",
                });
                printWindow.close();
            } finally {
                // Remove o ouvinte após o uso
                window.removeEventListener('message', messageHandler);
                setIsPrinting(false);
            }
        }
    };

    window.addEventListener('message', messageHandler);
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
      onGoToDataInput();
    } else {
        toast({ title: "Erro", description: "Nenhum painel solar encontrado na lista para aplicar a sugestão.", variant: "destructive" });
    }
    
    setRefinedSuggestion(null);
  };

  const totalCostFromBom = formMethods.watch('billOfMaterials').reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  const paybackYears = results?.financeiro?.payback_simples_anos;
  const paybackText = isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anos` : "N/A";
  
  const tirValue = results?.financeiro?.tir_percentual;
  const tirText = isFinite(tirValue) && tirValue !== Infinity ? `${formatNumber(tirValue, 2)}%` : "N/A";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
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

            <DetailedAnalysisChart results={results} billOfMaterials={billOfMaterials} />
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
            
            <Button type="button" onClick={onSave} disabled={isPrinting}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save mr-2 h-4 w-4"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {isEditing ? "Atualizar Cotação" : "Salvar Cotação"}
            </Button>

            <Button type="button" onClick={handleExportPdf} disabled={isPrinting}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Imprimir Proposta
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


const ComparisonItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-semibold text-base ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
);
