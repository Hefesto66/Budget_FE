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
    // This is a bit of a hack to get the CSS variables into the chart
    // In a real app, you'd likely have a more robust way to do this
    if (typeof window === "undefined") {
      return {
        grid: "hsl(var(--border))",
        text: "hsl(var(--muted-foreground))",
        tooltipBg: "hsl(var(--background))",
        tooltipBorder: "hsl(var(--border))",
        bar: "hsl(var(--primary))",
      };
    }
    const styles = getComputedStyle(document.documentElement);
    return {
        grid: styles.getPropertyValue('--border'),
        text: styles.getPropertyValue('--muted-foreground'),
        tooltipBg: styles.getPropertyValue('--background'),
        tooltipBorder: styles.getPropertyValue('--border'),
        bar: styles.getPropertyValue('--primary'),
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
          cursor={{ fill: 'hsla(var(--accent), 0.1)' }}
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
