"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCATIONS, PANEL_MODELS } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export function Step1DataInput() {
  const form = useFormContext();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Vamos começar?</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para obter uma estimativa personalizada para o seu sistema de energia solar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="consumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumo médio mensal (kWh)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 500" {...field} />
                  </FormControl>
                  <FormDescription>Encontre na sua conta de energia.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor médio da conta (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 450" {...field} />
                  </FormControl>
                  <FormDescription>O valor médio mensal que você paga.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sua região</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a sua região" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormDescription>Isso afeta a estimativa de geração.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="panelModel"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Painel Solar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo do painel" />
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
                    <FormDescription>Define a potência e o custo.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
                Calcular Economia
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
