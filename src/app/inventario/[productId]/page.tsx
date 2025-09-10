
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
import { Loader2, Save, ArrowLeft, Package, Trash2, Upload, GitBranch, Sun, Wrench } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getProductById, saveProduct, type Product, PRODUCT_CATEGORIES, ProductCategory } from '@/lib/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Image from 'next/image';

const productFormSchema = z.object({
  name: z.string().min(1, "O nome do produto é obrigatório."),
  photo: z.string().nullable().optional(),
  fabricante: z.string().optional(),
  category: z.enum(Object.keys(PRODUCT_CATEGORIES) as [ProductCategory, ...ProductCategory[]], {
      errorMap: () => ({ message: 'Selecione uma categoria de produto válida.'})
  }),
  salePrice: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
  costPrice: z.coerce.number().min(0, "O preço de custo não pode ser negativo.").optional(),
  unit: z.string().min(1, "A unidade de medida é obrigatória."),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

const ProductIcon = ({ category }: { category: Product['category'] }) => {
    switch (category) {
        case 'PAINEL_SOLAR': return <Sun className="h-10 w-10 mb-2" />;
        case 'INVERSOR': return <GitBranch className="h-10 w-10 mb-2" />;
        case 'ESTRUTURA': return <Wrench className="h-10 w-10 mb-2" />;
        default: return <Package className="h-10 w-10 mb-2" />;
    }
}

export default function ProductForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const isEditing = productId !== 'novo';
  
  const [isSaving, setIsSaving] = useState(false);
  const [isProductLoaded, setIsProductLoaded] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      photo: null,
      fabricante: "",
      category: "OUTRO",
      salePrice: 0,
      costPrice: 0,
      unit: "UN",
      description: "",
      internalNotes: ""
    },
  });

  const productCategory = form.watch("category");

  useEffect(() => {
    async function loadProduct() {
        if (isEditing) {
          const existingProduct = await getProductById(productId);
          if (existingProduct) {
            const formData: ProductFormData = {
                name: existingProduct.name,
                photo: existingProduct.photo || null,
                fabricante: existingProduct.technicalSpecifications?.['Fabricante'] || '',
                category: existingProduct.category,
                salePrice: existingProduct.salePrice,
                costPrice: existingProduct.costPrice,
                unit: existingProduct.unit,
                description: existingProduct.description,
                internalNotes: existingProduct.internalNotes,
            };
            form.reset(formData);
            if (existingProduct.photo) {
              setPhotoPreview(existingProduct.photo);
            }
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
    }
    loadProduct();
  }, [productId, isEditing, form, router, toast]);

  const handleSpecChange = (key: string, value: string) => {
    setSpecifications(prev => ({ ...prev, [key]: value }));
  };

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

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    
    // Combine base specs with dynamic ones
    const finalSpecifications = { ...specifications };
    if (data.fabricante) {
        finalSpecifications['Fabricante'] = data.fabricante;
    } else {
        delete finalSpecifications['Fabricante'];
    }

    const productToSave: Partial<Product> = {
      id: isEditing ? productId : undefined,
      name: data.name,
      photo: data.photo,
      category: data.category,
      salePrice: data.salePrice,
      costPrice: data.costPrice,
      unit: data.unit,
      description: data.description,
      internalNotes: data.internalNotes,
      technicalSpecifications: finalSpecifications,
    };
    
    try {
        await saveProduct(productToSave);
        toast({
          title: "Sucesso!",
          description: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
        });
        router.push('/inventario');
    } catch (error) {
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o produto.",
          variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (!isProductLoaded) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto max-w-5xl px-4 py-8">
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
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info Column */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1 md:col-span-2">
                                    <Label htmlFor="name">Nome do Produto *</Label>
                                    <Input id="name" placeholder="Ex: Painel Solar 550W" {...form.register("name")} />
                                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Categoria *</Label>
                                    <Select onValueChange={(value: ProductCategory) => form.setValue('category', value)} defaultValue={form.getValues('category')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(PRODUCT_CATEGORIES) as ProductCategory[]).map(key => (
                                                <SelectItem key={key} value={key}>{PRODUCT_CATEGORIES[key]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="fabricante">Fabricante</Label>
                                    <Input id="fabricante" placeholder="Ex: Tongwei, Growatt" {...form.register("fabricante")} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="salePrice">Preço de Venda (R$) *</Label>
                                    <Input id="salePrice" type="number" step="0.01" placeholder="Ex: 750.00" {...form.register("salePrice")} />
                                    {form.formState.errors.salePrice && <p className="text-sm text-destructive">{form.formState.errors.salePrice.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                                    <Input id="costPrice" type="number" step="0.01" placeholder="Ex: 600.00" {...form.register("costPrice")} />
                                    {form.formState.errors.costPrice && <p className="text-sm text-destructive">{form.formState.errors.costPrice.message}</p>}
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label htmlFor="unit">Unidade de Medida *</Label>
                                    <Input id="unit" placeholder="Ex: UN, m², h" {...form.register("unit")} />
                                    {form.formState.errors.unit && <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>}
                                </div>
                            </div>
                            
                            {productCategory === 'PAINEL_SOLAR' && (
                                <div className="space-y-1">
                                    <Label htmlFor="spec-potencia">Potência (Wp)</Label>
                                    <Input id="spec-potencia" type="number" placeholder="Ex: 550" value={specifications['Potência (Wp)'] || ''} onChange={e => handleSpecChange('Potência (Wp)', e.target.value)} />
                                </div>
                            )}

                             {productCategory === 'INVERSOR' && (
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
                        </div>
                        {/* Photo Column */}
                        <div className="md:col-span-1">
                            <Label htmlFor="photo-upload">Foto do Produto</Label>
                            <input
                                id="photo-upload"
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handlePhotoUpload}
                            />
                            <Card className="mt-2 flex items-center justify-center h-64 border-2 border-dashed">
                                <Label htmlFor="photo-upload" className="w-full h-full cursor-pointer flex items-center justify-center">
                                    {photoPreview ? (
                                        <div className="relative w-full h-full group">
                                            <Image src={photoPreview} alt="Pré-visualização do produto" layout="fill" objectFit="contain" className="rounded-md" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-sm">Alterar Foto</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ProductIcon category={productCategory} />
                                            <p>Adicionar Foto</p>
                                        </div>
                                    )}
                                </Label>
                            </Card>
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
