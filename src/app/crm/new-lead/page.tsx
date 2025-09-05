
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
import { saveLead, getClients, saveClient, type Client, addHistoryEntry } from '@/lib/storage';
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
  
  // State for the combobox
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  // State for the "New Client" dialog
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => {
    // Load clients from storage when component mounts
    setClients(getClients());
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

    const newLeadId = `lead-${Date.now()}`;
    const newLead = { 
      id: newLeadId, 
      title: data.title,
      value: data.value,
      stage: data.stage,
      clientId: selectedClient.id, // Save client id
      clientName: selectedClient.name, // Save client name for display
    };
    
    saveLead(newLead);
    addHistoryEntry(selectedClient.id, `Novo lead criado: "${data.title}"`, 'log-lead');

    await new Promise(resolve => setTimeout(resolve, 500)); 

    toast({
      title: "Sucesso!",
      description: "O novo lead foi criado.",
    });

    router.push(`/crm/${newLeadId}`); 
    setIsSaving(false);
  };
  
  const handleCreateNewClient = () => {
    if (!newClientName.trim()) {
      toast({ title: "Erro", description: "O nome do cliente não pode ser vazio.", variant: "destructive" });
      return;
    }
    
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: newClientName,
      type: 'individual', // Default type
      history: [],
    };
    
    saveClient(newClient);
    addHistoryEntry(newClient.id, 'Cliente criado através do formulário de novo lead.', 'log');
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    
    form.setValue("clientId", newClient.id);
    setSelectedClientId(newClient.id);

    toast({ title: "Cliente Criado!", description: `${newClientName} foi adicionado à sua lista de clientes.` });
    
    setNewClientName("");
    setIsClientDialogOpen(false);
    setComboboxOpen(false); // Close combobox after selection
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
                                        form.setValue("clientId", client.id);
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
                                    onSelect={() => setIsClientDialogOpen(true)}
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
      
      {/* Dialog for creating a new client */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
             <DialogDescription>
                Adicione um novo cliente que será associado a este lead.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-client-name" className="text-right">
                Nome
              </Label>
              <Input
                id="new-client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="col-span-3"
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

    