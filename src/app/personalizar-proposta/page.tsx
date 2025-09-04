
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Save } from "lucide-react";
import Image from "next/image";
import type { CustomizationSettings } from "@/types";

const CUSTOMIZATION_KEY = "proposalCustomization";

const defaultSettings: CustomizationSettings = {
  colors: {
    primary: "#10B981", // Um verde vibrante como padrão
    textOnPrimary: "#FFFFFF",
  },
  content: {
    showInvestmentTable: true,
    showFinancialSummary: true,
    showSystemPerformance: true,
    showTerms: true,
  },
};

export default function PersonalizarPropostaPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedSettings = localStorage.getItem(CUSTOMIZATION_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
  }, []);
  
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

  const handleSave = () => {
    try {
      localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(settings));
      toast({
        title: "Sucesso!",
        description: "Suas preferências de personalização foram salvas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações no seu navegador.",
        variant: "destructive",
      });
    }
  };
  
  if (!isClient) {
    return null; // ou um componente de loading
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
                        {/* Seletor de Cor Principal */}
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
                         {/* Seletor de Cor do Texto */}
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
                    {/* Preview em Tempo Real */}
                    <div>
                        <Label>Preview do Cabeçalho</Label>
                        <div className="mt-2 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-lg">AX BUDGET</p>
                                <div 
                                    className="px-4 py-2 rounded-md" 
                                    style={{ backgroundColor: settings.colors.primary }}
                                >
                                    <p className="font-extrabold text-2xl" style={{ color: settings.colors.textOnPrimary }}>
                                        AX
                                    </p>
                                </div>
                            </div>
                        </div>
                         <p className="mt-2 text-xs text-muted-foreground">O logo da sua empresa será usado no lugar de "AX BUDGET".</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Seções da Proposta</CardTitle>
                  <CardDescription>
                    Ative ou desative as seções que você deseja exibir na proposta final.
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
                        id="showTerms"
                        label="Exibir Termos e Condições no Rodapé"
                        description="Inclui a linha de texto sobre condições de pagamento e direitos reservados no final do documento."
                        checked={settings.content.showTerms}
                        onCheckedChange={(val) => handleContentToggle('showTerms', val)}
                    />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
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
}

function ContentSwitch({ id, label, description, checked, onCheckedChange }: ContentSwitchProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
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
