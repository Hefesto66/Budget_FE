
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useEffect, useState } from 'react';
import { getLeads, type Lead, getStages, saveStages, type Stage } from '@/lib/storage';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [stages, setStages] = useState<Stage[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const allStages = getStages();
    const allLeads = getLeads();

    setStages(allStages);

    const groupedLeads = allLeads.reduce((acc, lead) => {
      const stageKey = lead.stage;
      if (!acc[stageKey]) {
        acc[stageKey] = [];
      }
      acc[stageKey].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
    
    setLeadsByStage(groupedLeads);

  }, []);

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      toast({ title: "Erro", description: "O nome da etapa não pode ser vazio.", variant: "destructive" });
      return;
    }
    const newStageId = newStageName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    if (stages.some(s => s.id === newStageId)) {
        toast({ title: "Erro", description: "Já existe uma etapa com um nome similar.", variant: "destructive" });
        return;
    }
    
    const newStages = [...stages, { id: newStageId, title: newStageName }];
    setStages(newStages);
    saveStages(newStages);
    setNewStageName("");
     toast({ title: "Sucesso!", description: `Etapa "${newStageName}" criada.` });
  };
  
  const handleDeleteStage = (stageId: string) => {
    const leadsInStage = leadsByStage[stageId] || [];
    if (leadsInStage.length > 0) {
        toast({ title: "Ação Bloqueada", description: "Não é possível excluir uma etapa que contém leads.", variant: "destructive" });
        return;
    }

    const newStages = stages.filter(s => s.id !== stageId);
    setStages(newStages);
    saveStages(newStages);
    toast({ title: "Sucesso!", description: `A etapa foi excluída.` });
  };

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
            <div className="flex gap-6 overflow-x-auto pb-4">
                {stages.map((stage) => (
                    <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-gray-200/50 dark:bg-gray-800/50 p-4">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="font-semibold text-foreground">{stage.title}</h2>
                            {(leadsByStage[stage.id]?.length ?? 0) === 0 && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isto irá apagar permanentemente a etapa "{stage.title}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteStage(stage.id)}>Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <div className="flex-1">
                          {(leadsByStage[stage.id] && leadsByStage[stage.id].length > 0) ? (
                            leadsByStage[stage.id].map(lead => <LeadCard key={lead.id} lead={lead} />)
                          ) : (
                             <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground p-4 text-center">
                                Sem leads nesta etapa
                             </div>
                          )}
                        </div>
                    </div>
                ))}
                 <div className="w-72 flex-shrink-0">
                    <Card className="bg-gray-200/50 dark:bg-gray-800/50 border-2 border-dashed hover:border-primary transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="Nome da nova etapa" 
                                    className="bg-background"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddStage() }}
                                />
                                <Button onClick={handleAddStage} size="icon">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </main>
    </div>
  );
}
