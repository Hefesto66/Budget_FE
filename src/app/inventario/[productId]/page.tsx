
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Package, Trash2, PlusCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getProductById, saveProduct, type Product, PRODUCT_TYPES, ProductType } from '@/lib/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const productFormSchema = z.object({
  name: z.string().min(1, "O nome do produto é obrigatório."),
  fabricante: z.string().optional(),
  type: z.enum(Object.keys(PRODUCT_TYPES) as [ProductType, ...ProductType[]], {
      errorMap: () => ({ message: 'Selecione um tipo de produto válido.'})
  }),
  salePrice: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
  unit: z.string().min(1, "A unidade de medida é obrigatória."),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ProductForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const isEditing = productId !== 'novo';
  
  const [isSaving, setIsSaving] = useState(false);
  const [isProductLoaded, setIsProductLoaded] = useState(false);

  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      fabricante: "",
      type: "OUTRO",
      salePrice: 0,
      unit: "UN",
      description: "",
      internalNotes: ""
    },
  });

  const productType = form.watch("type");

  useEffect(() => {
    if (isEditing) {
      const existingProduct = getProductById(productId);
      if (existingProduct) {
        const formData: ProductFormData = {
            ...existingProduct,
            fabricante: existingProduct.technicalSpecifications?.['Fabricante'] || '',
        };
        form.reset(formData);
        if (existingProduct.technicalSpecifications) {
            setSpecifications(existingProduct.technicalSpecifications);
        }
      } else {
        toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
        router.push('/inventario');
        return;
      }
    }
    setIsProductLoaded(true);
  }, [productId, isEditing, form, router, toast]);


  const onSubmit = (data: ProductFormData) => {
    setIsSaving(true);
    
    // Combine base specs with dynamic ones
    const finalSpecifications = { ...specifications };
    if (data.fabricante) {
        finalSpecifications['Fabricante'] = data.fabricante;
    } else {
        delete finalSpecifications['Fabricante'];
    }

    const productToSave: Product = {
      id: isEditing ? productId : `prod-${Date.now()}`,
      name: data.name,
      type: data.type,
      salePrice: data.salePrice,
      unit: data.unit,
      description: data.description,
      internalNotes: data.internalNotes,
      technicalSpecifications: finalSpecifications,
    };
    
    saveProduct(productToSave);
    
    toast({
      title: "Sucesso!",
      description: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
    });
    
    router.push('/inventario');
    
    setIsSaving(false);
  };

  const handleSpecChange = (key: string, value: string) => {
    setSpecifications(prev => ({ ...prev, [key]: value }));
  };

  if (!isProductLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
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
                Salvar Produto
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                <Package />
                                {isEditing ? "Editar Produto" : "Novo Produto"}
                            </CardTitle>
                            <CardDescription>
                                Preencha os detalhes do produto abaixo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Nome do Produto *</Label>
                                    <Input id="name" placeholder="Ex: Painel Solar 550W" {...form.register("name")} />
                                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="fabricante">Fabricante</Label>
                                    <Input id="fabricante" placeholder="Ex: Tongwei, Growatt" {...form.register("fabricante")} />
                                </div>
                                 <div className="space-y-1">
                                    <Label>Tipo de Produto *</Label>
                                    <Select onValueChange={(value: ProductType) => form.setValue('type', value)} defaultValue={form.getValues('type')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(PRODUCT_TYPES) as ProductType[]).map(key => (
                                                <SelectItem key={key} value={key}>{PRODUCT_TYPES[key]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="salePrice">Preço de Venda (R$) *</Label>
                                    <Input id="salePrice" type="number" placeholder="Ex: 750.00" {...form.register("salePrice")} />
                                    {form.formState.errors.salePrice && <p className="text-sm text-destructive">{form.formState.errors.salePrice.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="unit">Unidade de Medida *</Label>
                                    <Input id="unit" placeholder="Ex: UN, m², h" {...form.register("unit")} />
                                    {form.formState.errors.unit && <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>}
                                </div>
                            </div>
                            
                            {productType === 'PAINEL_SOLAR' && (
                                <div className="space-y-1">
                                    <Label htmlFor="spec-potencia">Potência (Wp)</Label>
                                    <Input id="spec-potencia" type="number" placeholder="Ex: 550" value={specifications['Potência (Wp)'] || ''} onChange={e => handleSpecChange('Potência (Wp)', e.target.value)} />
                                </div>
                            )}

                             {productType === 'INVERSOR' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <Label htmlFor="spec-potencia-inversor">Potência de Saída (kW)</Label>
                                        <Input id="spec-potencia-inversor" type="number" placeholder="Ex: 5" value={specifications['Potência de Saída (kW)'] || ''} onChange={e => handleSpecChange('Potência de Saída (kW)', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="spec-eficiencia">Eficiência (%)</Label>
                                        <Input id="spec-eficiencia" type="number" placeholder="Ex: 97.5" value={specifications['Eficiência (%)'] || ''} onChange={e => handleSpecChange('Eficiência (%)', e.target.value)} />
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-1">
                                <Label htmlFor="description">Descrição Pública</Label>
                                <Textarea id="description" placeholder="Esta descrição pode aparecer em cotações e outros documentos." {...form.register("description")} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="internalNotes">Notas Internas</Label>
                                <Textarea id="internalNotes" placeholder="Notas visíveis apenas para a sua equipe." {...form.register("internalNotes")} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
      </main>
    </div>
  );
}
