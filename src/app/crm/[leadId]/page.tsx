
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, ArrowLeft, Building, Mail, Phone, Tag, DollarSign, User, Calendar, FileText } from 'lucide-react';
import { Header } from "@/components/layout/Header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getLeadById, getQuotesByLeadId, type Lead, type Quote } from '@/lib/storage';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadId as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (leadId) {
      const foundLead = getLeadById(leadId);
      setLead(foundLead || null);
      if (foundLead) {
        const foundQuotes = getQuotesByLeadId(leadId);
        setQuotes(foundQuotes);
      }
    }
  }, [leadId]);

  const handleNewQuote = () => {
    if (!lead) return;
    router.push(`/orcamento?leadId=${lead.id}&clienteId=${lead.clientId}`);
  };

  const handleQuoteClick = (quoteId: string) => {
    router.push(`/orcamento?leadId=${leadId}&quoteId=${quoteId}&clienteId=${lead?.clientId}`);
  };

  if (!isClient) {
    // Render a skeleton or loading state while waiting for client-side hydration
    return <div>Carregando...</div>;
  }
  
  if (!lead) {
    return (
       <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
        <Header />
        <main className="flex-1 p-6 text-center">
            <h1 className="text-xl">Lead não encontrado.</h1>
            <Button variant="link" onClick={() => router.push('/crm')}>Voltar para o Funil</Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
        <Header />
        <main className="flex-1 p-6">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                   <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl text-foreground">{lead.title}</CardTitle>
                            <div className="flex items-center gap-4 text-muted-foreground text-sm pt-2">
                                <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /><span>{formatCurrency(lead.value)}</span></div>
                                <div className="flex items-center gap-1.5"><Tag className="h-4 w-4" /><span>{lead.stage}</span></div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Button size="lg" onClick={handleNewQuote}>
                                <FileText className="mr-2 h-5 w-5" />
                                Nova Cotação
                            </Button>
                        </CardContent>
                   </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cotações</CardTitle>
                             <CardDescription>
                                Todas as cotações e propostas geradas para esta oportunidade.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>ID da Cotação</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.length > 0 ? quotes.map((quote) => (
                                    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleQuoteClick(quote.id)}>
                                        <TableCell className="font-medium">{quote.id}</TableCell>
                                        <TableCell>{formatDate(new Date(quote.createdAt))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(quote.results.financeiro.custo_sistema_reais)}</TableCell>
                                    </TableRow>
                                    )) : (
                                      <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                          Nenhuma cotação criada para este lead.
                                        </TableCell>
                                      </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-full">
                                    <User className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                    {lead.clientId ? (
                                        <Link href={`/clientes/${lead.clientId}`} className="font-semibold text-foreground hover:underline hover:text-primary">
                                            {lead.clientName}
                                        </Link>
                                    ) : (
                                        <p className="font-semibold text-foreground">{lead.clientName}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
