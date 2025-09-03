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
import { ArrowRight } from "lucide-react";

const phaseOptions = [
    { value: "mono", label: "Monofásico" },
    { value: "bi", label: "Bifásico" },
    { value: "tri", label: "Trifásico" },
];

const concessionariaOptions = [
    { value: "Equatorial GO", label: "Equatorial - GO" },
    { value: "CHESP", label: "CHESP" },
];

const panelOptions = [
  { value: "550", label: "550W | Padrão" },
  { value: "670", label: "670W | Alta Eficiência" },
  { value: "450", label: "450W | Econômico" },
]

export function Step1DataInput({ isLoading }: { isLoading: boolean }) {
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
              name="consumo_mensal_kwh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumo médio mensal (kWh)</FormLabel>
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
                  <FormLabel>Valor médio da fatura (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 450.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                  </FormControl>
                  <FormDescription>O valor total, em reais.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
           <FormField
            control={form.control}
            name="rede_fases"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de Rede</FormLabel>
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
                <FormDescription>Consulte na sua conta de luz.</FormDescription>
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
                  <FormDescription>Valor da taxa CIP/COSIP na conta.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="irradiacao_psh_kwh_m2_dia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irradiação Solar Local (PSH)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 5.7" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                  </FormControl>
                   <FormDescription>Média de horas de sol pico.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="potencia_modulo_wp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Painel Solar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo do painel" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {panelOptions.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                            {model.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>Potência de cada painel.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <div className="grid grid-cols-1 gap-6">
            <FormField
                control={form.control}
                name="concessionaria"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Concessionária de Energia</FormLabel>
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
        </div>


        <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading && <ArrowRight className="mr-2 h-5 w-5 animate-spin" />}
                {!isLoading && <>Calcular Economia <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
