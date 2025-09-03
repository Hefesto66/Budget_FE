"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsDataPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useMemo } from "react";

interface SavingsChartProps {
  annualSavings: number;
}

export function SavingsChart({ annualSavings }: SavingsChartProps) {
  const { resolvedTheme } = useTheme();

  const data: SavingsDataPoint[] = Array.from({ length: 25 }, (_, i) => {
    const year = i + 1;
    return {
      year,
      "Economia Acumulada": annualSavings * year,
    };
  });

  const chartColors = useMemo(() => {
    // These values are the HSL variables from globals.css
    return {
        grid: "hsl(var(--border))",
        text: "hsl(var(--muted-foreground))",
        tooltipBg: "hsl(var(--background))",
        tooltipBorder: "hsl(var(--border))",
        bar: "hsl(var(--primary))",
        accent: "hsla(var(--accent), 0.1)"
    }
  }, []);


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3, 3" stroke={chartColors.grid} />
        <XAxis
          dataKey="year"
          stroke={chartColors.text}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Ano ${value}`}
        />
        <YAxis
          stroke={chartColors.text}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip
          cursor={{ fill: chartColors.accent }}
          contentStyle={{
            background: chartColors.tooltipBg,
            border: `1px solid ${chartColors.tooltipBorder}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-sans)',
          }}
          formatter={(value) => [formatCurrency(Number(value)), 'Economia Acumulada']}
        />
        <Bar dataKey="Economia Acumulada" fill={chartColors.bar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
