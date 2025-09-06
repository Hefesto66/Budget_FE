
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
import { ArrowRight, Calculator } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

const concessionariaOptions = [
    { value: "Equatorial GO", label: "Equatorial - GO" },
    { value: "CHESP", label: "CHESP" },
];

const phaseOptions = [
    { value: "mono", label: "Monofásico" },
    { value: "bi", label: "Bifásico" },
    { value: "tri", label: "Trifásico" },
];

export function Step1DataInput({ isLoading }: { isLoading: boolean }) {
  const form = useFormContext();

  return (
    <div className="border p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="calculationInput.consumo_mensal_kwh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumo médio mensal (kWh) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 500" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calculationInput.valor_medio_fatura_reais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor médio da fatura (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 450.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="calculationInput.rede_fases"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Rede *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de rede" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {phaseOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="calculationInput.irradiacao_psh_kwh_m2_dia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Irradiação Solar Local (PSH) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ex: 5.7" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calculationInput.cip_iluminacao_publica_reais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Iluminação Pública (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ex: 25.50" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
         </div>
         
        <Accordion type="single" collapsible className="w-full mt-6">
            <AccordionItem value="advanced-params" className="border-t">
                <AccordionTrigger className="pt-4">
                    <span className="font-semibold text-primary">Parâmetros Avançados</span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-6 pt-4">
                        <div className="p-4 border rounded-md">
                             <h4 className="font-medium mb-4 text-foreground">Parâmetros de Perdas e Custos Adicionais</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <FormField control={form.control} name="calculationInput.fator_perdas_percent" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Fator de Perdas (%)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="calculationInput.custo_om_anual_reais" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Custo O&M Anual (R$)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="calculationInput.meta_compensacao_percent" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Meta de Compensação (%)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="flex justify-end pt-6">
            <Button type="submit" size="lg" disabled={isLoading} className="bg-transparent hover:bg-transparent text-transparent">
                {/* This button is hidden, form is submitted by parent */}
                Calcular e Adicionar
            </Button>
        </div>
    </div>
  );
}
