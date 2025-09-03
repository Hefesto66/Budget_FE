"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsDataPoint } from "@/types";
import { formatCurrency } from "@/lib/solar-calculations";
import { useTheme } from "next-themes"

interface SavingsChartProps {
  annualSavings: number;
}

export function SavingsChart({ annualSavings }: SavingsChartProps) {
  const data: SavingsDataPoint[] = Array.from({ length: 25 }, (_, i) => {
    const year = i + 1;
    return {
      year,
      "Economia Acumulada": annualSavings * year,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="year"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Ano ${value}`}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip
          cursor={{ fill: 'hsla(var(--accent), 0.1)' }}
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-sans)',
          }}
          formatter={(value) => [formatCurrency(Number(value)), 'Economia Acumulada']}
        />
        <Bar dataKey="Economia Acumulada" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
