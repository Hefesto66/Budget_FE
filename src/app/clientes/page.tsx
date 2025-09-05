
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, User, Building } from 'lucide-react';
import { getClients, type Client } from '@/lib/storage';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const ClientCard = ({ client }: { client: Client }) => (
  <Link href={`/clientes/${client.id}`}>
    <div className="group flex h-full flex-col items-start gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
        <div className="flex w-full items-start justify-between">
            <div className="flex-1">
                <h3 className="font-bold text-lg text-primary">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.cnpj || 'Documento não informado'}</p>
                <p className="text-sm text-muted-foreground">{client.cityState || 'Local não informado'}</p>
            </div>
            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                {client.photo ? (
                    <Image src={client.photo} alt={client.name} layout="fill" objectFit="cover" className="rounded-md" />
                ) : (
                    client.type === 'company' ? <Building className="h-8 w-8" /> : <User className="h-8 w-8" />
                )}
            </div>
        </div>
         <div className="flex flex-wrap gap-1 mt-auto">
            {client.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
        </div>
    </div>
  </Link>
);


export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setClients(getClients());
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isClient) return null; // Render nothing on the server

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline text-foreground">Meus Clientes</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar clientes..."
                className="w-64 pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="lg" asChild>
              <Link href="/clientes/novo">
                <PlusCircle className="mr-2 h-5 w-5" />
                Novo Cliente
              </Link>
            </Button>
          </div>
        </div>
        
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 py-24 text-center">
            <h2 className="text-xl font-semibold text-foreground">Nenhum cliente encontrado</h2>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? 'Tente refinar sua busca ou ' : 'Que tal adicionar o primeiro? '}
              <Button variant="link" asChild className="p-0 h-auto">
                 <Link href="/clientes/novo">
                   clique aqui para criar um novo cliente.
                 </Link>
              </Button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
