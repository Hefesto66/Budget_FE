
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
                    <Input type="number" placeholder="ex: 500" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
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
                    <Input type="number" placeholder="ex: 450.00" {...field} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value))}/>
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
                      <Input type="number" placeholder="ex: 5.7" {...field} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value))}/>
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
                      <Input type="number" placeholder="ex: 25.50" {...field} value={field.value || 0} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
         </div>
         
        <Accordion type="single" collapsible className="w-full mt-6" defaultValue="advanced-params">
            <AccordionItem value="advanced-params" className="border-t">
                <AccordionTrigger className="pt-4">
                    <span className="font-semibold text-primary">Parâmetros Técnicos e de Custo</span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 pt-4">
                       <FormField control={form.control} name="calculationInput.fator_perdas_percent" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Fator de Perdas (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="calculationInput.custo_om_anual_reais" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Custo O&M Anual (R$)</FormLabel>
                                 <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="calculationInput.meta_compensacao_percent" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Meta de Compensação (%)</FormLabel>
                                 <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="calculationInput.inflacao_energetica_anual_percent" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Inflação Energética Anual (%)</FormLabel>
                                 <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormDescription className="text-xs">Estimativa do reajuste anual da tarifa de energia.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="calculationInput.degradacao_anual_paineis_percent" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Degradação Anual dos Painéis (%)</FormLabel>
                                 <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormDescription className="text-xs">Perda de eficiência anual projetada para os painéis solares.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="calculationInput.taxa_minima_atratividade_percent" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Taxa Mín. de Atratividade (%)</FormLabel>
                                 <FormControl>
                                    <Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormDescription className="text-xs">Usada para o cálculo do VPL. Rendimento mínimo esperado de um investimento.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
