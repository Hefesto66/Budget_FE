
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
              name="consumo_mensal_kwh"
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
              name="valor_medio_fatura_reais"
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
                name="rede_fases"
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
                name="irradiacao_psh_kwh_m2_dia"
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
                name="cip_iluminacao_publica_reais"
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
                        {/* Módulos */}
                        <div className="p-4 border rounded-md">
                            <h4 className="font-medium mb-4 text-foreground">Detalhes dos Módulos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="potencia_modulo_wp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Potência do Módulo (Wp)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="preco_modulo_reais" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Preço por Módulo (R$)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>

                        {/* Inversor */}
                        <div className="p-4 border rounded-md">
                            <h4 className="font-medium mb-4 text-foreground">Detalhes do Inversor</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="custo_inversor_reais" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Custo do Inversor (R$)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="eficiencia_inversor_percent" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Eficiência do Inversor (%)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="quantidade_inversores" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Quantidade de Inversores</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>

                        {/* Custos e Perdas */}
                        <div className="p-4 border rounded-md">
                             <h4 className="font-medium mb-4 text-foreground">Custos e Perdas do Sistema</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <FormField control={form.control} name="fator_perdas_percent" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Fator de Perdas (%)</FormLabel>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="custo_fixo_instalacao_reais" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Custo de Instalação (R$)</FormLabel>
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
            <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading && <Calculator className="mr-2 h-5 w-5 animate-spin" />}
                {!isLoading && <><Calculator className="mr-2 h-5 w-5" /> Calcular e Adicionar</>}
            </Button>
        </div>
    </div>
  );
}
