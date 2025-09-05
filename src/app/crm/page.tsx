
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useEffect, useState } from 'react';
import { getLeads, type Lead } from '@/lib/storage';

const stageTitles: Record<string, string> = {
  qualificacao: 'Qualificação',
  proposta: 'Proposta Enviada',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

type Stage = keyof typeof stageTitles;


const LeadCard = ({ lead }: { lead: Lead }) => (
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
        <p className="text-sm text-muted-foreground">{lead.clientName}</p>
        <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(lead.value)}</p>
      </CardContent>
    </motion.div>
  </Link>
);


export default function CrmPage() {
  const [leadsByStage, setLeadsByStage] = useState<Record<Stage, Lead[]>>({
    qualificacao: [],
    proposta: [],
    negociacao: [],
    ganho: [],
    perdido: [],
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const allLeads = getLeads();
    const groupedLeads = allLeads.reduce((acc, lead) => {
      const stage = lead.stage as Stage;
      if (!acc[stage]) {
        acc[stage] = [];
      }
      acc[stage].push(lead);
      return acc;
    }, {} as Record<Stage, Lead[]>);
    
    setLeadsByStage(prev => ({...prev, ...groupedLeads}));

  }, []);

  if (!isClient) {
    return null; // or a loading skeleton
  }

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
                {(Object.keys(stageTitles) as Stage[]).map((stage) => (
                    <div key={stage} className="flex flex-col rounded-xl bg-gray-200/50 dark:bg-gray-800/50 p-4">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">{stageTitles[stage]}</h2>
                        <div className="flex-1">
                          {(leadsByStage[stage] && leadsByStage[stage].length > 0) ? (
                            leadsByStage[stage].map(lead => <LeadCard key={lead.id} lead={lead} />)
                          ) : (
                             <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground p-4 text-center">
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
