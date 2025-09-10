
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Loader2, Save } from "lucide-react";
import type { CustomizationSettings } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getCompanyData, saveProposalSettings } from "@/lib/storage";
import { AuthGuard } from "@/components/auth/AuthGuard";


const defaultSettings: CustomizationSettings = {
  colors: {
    primary: "#10B981",
    textOnPrimary: "#FFFFFF",
  },
  content: {
    showInvestmentTable: true,
    showPriceColumns: true,
    showFinancialSummary: true,
    showSystemPerformance: true,
    showSavingsChart: true,
    showAdvancedAnalysis: false,
    showNextSteps: false,
  },
  footer: {
    customText: "Condições de Pagamento: 50% de entrada, 50% na finalização da instalação.\nEsta proposta é válida por 20 dias.\n\n© 2024 Solaris. Todos os direitos reservados."
  }
};

function PersonalizarPropostaPageContent() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
        setIsLoading(true);
        try {
            const companyData = await getCompanyData();
            if (companyData && companyData.proposalSettings) {
                // Merge saved settings with defaults to ensure all keys exist
                setSettings(prev => ({
                    ...defaultSettings,
                    ...companyData.proposalSettings,
                    colors: { ...defaultSettings.colors, ...companyData.proposalSettings.colors },
                    content: { ...defaultSettings.content, ...companyData.proposalSettings.content },
                    footer: { ...defaultSettings.footer, ...companyData.proposalSettings.footer },
                }));
            }
        } catch (error) {
            console.error("Failed to load settings from Firestore", error);
            toast({ title: "Erro", description: "Não foi possível carregar as suas configurações.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    loadSettings();
  }, [toast]);
  
  const handleColorChange = (key: 'primary' | 'textOnPrimary', value: string) => {
    setSettings(prev => ({
        ...prev,
        colors: {
            ...prev.colors,
            [key]: value
        }
    }));
  };

  const handleContentToggle = (key: keyof CustomizationSettings['content'], value: boolean) => {
     setSettings(prev => ({
        ...prev,
        content: {
            ...prev.content,
            [key]: value
        }
    }));
  }

  const handleFooterChange = (value: string) => {
    setSettings(prev => ({
        ...prev,
        footer: {
            ...prev.footer,
            customText: value
        }
    }));
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProposalSettings(settings);
      toast({
        title: "Sucesso!",
        description: "Suas preferências de personalização foram salvas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="appearance">Aparência</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
            </TabsList>
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Identidade Visual da Proposta</CardTitle>
                  <CardDescription>
                    Escolha as cores que representam sua marca. Elas serão aplicadas nos títulos, cabeçalhos e detalhes do documento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="primaryColor">Cor Principal (cabeçalhos e totais)</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Input 
                                  id="primaryColor" 
                                  type="color" 
                                  value={settings.colors.primary}
                                  onChange={(e) => handleColorChange('primary', e.target.value)}
                                  className="h-10 w-12 p-1" 
                                />
                                <Input 
                                  type="text" 
                                  value={settings.colors.primary}
                                  onChange={(e) => handleColorChange('primary', e.target.value)}
                                  className="font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="textColor">Cor do Texto dos Títulos</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Input 
                                  id="textColor" 
                                  type="color" 
                                  value={settings.colors.textOnPrimary}
                                  onChange={(e) => handleColorChange('textOnPrimary', e.target.value)}
                                  className="h-10 w-12 p-1" 
                                />
                                <Input 
                                  type="text" 
                                  value={settings.colors.textOnPrimary}
                                  onChange={(e) => handleColorChange('textOnPrimary', e.target.value)}
                                  className="font-mono"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Preview do Cabeçalho</Label>
                        <div className="mt-2 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-lg">NOME DA SUA EMPRESA</p>
                                <div 
                                    className="px-4 py-2 rounded-md" 
                                    style={{ backgroundColor: settings.colors.primary }}
                                >
                                    <p className="font-extrabold text-2xl" style={{ color: settings.colors.textOnPrimary }}>
                                        LOGO
                                    </p>
                                </div>
                            </div>
                        </div>
                         <p className="mt-2 text-xs text-muted-foreground">O logo e nome da sua empresa substituirão este exemplo.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Gerir Secções da Proposta</CardTitle>
                  <CardDescription>
                    Ative ou desative as secções que você deseja exibir no PDF final.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ContentSwitch
                        id="showInvestmentTable"
                        label="Exibir Tabela de Investimento"
                        description="Mostra a tabela detalhada com os custos de módulos, inversor e instalação."
                        checked={settings.content.showInvestmentTable}
                        onCheckedChange={(val) => handleContentToggle('showInvestmentTable', val)}
                    />
                    {/* Switch para colunas de preço, só faz sentido se a tabela estiver visível */}
                    {settings.content.showInvestmentTable && (
                        <ContentSwitch
                            id="showPriceColumns"
                            label="Exibir Colunas de Preço na Tabela"
                            description="Ative para mostrar as colunas 'Preço Unit.' e 'Preço Total' na tabela de investimento."
                            checked={settings.content.showPriceColumns}
                            onCheckedChange={(val) => handleContentToggle('showPriceColumns', val)}
                            className="ml-10"
                        />
                    )}
                    <ContentSwitch
                        id="showFinancialSummary"
                        label="Exibir Resumo Financeiro"
                        description="Mostra o card com a economia mensal, anual e o tempo de retorno (Payback)."
                        checked={settings.content.showFinancialSummary}
                        onCheckedChange={(val) => handleContentToggle('showFinancialSummary', val)}
                    />
                    <ContentSwitch
                        id="showSystemPerformance"
                        label="Exibir Desempenho do Sistema"
                        description="Mostra o card com a potência do sistema e a geração média mensal de energia."
                        checked={settings.content.showSystemPerformance}
                        onCheckedChange={(val) => handleContentToggle('showSystemPerformance', val)}
                    />
                     <ContentSwitch
                        id="showAdvancedAnalysis"
                        label="Exibir Análise de Investimento Avançada"
                        description="Mostra o bloco com os valores de VPL (Valor Presente Líquido) e TIR (Taxa Interna de Retorno)."
                        checked={settings.content.showAdvancedAnalysis}
                        onCheckedChange={(val) => handleContentToggle('showAdvancedAnalysis', val)}
                    />
                    <ContentSwitch
                        id="showSavingsChart"
                        label="Exibir Gráfico de Economia Acumulada"
                        description="Mostra a projeção visual da economia ao longo de 25 anos. (Não interativo no PDF)"
                        checked={settings.content.showSavingsChart}
                        onCheckedChange={(val) => handleContentToggle('showSavingsChart', val)}
                    />
                </CardContent>
              </Card>

               <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Editor de Rodapé</CardTitle>
                  <CardDescription>
                    Insira aqui informações da sua empresa, termos de pagamento ou uma mensagem de agradecimento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Escreva aqui o texto do rodapé..."
                        value={settings.footer.customText}
                        onChange={(e) => handleFooterChange(e.target.value)}
                        rows={5}
                    />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Personalização
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ContentSwitchProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
}

function ContentSwitch({ id, label, description, checked, onCheckedChange, className }: ContentSwitchProps) {
    return (
        <div className={cn("flex items-center justify-between rounded-lg border p-4", className)}>
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-base">{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
            />
        </div>
    )
}

export default function PersonalizarPropostaPage() {
    return (
        <AuthGuard>
            <PersonalizarPropostaPageContent />
        </AuthGuard>
    )
}

    