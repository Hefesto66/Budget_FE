
"use client";

import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, UserPlus, ChevronsUpDown, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveLead, getClients, saveClient, type Client, addHistoryEntry, getStages, type Stage } from '@/lib/storage';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils";


const newLeadSchema = z.object({
  title: z.string().min(1, "O título do lead é obrigatório."),
  clientId: z.string().min(1, "É obrigatório selecionar um cliente."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  stage: z.string().min(1, "A etapa é obrigatória."),
});

type NewLeadFormData = z.infer<typeof newLeadSchema>;

export default function NewLeadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => {
    const unsubscribeClients = getClients((allClients) => {
        setClients(allClients);
    });

    async function fetchStages() {
        const allStages = await getStages();
        setStages(allStages.filter(s => !s.isWon && s.id !== 'perdido'));
    }

    fetchStages();

    return () => {
        unsubscribeClients();
    };
  }, []);
  
  const form = useForm<NewLeadFormData>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      title: "",
      clientId: "",
      value: 0,
      stage: 'qualificacao'
    },
  });

  const onSubmit = async (data: NewLeadFormData) => {
    setIsSaving(true);
    
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "Erro", description: "Cliente selecionado não é válido.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const newLead = { 
      title: data.title,
      value: data.value,
      stage: data.stage,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
    };
    
    const newLeadId = await saveLead(newLead);

    await addHistoryEntry({ 
      clientId: selectedClient.id, 
      text: `Nova oportunidade criada: "${data.title}"`, 
      type: 'log-lead',
      refId: newLeadId,
    });

    toast({
      title: "Sucesso!",
      description: "A nova oportunidade foi criada.",
    });

    router.push(`/crm/${newLeadId}`); 
  };
  
  const handleCreateNewClient = async () => {
    if (!newClientName.trim()) {
      toast({ title: "Erro", description: "O nome do cliente não pode ser vazio.", variant: "destructive" });
      return;
    }
    
    const newClientData: Partial<Client> = {
      name: newClientName.trim(),
      type: 'individual',
    };
    
    try {
        const newClientId = await saveClient(newClientData, { isNew: true });
        // O onSnapshot listener irá automaticamente atualizar a lista de clientes.
        // Apenas precisamos de selecionar o novo cliente.
        
        form.setValue("clientId", newClientId, { shouldValidate: true });
        setSelectedClientId(newClientId);
        
        setNewClientName("");
        setIsClientDialogOpen(false);
        setComboboxOpen(false);

        toast({ title: "Cliente Criado!", description: `${newClientName} foi adicionado à sua lista de clientes.` });

    } catch(error) {
        console.error("Failed to create client:", error);
        toast({ title: "Erro", description: "Não foi possível criar o novo cliente.", variant: "destructive" });
    }
  };

  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || "Selecione um cliente...";

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
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><UserPlus /> Criar Nova Oportunidade</CardTitle>
                <CardDescription>
                  Preencha as informações abaixo para adicionar uma nova oportunidade ao seu funil de vendas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Título da Oportunidade</Label>
                  <Input id="title" placeholder="Ex: Orçamento para Residência em Alphaville" {...form.register("title")} className="mt-2" />
                  {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Cliente</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={comboboxOpen}
                              className="w-full justify-between mt-2 font-normal"
                            >
                              {selectedClientName}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Pesquisar cliente..." />
                              <CommandList>
                                <CommandEmpty>
                                   <div className="p-4 text-sm">Nenhum cliente encontrado.</div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.name}
                                      onSelect={() => {
                                        form.setValue("clientId", client.id, { shouldValidate: true });
                                        setSelectedClientId(client.id);
                                        setComboboxOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {client.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        setIsClientDialogOpen(true);
                                        setComboboxOpen(false);
                                    }}
                                    className="text-primary cursor-pointer font-medium"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar novo cliente
                                </CommandItem>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {form.formState.errors.clientId && <p className="text-sm text-destructive mt-1">{form.formState.errors.clientId.message}</p>}
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
                            {stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                            ))}
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
                      Salvar Oportunidade
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
      
      {/* Dialog for creating a new client */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
             <DialogDescription>
                Adicione um novo cliente que será associado a esta oportunidade.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="new-client-name" className="sm:text-right">
                Nome
              </Label>
              <Input
                id="new-client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="col-span-1 sm:col-span-3"
                placeholder="Nome completo do cliente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateNewClient}>Salvar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
