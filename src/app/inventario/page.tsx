
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Package, Sun, GitBranch, Wrench } from 'lucide-react';
import { getProducts, type Product, PRODUCT_TYPES } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const ProductIcon = ({ type }: { type: Product['type'] }) => {
    switch (type) {
        case 'PAINEL_SOLAR': return <Sun className="h-8 w-8" />;
        case 'INVERSOR': return <GitBranch className="h-8 w-8" />;
        case 'ESTRUTURA': return <Wrench className="h-8 w-8" />;
        default: return <Package className="h-8 w-8" />;
    }
}

const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/inventario/${product.id}`}>
    <div className="group flex h-full flex-col items-start gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
        <div className="flex w-full items-start justify-between">
            <div className="flex-1">
                <h3 className="font-bold text-lg text-primary">{product.name}</h3>
                <p className="text-sm font-bold text-muted-foreground">{formatCurrency(product.salePrice)}</p>
            </div>
            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <ProductIcon type={product.type} />
            </div>
        </div>
         <div className="flex flex-wrap gap-1 mt-auto">
            <Badge variant="secondary" className="text-xs">{PRODUCT_TYPES[product.type]}</Badge>
        </div>
    </div>
  </Link>
);


export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setProducts(getProducts());
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isClient) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar produtos..."
              className="w-full sm:w-64 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="lg" asChild>
            <Link href="/inventario/novo">
              <PlusCircle className="mr-2 h-5 w-5" />
              Novo Produto
            </Link>
          </Button>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
