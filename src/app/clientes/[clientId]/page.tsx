
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Building, User, Upload, Trash2, X, MessageSquare, Send, Bot, FileText, Forward } from "lucide-react";
import { Header } from "@/components/layout/Header";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import Image from 'next/image';
import { getClientById, saveClient, type Client, getSalespersons, getPaymentTerms, getPriceLists, Salesperson, PaymentTerm, PriceList, addHistoryEntry, HistoryEntry } from '@/lib/storage';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


const clientFormSchema = z.object({
  name: z.string().min(1, "O nome do cliente é obrigatório."),
  type: z.enum(['individual', 'company']).default('individual'),
  photo: z.string().nullable().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  street: z.string().optional(),
  cityState: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Sales fields
  salespersonId: z.string().optional(),
  paymentTermId: z.string().optional(),
  priceListId: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

// Predefined tags for suggestion
const ALL_TAGS = [
    { value: "cliente-premium", label: "Cliente Premium" },
    { value: "fornecedor", label: "Fornecedor" },
    { value: "parceiro", label: "Parceiro" },
    { value: "revenda", label: "Revenda" },
    { value: "grande-potencial", label: "Grande Potencial" },
];

const HistoryIcon = ({ type }: { type: HistoryEntry['type'] }) => {
    switch (type) {
        case 'note': return <MessageSquare className="h-5 w-5 text-yellow-500" />;
        case 'log-lead': return <User className="h-5 w-5 text-blue-500" />;
        case 'log-quote': return <FileText className="h-5 w-5 text-green-500" />;
        case 'log-stage': return <Forward className="h-5 w-5 text-purple-500" />;
        default: return <Bot className="h-5 w-5 text-gray-500" />;
    }
}

export default function ClientForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const isEditing = clientId !== 'novo';
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  
  const [tagInput, setTagInput] = useState("");
  const [open, setOpen] = useState(false);

  // State for sales dropdowns
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [clientHistory, setClientHistory] = useState<HistoryEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      type: 'individual',
      photo: null,
      cnpj: "",
      phone: "",
      email: "",
      website: "",
      street: "",
      cityState: "",
      zip: "",
      country: "Brasil",
      tags: [],
      salespersonId: "",
      paymentTermId: "",
      priceListId: ""
    },
  });

  const clientType = form.watch("type");
  const selectedTags = form.watch("tags") || [];
  
  const handleSetTags = (newTags: string[]) => {
    form.setValue("tags", newTags);
  };

  const fetchClientData = () => {
    if (isEditing) {
      const existingClient = getClientById(clientId);
      if (existingClient) {
        form.reset(existingClient);
        if (existingClient.photo) {
          setPhotoPreview(existingClient.photo);
        }
        setClientHistory(existingClient.history || []);
      } else {
        toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" });
        router.push('/clientes');
        return;
      }
    }
    setIsClientLoaded(true);
  }

  useEffect(() => {
    // Load data for sales dropdowns
    setSalespersons(getSalespersons());
    setPaymentTerms(getPaymentTerms());
    setPriceLists(getPriceLists());
    fetchClientData();
  }, [clientId, isEditing, form, router, toast]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Arquivo muito grande", description: "A foto não pode exceder 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        form.setValue("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue("photo", null);
  }

  const onSubmit = (data: ClientFormData) => {
    setIsSaving(true);
    
    // Check for changes to log in history
    const originalClient = isEditing ? getClientById(clientId) : null;
    let changesLog = "Cliente criado.";
    if(originalClient) {
        const changedFields = Object.keys(data).filter(key => key !== 'tags' && originalClient[key as keyof Client] !== data[key as keyof ClientFormData]);
        if(changedFields.length > 0) {
            changesLog = `Cliente atualizado: ${changedFields.join(', ')}.`;
        } else {
            changesLog = ""; // No changes to log
        }
    }

    const clientToSave: Client = {
      id: isEditing ? clientId : `client-${Date.now()}`,
      ...data,
      tags: selectedTags,
      history: clientHistory,
    };
    
    saveClient(clientToSave);
    
    if(changesLog) {
        addHistoryEntry(clientToSave.id, changesLog, 'log');
    }
    
    toast({
      title: "Sucesso!",
      description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
    });
    
    if (!isEditing) {
        router.push(`/clientes/${clientToSave.id}`);
    } else {
        fetchClientData(); // Re-fetch to update history
    }
    
    setIsSaving(false);
  };
  
  const handleAddNote = () => {
    if (!newNote.trim() || !isEditing) return;
    addHistoryEntry(clientId, newNote, 'note');
    setNewNote("");
    fetchClientData(); // Refresh history
  };

  const filteredTags = useMemo(() => {
    return ALL_TAGS.filter(
      (tag) => !selectedTags.includes(tag.value)
    );
  }, [selectedTags]);

  if (!isClientLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Save className="mr-2 h-5 w-5" />
                )}
                Salvar
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Photo Upload */}
                                <div className="w-full md:w-48 flex-shrink-0">
                                <input
                                    id="photo-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handlePhotoUpload}
                                    />
                                    <Label htmlFor="photo-upload" className="cursor-pointer">
                                        <div className="relative group w-full h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-center text-muted-foreground hover:bg-accent/50 transition-colors">
                                        {photoPreview ? (
                                            <>
                                                <Image src={photoPreview} alt="Pré-visualização do cliente" layout="fill" objectFit="cover" className="rounded-md" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-sm">Alterar Foto</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                {clientType === 'company' ? <Building className="h-10 w-10 mb-2" /> : <User className="h-10 w-10 mb-2" />}
                                                <span>Adicionar Foto</span>
                                            </div>
                                        )}
                                        </div>
                                    </Label>
                                    {photoPreview && (
                                        <Button type="button" variant="ghost" size="sm" className="w-full mt-2 text-destructive hover:text-destructive" onClick={removePhoto}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remover Foto
                                        </Button>
                                    )}
                                </div>

                                {/* Main Info */}
                                <div className="flex-1">
                                    <RadioGroup
                                        defaultValue={form.getValues('type')}
                                        onValueChange={(value: 'individual' | 'company') => form.setValue('type', value)}
                                        className="mb-4 flex items-center gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="individual" id="r1" />
                                        <Label htmlFor="r1">Pessoa Física</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="company" id="r2" />
                                        <Label htmlFor="r2">Empresa</Label>
                                        </div>
                                    </RadioGroup>
                                    <Input
                                        placeholder="Nome do Cliente..."
                                        {...form.register("name")}
                                        className="h-14 text-2xl font-bold border-0 shadow-none px-2 focus-visible:ring-0"
                                    />
                                    {form.formState.errors.name && <p className="text-sm text-destructive px-2">{form.formState.errors.name.message}</p>}
                                    
                                    <Tabs defaultValue="main" className="mt-4">
                                        <TabsList>
                                            <TabsTrigger value="main">Principal</TabsTrigger>
                                            <TabsTrigger value="sales">Vendas & Compras</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="main" className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            {clientType === 'company' && (
                                                <div className="space-y-1">
                                                    <Label htmlFor="cnpj">CNPJ</Label>
                                                    <Input id="cnpj" placeholder="Documento de identificação" {...form.register("cnpj")} />
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input id="phone" type="tel" placeholder="(00) 00000-0000" {...form.register("phone")} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" placeholder="contato@email.com" {...form.register("email")} />
                                                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="website">Website</Label>
                                                <Input id="website" type="url" placeholder="https://www.meusite.com" {...form.register("website")} />
                                                {form.formState.errors.website && <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="street">Rua</Label>
                                                <Input id="street" placeholder="Rua, Av..." {...form.register("street")} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="cityState">Cidade, Estado</Label>
                                                <Input id="cityState" placeholder="Ex: Goiânia, GO" {...form.register("cityState")} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="zip">CEP</Label>
                                                <Input id="zip" placeholder="00000-000" {...form.register("zip")} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="country">País</Label>
                                                <Input id="country" placeholder="Ex: Brasil" {...form.register("country")} />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <Label>Etiquetas</Label>
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-start font-normal h-auto min-h-10">
                                                            <div className="flex gap-1 flex-wrap">
                                                                {selectedTags.length > 0 ? (
                                                                    selectedTags.map(tag => (
                                                                        <Badge key={tag} variant="secondary">
                                                                            {ALL_TAGS.find(t => t.value === tag)?.label || tag}
                                                                            <button
                                                                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleSetTags(selectedTags.filter(t => t !== tag));
                                                                                }}
                                                                            >
                                                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                                            </button>
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-muted-foreground">Selecione as etiquetas...</span>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                        <Command>
                                                            <CommandInput
                                                                placeholder="Pesquisar ou criar etiqueta..."
                                                                value={tagInput}
                                                                onValueChange={setTagInput}
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                                                                        if (newTag && !selectedTags.includes(newTag)) {
                                                                            handleSetTags([...selectedTags, newTag]);
                                                                        }
                                                                        setTagInput("");
                                                                    }}
                                                                    >
                                                                        Criar etiqueta: "{tagInput}"
                                                                    </Button>
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {filteredTags.map((tag) => (
                                                                        <CommandItem
                                                                            key={tag.value}
                                                                            onSelect={() => {
                                                                                handleSetTags([...selectedTags, tag.value]);
                                                                                setTagInput("");
                                                                            }}
                                                                        >
                                                                            {tag.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        </TabsContent>
                                        <TabsContent value="sales" className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-1">
                                                <Label>Vendedor</Label>
                                                <Select onValueChange={(value) => form.setValue('salespersonId', value)} defaultValue={form.getValues('salespersonId')}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um vendedor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {salespersons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Termos de Pagamento</Label>
                                                <Select onValueChange={(value) => form.setValue('paymentTermId', value)} defaultValue={form.getValues('paymentTermId')}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um termo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {paymentTerms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Lista de Preços</Label>
                                                <Select onValueChange={(value) => form.setValue('priceListId', value)} defaultValue={form.getValues('priceListId')}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione uma lista de preços" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {priceLists.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Chatter / History Column */}
                <div className="lg:col-span-1">
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center gap-2">
                                <MessageSquare /> Histórico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col h-[calc(100%-72px)]">
                           {isEditing ? (
                             <>
                                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                                  {clientHistory.length > 0 ? (
                                    clientHistory.map((entry) => (
                                        <div key={entry.id} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <HistoryIcon type={entry.type} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-foreground">{entry.text}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(new Date(entry.timestamp), "dd/MM/yyyy HH:mm")}</p>
                                            </div>
                                        </div>
                                    ))
                                  ) : (
                                    <div className="text-center text-sm text-muted-foreground py-8">
                                        Nenhuma atividade registrada.
                                    </div>
                                  )}
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                    <Textarea 
                                        placeholder="Adicionar uma nota interna..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="mb-2"
                                    />
                                    <Button type="button" size="sm" className="w-full" onClick={handleAddNote} disabled={!newNote.trim()}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Enviar Nota
                                    </Button>
                                </div>
                             </>
                           ) : (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                Salve o cliente para ver o histórico de atividades.
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
      </main>
    </div>
  );
}

    