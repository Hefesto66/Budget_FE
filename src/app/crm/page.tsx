
"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { useEffect, useState, useRef } from 'react';
import { getLeads, type Lead, getStages, saveStages, type Stage, saveLead } from '@/lib/storage';
import type { DropResult } from "@hello-pangea/dnd";
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

// Importa o DragDropContext dinamicamente para evitar problemas de SSR
const DragDropContext = dynamic(
  () =>
    import("@hello-pangea/dnd").then((mod) => {
      return mod.DragDropContext;
    }),
  { ssr: false }
);
const Droppable = dynamic(
  () =>
    import("@hello-pangea/dnd").then((mod) => {
      return mod.Droppable;
    }),
  { ssr: false }
);
const Draggable = dynamic(
  () =>
    import("@hello-pangea/dnd").then((mod) => {
      return mod.Draggable;
    }),
  { ssr: false }
);


const LeadCard = ({ lead, index }: { lead: Lead, index: number }) => (
  <Draggable draggableId={lead.id} index={index}>
    {(provided, snapshot) => (
       <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="mb-4"
      >
        <Link 
          href={`/crm/${lead.id}`}
          className={`block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer ${snapshot.isDragging ? 'shadow-xl scale-105' : ''}`}
        >
          <CardContent className="p-0">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-card-foreground">{lead.title}</p>
            </div>
            <p className="text-sm text-muted-foreground">{lead.clientName}</p>
            <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(lead.value)}</p>
          </CardContent>
        </Link>
      </div>
    )}
  </Draggable>
);


export default function CrmPage() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [stages, setStages] = useState<Stage[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const allStages = getStages();
    const allLeads = getLeads();
    setStages(allStages);
    
    // Initialize all stages in the state, even if they have no leads
    const leadsGrouped: Record<string, Lead[]> = {};
    allStages.forEach(stage => {
        leadsGrouped[stage.id] = [];
    });
    
    allLeads.forEach(lead => {
        if (leadsGrouped[lead.stage]) {
            leadsGrouped[lead.stage].push(lead);
        } else if(allStages.length > 0){ // If lead stage doesn't exist, put it in the first stage
            leadsGrouped[allStages[0].id].push(lead);
            saveLead({...lead, stage: allStages[0].id});
        }
    });

    setLeadsByStage(leadsGrouped);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel);
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
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
    
    const newStage: Stage = { id: newStageId, title: newStageName };
    const newStages = [...stages, newStage];
    setStages(newStages);
    saveStages(newStages);
    
    // Add the new stage to the leadsByStage state
    setLeadsByStage(prev => ({...prev, [newStage.id]: []}));
    
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
    
    // Remove the stage from the leadsByStage state
    setLeadsByStage(prev => {
        const newState = {...prev};
        delete newState[stageId];
        return newState;
    });

    toast({ title: "Sucesso!", description: `A etapa foi excluída.` });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    const startStageLeads = Array.from(leadsByStage[sourceStageId]);
    const [movedLead] = startStageLeads.splice(source.index, 1);

    // If moving within the same stage
    if (sourceStageId === destStageId) {
      startStageLeads.splice(destination.index, 0, movedLead);
      const newLeadsByStage = {
        ...leadsByStage,
        [sourceStageId]: startStageLeads,
      };
      setLeadsByStage(newLeadsByStage);
    } else {
      // Moving to a different stage
      const finishStageLeads = Array.from(leadsByStage[destStageId]);
      finishStageLeads.splice(destination.index, 0, movedLead);

      const newLeadsByStage = {
        ...leadsByStage,
        [sourceStageId]: startStageLeads,
        [destStageId]: finishStageLeads,
      };
      setLeadsByStage(newLeadsByStage);
      
      // Update lead stage in storage
      const updatedLead = { ...movedLead, stage: destStageId };
      saveLead(updatedLead);
    }
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
          <Header />
          <main className="flex-1 p-6 flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-3xl font-bold font-headline text-foreground">Meu Funil de Vendas</h1>
                  <Button size="lg" asChild>
                      <Link href="/crm/new-lead">
                          <PlusCircle className="mr-2 h-5 w-5"/>
                          Criar Lead
                      </Link>
                  </Button>
              </div>
              <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar flex-grow">
                  {stages.map((stage) => (
                    <Droppable droppableId={stage.id} key={stage.id}>
                      {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`w-80 flex-shrink-0 flex flex-col rounded-xl p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-gray-200/50 dark:bg-gray-800/50'}`}
                          >
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
                              <div className="flex-1 min-h-[100px]">
                                {(leadsByStage[stage.id] && leadsByStage[stage.id].length > 0) ? (
                                  leadsByStage[stage.id].map((lead, index) => <LeadCard key={lead.id} lead={lead} index={index} />)
                                ) : (
                                  !snapshot.isDraggingOver && (
                                    <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground p-4 text-center">
                                      Sem leads nesta etapa
                                    </div>
                                  )
                                )}
                                {provided.placeholder}
                              </div>
                          </div>
                      )}
                    </Droppable>
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
    </DragDropContext>
  );
}
