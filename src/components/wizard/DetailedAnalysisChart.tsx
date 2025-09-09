
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PieChartIcon, BarChart3, Donut } from 'lucide-react';
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { SolarCalculationResult } from '@/types';
import type { WizardFormData } from './Wizard';

type DataType = "costs" | "projection";
type ChartType = "pie" | "donut" | "bar";

interface DetailedAnalysisChartProps {
  results: SolarCalculationResult;
  billOfMaterials: WizardFormData['billOfMaterials'];
}

export function DetailedAnalysisChart({ results, billOfMaterials }: DetailedAnalysisChartProps) {
  const [dataType, setDataType] = useState<DataType>("costs");
  const [chartType, setChartType] = useState<ChartType>("pie");

  const { data, config, chartComponent, isBarChart } = useMemo(() => {
    let data: any[] = [];
    let config: ChartConfig = {};
    let isBar = false;

    if (dataType === 'costs') {
      const panelCost = (billOfMaterials.find(i => i.category === 'PAINEL_SOLAR')?.cost || 0) * (billOfMaterials.find(i => i.category === 'PAINEL_SOLAR')?.quantity || 0);
      const inverterCost = (billOfMaterials.find(i => i.category === 'INVERSOR')?.cost || 0) * (billOfMaterials.find(i => i.category === 'INVERSOR')?.quantity || 0);
      const serviceCost = (billOfMaterials.find(i => i.category === 'SERVICO')?.cost || 0) * (billOfMaterials.find(i => i.category === 'SERVICO')?.quantity || 0);
      
      data = [
        { name: "Módulos", value: panelCost, fill: "var(--color-modules)" },
        { name: "Inversor", value: inverterCost, fill: "var(--color-inverter)" },
        { name: "Instalação", value: serviceCost, fill: "var(--color-service)" },
      ];
      config = {
        value: { label: "Custo", },
        modules: { label: "Módulos", color: "hsl(var(--chart-1))" },
        inverter: { label: "Inversor", color: "hsl(var(--chart-2))" },
        service: { label: "Instalação", color: "hsl(var(--chart-3))" },
      };
    } else { // dataType === 'projection'
      data = [
        { name: "Fatura SEM Sistema", value: results.conta_media_mensal_reais.antes, fill: "var(--color-oldBill)" },
        { name: "Fatura COM Sistema", value: results.conta_media_mensal_reais.depois, fill: "var(--color-newBill)" },
        { name: "Economia 1º Ano", value: results.financeiro.economia_primeiro_ano, fill: "var(--color-savings)" },
      ];
      config = {
        value: { label: "Valor", },
        oldBill: { label: "Fatura SEM Sistema", color: "hsl(var(--chart-5))" },
        newBill: { label: "Fatura COM Sistema", color: "hsl(var(--chart-4))" },
        savings: { label: "Economia 1º Ano", color: "hsl(var(--chart-1))" },
      };
    }

    if (chartType === 'bar' || dataType === 'projection') {
      isBar = true;
    }

    const pieChartComponent = (
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrency(Number(value))}/>} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={chartType === 'donut' ? 60 : 0} strokeWidth={2} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
    );

    const barChartComponent = (
       <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrency(Number(value))}/>} />
            <Bar dataKey="value" radius={4} />
       </BarChart>
    );

    return {
      data,
      config,
      chartComponent: isBar ? barChartComponent : pieChartComponent,
      isBarChart: isBar,
    };
  }, [dataType, chartType, results, billOfMaterials]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Explorador de Dados</CardTitle>
        <CardDescription>Analise os dados de forma interativa.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Visualizar Análise de:</label>
                <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="costs">Estrutura de Custos</SelectItem>
                        <SelectItem value="projection">Projeção Financeira (1º Ano)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium">Tipo de Gráfico:</label>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={chartType}
                    onValueChange={(v) => { if (v) setChartType(v as ChartType); }}
                    disabled={dataType === 'projection'}
                >
                    <ToggleGroupItem value="pie" aria-label="Gráfico de Pizza"><PieChartIcon className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="donut" aria-label="Gráfico de Rosquinha"><Donut className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="bar" aria-label="Gráfico de Barras"><BarChart3 className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>
          </div>
          <ChartContainer config={config} className="mx-auto aspect-square h-[250px] w-full">
             {chartComponent}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

