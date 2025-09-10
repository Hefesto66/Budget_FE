
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, UploadCloud, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { saveCompanyData, getCompanyData, CompanyData } from "@/lib/storage"
import { Header } from "@/components/layout/Header"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useAuth } from "@/context/AuthContext"
import { setSuperUserRole } from "./actions"

const companySchema = z.object({
  logo: z.string().optional(),
  name: z.string().min(1, "O nome da empresa é obrigatório."),
  cnpj: z.string().min(1, "O CNPJ ou CPF é obrigatório."),
  email: z.string().email("Por favor, insira um e-mail válido."),
  phone: z.string().min(1, "O telefone é obrigatório."),
  address: z.string().min(1, "O endereço é obrigatório."),
})

export type CompanyFormData = z.infer<typeof companySchema>

function SuperUserAdmin() {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSetRole = async () => {
    if (!email) {
      toast({ title: 'Erro', description: 'Por favor, insira um email.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    const result = await setSuperUserRole(email);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
    setIsProcessing(false);
    setEmail('');
  };

  return (
    <Card className="mt-8 border-primary/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-xl">
          <ShieldCheck className="text-primary" /> Painel de Super Usuário
        </CardTitle>
        <CardDescription>
          Atribua o papel de Super Usuário a um utilizador para conceder permissões de administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="superuser-email">Email do Utilizador</Label>
            <Input
              id="superuser-email"
              type="email"
              placeholder="utilizador@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          <Button onClick={handleSetRole} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Promover
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MinhaEmpresaPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const { isSuperUser } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
      logo: "",
    },
  })

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const savedData = await getCompanyData();
            if (savedData) {
                form.reset(savedData);
                if (savedData.logo) {
                setLogoPreview(savedData.logo);
                }
            }
        } catch (error) {
            console.error("Failed to load company data from Firestore", error);
            toast({
                title: "Aviso",
                description: "Não foi possível carregar os dados da empresa.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [form, toast]);
  

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O logotipo não pode exceder 2MB.",
          variant: "destructive",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        form.setValue("logo", result);
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    setIsSaving(true)
    
    try {
        await saveCompanyData(data);
        toast({
          title: "Sucesso!",
          description: "Os dados da sua empresa foram salvos.",
        })
        router.push("/")
      } catch (error: any) {
         toast({
          title: "Erro ao Salvar",
          description: error.message || "Não foi possível salvar os dados no servidor.",
          variant: "destructive",
        })
      }
    setIsSaving(false)
  }
  
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Dados da Sua Empresa</CardTitle>
                <CardDescription>
                  Estas informações aparecerão no cabeçalho das suas propostas de orçamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Coluna 1: Identificação */}
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="logo-upload">Logotipo</Label>
                      <div className="mt-2">
                        <input
                          id="logo-upload"
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleLogoUpload}
                        />
                        <label
                          htmlFor="logo-upload"
                          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:bg-accent/50"
                        >
                          {logoPreview ? (
                            <>
                              <Image src={logoPreview} alt="Pré-visualização do logo" width={128} height={128} className="max-h-32 object-contain" />
                              <span className="mt-4 inline-block rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">Alterar</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-10 w-10 text-muted-foreground" />
                              <span className="mt-4 block font-medium text-foreground">
                                Clique para enviar ou arraste seu logotipo aqui
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Recomendado: PNG com fundo transparente, máx 2MB.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Empresa</Label>
                      <Input id="name" placeholder="Ex: Soluções Solares Ltda." {...form.register("name")} />
                      {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ ou CPF</Label>
                      <Input id="cnpj" placeholder="00.000.000/0001-00" {...form.register("cnpj")} />
                      {form.formState.errors.cnpj && <p className="text-sm text-destructive">{form.formState.errors.cnpj.message}</p>}
                    </div>
                  </div>

                  {/* Coluna 2: Contato */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail de Contato</Label>
                        <Input id="email" type="email" placeholder="contato@suaempresa.com" {...form.register("email")} />
                        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input id="phone" type="tel" placeholder="(62) 99999-9999" {...form.register("phone")} />
                        {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Endereço da Empresa</Label>
                        <Textarea id="address" placeholder="Rua, Nº, Bairro, Cidade - Estado, CEP" rows={4} {...form.register("address")} />
                        {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
                    </div>
                  </div>
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
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {isSuperUser && <SuperUserAdmin />}

        </div>
      </main>
    </div>
  )
}

export default function MinhaEmpresaPage() {
    return (
        <AuthGuard>
            <MinhaEmpresaPageContent />
        </AuthGuard>
    )
}

    