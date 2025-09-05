
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
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Simulador de Sistema Solar</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para obter uma estimativa personalizada. Os campos marcados com * são obrigatórios.
        </CardDescription>
      </CardHeader>
      <CardContent>
      <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
        {/* Seção de Consumo e Fatura */}
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg font-semibold">1. Consumo e Fatura</AccordionTrigger>
          <AccordionContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="consumo_mensal_kwh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumo médio mensal (kWh) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="ex: 500" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                        </FormControl>
                        <FormDescription>Encontre na sua conta de energia.</FormDescription>
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
                        <FormDescription>O valor total, em reais.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cip_iluminacao_publica_reais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Iluminação Pública (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="ex: 25.50" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                        </FormControl>
                        <FormDescription>Valor da CIP/COSIP na sua conta.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="adicional_bandeira_reais_kwh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo da Bandeira (R$/kWh)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="ex: 0.07" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                        </FormControl>
                        <FormDescription>Valor extra por kWh da bandeira atual.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção de Detalhes Técnicos */}
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-lg font-semibold">2. Detalhes Técnicos</AccordionTrigger>
          <AccordionContent className="pt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                      control={form.control}
                      name="concessionaria"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Concessionária *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecione a sua concessionária" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {concessionariaOptions.map((opt) => (
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
                        <FormDescription>Média de horas de sol pico.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Seção de Equipamentos e Custos */}
        <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">3. Equipamentos e Custos</AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
                {/* Módulos */}
                <h4 className="font-medium text-foreground">Módulos Fotovoltaicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="potencia_modulo_wp" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Potência do Módulo (Wp) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 550" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="preco_modulo_reais" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preço por Módulo (R$) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 750" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="quantidade_modulos" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade de Módulos</FormLabel>
                            <FormControl><Input type="number" placeholder="Automático" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)} /></FormControl>
                            <FormDescription>Deixe em branco para cálculo automático.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                {/* Inversor */}
                <h4 className="font-medium text-foreground">Inversor</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="eficiencia_inversor_percent" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Eficiência do Inversor (%) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 97" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="custo_inversor_reais" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custo do Inversor (R$) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 4000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                {/* Custos Adicionais e Perdas */}
                <h4 className="font-medium text-foreground">Custos Adicionais e Perdas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fator_perdas_percent" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fator de Perdas do Sistema (%) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 20" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                            <FormDescription>Perdas por sujeira, temperatura, etc.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="custo_fixo_instalacao_reais" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custo Fixo de Instalação (R$) *</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 2500" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                            <FormDescription>Mão de obra, projeto, etc.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="custo_om_anual_reais" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custo Anual de O&M (R$)</FormLabel>
                            <FormControl><Input type="number" placeholder="ex: 150" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                             <FormDescription>Custo de operação e manutenção.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end pt-8">
          <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading && <ArrowRight className="mr-2 h-5 w-5 animate-spin" />}
              {!isLoading && <>Calcular Economia <ArrowRight className="ml-2 h-5 w-5" /></>}
          </Button>
      </div>
      </CardContent>
    </Card>
  );
}
