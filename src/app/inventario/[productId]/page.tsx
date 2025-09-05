
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
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      type: "OUTRO",
      salePrice: 0,
      unit: "UN",
      description: "",
      internalNotes: ""
    },
  });

  useEffect(() => {
    if (isEditing) {
      const existingProduct = getProductById(productId);
      if (existingProduct) {
        form.reset(existingProduct);
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
    
    const productToSave: Product = {
      id: isEditing ? productId : `prod-${Date.now()}`,
      ...data,
      technicalSpecifications: specifications
    };
    
    saveProduct(productToSave);
    
    toast({
      title: "Sucesso!",
      description: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
    });
    
    if (!isEditing) {
        router.push(`/inventario/${productToSave.id}`);
    } else {
        router.refresh(); // Refresh to show updated data if needed
    }
    
    setIsSaving(false);
  };
  
  const handleAddSpecification = () => {
    if (newSpecKey && newSpecValue) {
        setSpecifications(prev => ({...prev, [newSpecKey]: newSpecValue}));
        setNewSpecKey("");
        setNewSpecValue("");
    }
  }

  const handleDeleteSpecification = (key: string) => {
    setSpecifications(prev => {
        const newSpecs = {...prev};
        delete newSpecs[key];
        return newSpecs;
    });
  }

  if (!isProductLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <Button type="button" variant="ghost" onClick={() => router.push('/inventario')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o Inventário
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
                {/* Main Content */}
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
                            {/* General Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Nome do Produto *</Label>
                                    <Input id="name" placeholder="Ex: Painel Solar 550W" {...form.register("name")} />
                                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
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
                            
                            {/* Descriptions */}
                            <div className="space-y-1">
                                <Label htmlFor="description">Descrição Pública</Label>
                                <Textarea id="description" placeholder="Esta descrição pode aparecer em cotações e outros documentos." {...form.register("description")} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="internalNotes">Notas Internas</Label>
                                <Textarea id="internalNotes" placeholder="Notas visíveis apenas para a sua equipe." {...form.register("internalNotes")} />
                            </div>

                            {/* Specifications */}
                             <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-medium">Especificações Técnicas</h3>
                                <div className="space-y-2">
                                {Object.entries(specifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        <Input value={key} disabled className="font-semibold"/>
                                        <Input value={value} disabled />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteSpecification(key)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                                <div className="flex items-end gap-2">
                                     <div className="flex-1 space-y-1">
                                        <Label htmlFor="new-spec-key">Característica</Label>
                                        <Input id="new-spec-key" placeholder="Ex: Potência" value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)} />
                                     </div>
                                      <div className="flex-1 space-y-1">
                                        <Label htmlFor="new-spec-value">Valor</Label>
                                        <Input id="new-spec-value" placeholder="Ex: 550Wp" value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} />
                                     </div>
                                    <Button type="button" size="icon" onClick={handleAddSpecification}>
                                        <PlusCircle className="h-5 w-5"/>
                                    </Button>
                                </div>
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
