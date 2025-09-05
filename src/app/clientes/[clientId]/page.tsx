
"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Building, User, Upload, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import Image from 'next/image';
import { getClientById, saveClient, type Client } from '@/lib/storage';

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
});

type ClientFormData = z.infer<typeof clientFormSchema>;


export default function ClientForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const isEditing = clientId !== 'novo';
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
      country: "",
    },
  });

  useEffect(() => {
    setIsClient(true);
    if (isEditing) {
      const existingClient = getClientById(clientId);
      if (existingClient) {
        form.reset(existingClient);
        if (existingClient.photo) {
          setPhotoPreview(existingClient.photo);
        }
      } else {
          toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" });
          router.push('/clientes');
      }
    }
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
    
    const clientToSave: Client = {
      id: isEditing ? clientId : `client-${Date.now()}`,
      ...data
    };
    
    saveClient(clientToSave);
    
    toast({
      title: "Sucesso!",
      description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
    });
    
    router.push('/clientes');
    setIsSaving(false);
  };
  
  if (!isClient) return null; // Or a skeleton loader

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => router.push('/clientes')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Clientes
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
          
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
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
                            
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="street">Rua</Label>
                                    <Input id="street" placeholder="Rua, Av..." {...form.register("street")} />
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="cnpj">CNPJ / CPF</Label>
                                    <Input id="cnpj" placeholder="Documento de identificação" {...form.register("cnpj")} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cityState">Cidade, Estado</Label>
                                    <Input id="cityState" placeholder="Ex: Goiânia, GO" {...form.register("cityState")} />
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" type="tel" placeholder="(00) 00000-0000" {...form.register("phone")} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="zip">CEP</Label>
                                    <Input id="zip" placeholder="00000-000" {...form.register("zip")} />
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="contato@email.com" {...form.register("email")} />
                                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="country">País</Label>
                                    <Input id="country" placeholder="Ex: Brasil" {...form.register("country")} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" type="url" placeholder="https://www.meusite.com" {...form.register("website")} />
                                     {form.formState.errors.website && <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>}
                                </div>
                            </div>
                        </div>

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
                                        <User className="h-10 w-10 mb-2" />
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
                    </div>
                </CardContent>
            </Card>
        </form>
      </main>
    </div>
  );
}
