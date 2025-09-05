
"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, UserPlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const newLeadSchema = z.object({
  title: z.string().min(1, "O título do lead é obrigatório."),
  clientName: z.string().min(1, "O nome do cliente é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  stage: z.string().min(1, "A etapa é obrigatória."),
});

type NewLeadFormData = z.infer<typeof newLeadSchema>;

export default function NewLeadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<NewLeadFormData>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      title: "",
      clientName: "",
      value: 0,
      stage: 'qualificacao'
    },
  });

  const onSubmit = async (data: NewLeadFormData) => {
    setIsSaving(true);
    
    // Simulate saving to a database
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("New Lead Data:", data);

    toast({
      title: "Sucesso!",
      description: "O novo lead foi criado.",
    });

    // In a real app, you'd get the new lead's ID and redirect there
    router.push('/crm/lead-001'); 
    setIsSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
            <div className="mb-6">
                 <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><UserPlus /> Criar Novo Lead</CardTitle>
                <CardDescription>
                  Preencha as informações abaixo para adicionar uma nova oportunidade ao seu funil de vendas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Título do Lead</Label>
                  <Input id="title" placeholder="Ex: Orçamento para Residência em Alphaville" {...form.register("title")} className="mt-2" />
                  {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="clientName">Nome do Cliente</Label>
                        <Input id="clientName" placeholder="Ex: Sr. João Silva" {...form.register("clientName")} className="mt-2" />
                        {form.formState.errors.clientName && <p className="text-sm text-destructive mt-1">{form.formState.errors.clientName.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="value">Valor Estimado (R$)</Label>
                        <Input id="value" type="number" placeholder="25000" {...form.register("value")} className="mt-2" />
                        {form.formState.errors.value && <p className="text-sm text-destructive mt-1">{form.formState.errors.value.message}</p>}
                    </div>
                </div>

                 <div>
                    <Label htmlFor="stage">Etapa do Funil</Label>
                     <Select defaultValue="qualificacao" onValueChange={(value) => form.setValue('stage', value)}>
                        <SelectTrigger id="stage" className="w-full mt-2">
                            <SelectValue placeholder="Selecione a etapa inicial" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="qualificacao">Qualificação</SelectItem>
                            <SelectItem value="proposta">Proposta Enviada</SelectItem>
                            <SelectItem value="negociacao">Negociação</SelectItem>
                        </SelectContent>
                    </Select>
                     {form.formState.errors.stage && <p className="text-sm text-destructive mt-1">{form.formState.errors.stage.message}</p>}
                </div>

              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Lead
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
