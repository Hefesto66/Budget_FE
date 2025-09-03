"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsDataPoint } from "@/types";
import { formatCurrency } from "@/lib/solar-calculations";
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
        grid: "var(--border)",
        text: "var(--muted-foreground)",
        tooltipBg: "var(--background)",
        tooltipBorder: "var(--border)",
        bar: "var(--primary)",
        accent: "var(--accent)"
    }
  }, [resolvedTheme]);


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={`hsl(${chartColors.grid})`} />
        <XAxis
          dataKey="year"
          stroke={`hsl(${chartColors.text})`}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Ano ${value}`}
        />
        <YAxis
          stroke={`hsl(${chartColors.text})`}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip
          cursor={{ fill: `hsla(${chartColors.accent}, 0.1)` }}
          contentStyle={{
            background: `hsl(${chartColors.tooltipBg})`,
            border: `1px solid hsl(${chartColors.tooltipBorder})`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-sans)',
          }}
          formatter={(value) => [formatCurrency(Number(value)), 'Economia Acumulada']}
        />
        <Bar dataKey="Economia Acumulada" fill={`hsl(${chartColors.bar})`} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
