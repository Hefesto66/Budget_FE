
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';

// Mock data - in a real app, this would come from a database (e.g., Firestore)
const leadsByStage = {
  qualificacao: [
    { id: 'lead-001', title: 'Orçamento para Residência em Alphaville', client: 'Sr. João Silva', value: 25000 },
    { id: 'lead-002', title: 'Sistema para Fazenda Solar', client: 'AgroNegócios S.A.', value: 150000 },
  ],
  proposta: [
    { id: 'lead-003', title: 'Projeto para Condomínio Fechado', client: 'Sra. Maria Oliveira', value: 85000 },
  ],
  negociacao: [
     { id: 'lead-004', title: 'Cobertura de Estacionamento', client: 'Shopping Center Plaza', value: 320000 },
  ],
  ganho: [],
  perdido: [
      { id: 'lead-005', title: 'Proposta para Indústria Têxtil', client: 'Malhas & Cia', value: 120000 },
  ],
};

const stageTitles = {
  qualificacao: 'Qualificação',
  proposta: 'Proposta Enviada',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

type Stage = keyof typeof leadsByStage;

const LeadCard = ({ lead }: { lead: (typeof leadsByStage.qualificacao)[0] }) => (
  <Link href={`/crm/${lead.id}`}>
    <motion.div
      layoutId={`card-container-${lead.id}`}
      whileHover={{ y: -4 }}
      className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-start">
            <p className="font-semibold text-card-foreground">{lead.title}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">{lead.client}</p>
        <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(lead.value)}</p>
      </CardContent>
    </motion.div>
  </Link>
);


export default function CrmPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
        <Header />
        <main className="flex-1 p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline text-foreground">Meu Funil de Vendas</h1>
                <Button size="lg" asChild>
                    <Link href="/crm/new-lead">
                        <PlusCircle className="mr-2 h-5 w-5"/>
                        Criar Lead
                    </Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {(Object.keys(leadsByStage) as Stage[]).map((stage) => (
                    <div key={stage} className="flex flex-col rounded-xl bg-gray-200/50 dark:bg-gray-800/50 p-4">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">{stageTitles[stage]}</h2>
                        <div className="flex-1">
                          {leadsByStage[stage].length > 0 ? (
                            leadsByStage[stage].map(lead => <LeadCard key={lead.id} lead={lead} />)
                          ) : (
                             <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground">
                                Sem leads nesta etapa
                             </div>
                          )}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    </div>
  );
}
