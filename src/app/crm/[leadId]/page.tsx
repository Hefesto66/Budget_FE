
"use client";

import { useParams, useRouter } from "next/navigation";
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

// Mock data - in a real app, this would come from a database and use the leadId param
const mockLead = { 
  id: 'lead-001', 
  title: 'Orçamento para Residência em Alphaville', 
  client: { id: 'client-123', name: 'Sr. João Silva' }, 
  value: 25000,
  stage: 'Qualificação',
  salesperson: 'Ana Costa',
  createdAt: new Date('2024-07-20T10:00:00Z'),
};

const mockClient = {
    id: 'client-123',
    name: 'Sr. João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    address: 'Alameda dos Bosques, 123, Alphaville, Barueri - SP'
}

const mockQuotes = [
    { id: 'QT-001', createdAt: new Date('2024-07-21T11:30:00Z'), value: 24500, status: 'Enviada' },
    { id: 'QT-002', createdAt: new Date('2024-07-22T15:00:00Z'), value: 25000, status: 'Aprovada' },
]


export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadId;

  // In a real app, you would fetch lead, client and quotes data based on leadId
  const lead = mockLead;
  const client = mockClient;
  const quotes = mockQuotes;

  const handleNewQuote = () => {
    // Navigate to the budget page, passing lead and client IDs as query params
    router.push(`/orcamento?leadId=${lead.id}&clienteId=${client.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
        <Header />
        <main className="flex-1 p-6">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/crm')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o Funil
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
                                <div className="flex items-center gap-1.5"><User className="h-4 w-4" /><span>{lead.salesperson}</span></div>
                                <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>Criado em {formatDate(lead.createdAt)}</span></div>
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
                                    <TableHead>ID</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.map((quote) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium">{quote.id}</TableCell>
                                        <TableCell>{formatDate(quote.createdAt)}</TableCell>
                                        <TableCell>{quote.status}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(quote.value)}</TableCell>
                                    </TableRow>
                                    ))}
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
                                <Button variant="outline" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Criar Novo
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-full">
                                    <Building className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{client.name}</p>
                                    <p className="text-xs text-muted-foreground">{client.address}</p>
                                </div>
                            </div>
                             <Separator />
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{client.phone}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
