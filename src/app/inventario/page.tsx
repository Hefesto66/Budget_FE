
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Package, Sun, GitBranch, Wrench, Trash2, CheckSquare, X, LayoutGrid, List, Loader2 } from 'lucide-react';
import { getProducts, type Product, deleteProduct } from '@/lib/storage';
import { PRODUCT_CATEGORIES } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AuthGuard } from '@/components/auth/AuthGuard';

const ProductIcon = ({ category }: { category: Product['category'] }) => {
    switch (category) {
        case 'PAINEL_SOLAR': return <Sun className="h-8 w-8" />;
        case 'INVERSOR': return <GitBranch className="h-8 w-8" />;
        case 'ESTRUTURA': return <Wrench className="h-8 w-8" />;
        default: return <Package className="h-8 w-8" />;
    }
}

interface ProductCardProps {
  product: Product;
  onDelete: (productId: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (productId: string, checked: boolean) => void;
}

const ProductCard = ({ product, onDelete, selectionMode, isSelected, onSelectionChange }: ProductCardProps) => (
  <div className="relative group">
    <div className="absolute top-3 left-3 z-10 transition-opacity duration-200" style={{ opacity: selectionMode ? 1 : 0, pointerEvents: selectionMode ? 'auto' : 'none' }}>
        <Checkbox
            id={`select-${product.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)}
            className="h-5 w-5 bg-background border-primary"
        />
    </div>
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Produto?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá apagar permanentemente o produto "{product.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(product.id)}>Confirmar Exclusão</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
    <Link href={`/inventario/${product.id}`} className="block h-full">
        <div className="flex h-full flex-col items-start gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex w-full items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-primary">{product.name}</h3>
                    <p className="text-sm font-bold text-muted-foreground">{formatCurrency(product.salePrice)}</p>
                </div>
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    {product.photo ? (
                      <Image src={product.photo} alt={product.name} layout="fill" objectFit="cover" className="rounded-md" />
                    ) : (
                      <ProductIcon category={product.category} />
                    )}
                </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-auto">
                <Badge variant="secondary" className="text-xs">{PRODUCT_CATEGORIES[product.category]}</Badge>
            </div>
        </div>
    </Link>
  </div>
);


function InventarioPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = getProducts((allProducts) => {
        setProducts(allProducts);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectionChange = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };
  
  const handleDelete = async (productIds: string[]) => {
    const plural = productIds.length > 1;
    await Promise.all(productIds.map(id => deleteProduct(id)));
    // onSnapshot will handle the UI update
    toast({
        title: `Produto${plural ? 's' : ''} Excluído${plural ? 's' : ''}`,
        description: `O${plural ? 's' : ''} item${plural ? 's' : ''} selecionado${plural ? 's' : ''} foi removido do inventário.`
    });
    setSelectedProducts([]);
    setSelectionMode(false);
  };
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-4">
                 <div>
                    <ToggleGroup 
                        type="single"
                        value={viewMode}
                        onValueChange={(value) => { if(value) setViewMode(value as 'card' | 'list')}}
                        aria-label="Modo de visualização"
                    >
                        <ToggleGroupItem value="card" aria-label="Visualização em Grade">
                            <LayoutGrid className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="Visualização em Lista">
                            <List className="h-5 w-5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Pesquisar produtos..."
                    className="w-full sm:w-64 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
                {selectionMode ? (
                <>
                    <Button variant="outline" onClick={toggleSelectAll}>
                        Selecionar Todos ({selectedProducts.length})
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={selectedProducts.length === 0}>
                            <Trash2 className="mr-2 h-5 w-5" /> Excluir Selecionados
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir {selectedProducts.length} Produtos?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedProducts)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" onClick={() => { setSelectionMode(false); setSelectedProducts([]); }}>
                        <X className="mr-2 h-5 w-5"/> Cancelar
                    </Button>
                </>
                ) : (
                <>
                    <Button variant="outline" onClick={() => setSelectionMode(true)}>
                        <CheckSquare className="mr-2 h-5 w-5"/> Selecionar
                    </Button>
                    <Button size="lg" asChild>
                    <Link href="/inventario/novo">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Novo Produto
                    </Link>
                    </Button>
                </>
                )}
            </div>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onDelete={(id) => handleDelete([id])}
                        selectionMode={selectionMode}
                        isSelected={selectedProducts.includes(product.id)}
                        onSelectionChange={handleSelectionChange}
                    />
                    ))}
                </div>
            ) : (
                 <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Fabricante</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Preço de Venda</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedProducts.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectionChange(product.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/inventario/${product.id}`} className="font-medium text-primary hover:underline">
                                            {product.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{product.technicalSpecifications?.Fabricante || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{PRODUCT_CATEGORIES[product.category]}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.salePrice)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 py-24 text-center">
            <h2 className="text-xl font-semibold text-foreground">Nenhum produto encontrado</h2>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? 'Tente refinar sua busca ou ' : 'Que tal adicionar o primeiro? '}
              <Button variant="link" asChild className="p-0 h-auto">
                 <Link href="/inventario/novo">
                   clique aqui para criar um novo produto.
                 </Link>
              </Button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InventarioPage() {
    return (
        <AuthGuard>
            <InventarioPageContent />
        </AuthGuard>
    )
}

    