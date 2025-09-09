
"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Plus, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { useEffect, useState, useRef } from 'react';
import { getLeads, type Lead, getStages, saveStages, type Stage, saveLead, deleteLead, addHistoryEntry } from '@/lib/storage';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { dispararFogos } from '@/lib/confetti';

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


const LeadCard = ({ lead, index, onDelete }: { lead: Lead, index: number, onDelete: (leadId: string) => void }) => (
  <Draggable draggableId={lead.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`group relative mb-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${snapshot.isDragging ? 'shadow-xl scale-105' : ''}`}
      >
        {/* Link principal que envolve o conteúdo */}
        <Link href={`/crm/${lead.id}`} className="block">
          <CardContent className="p-0">
            <p className="font-semibold text-card-foreground">{lead.title}</p>
            <p className="text-sm text-muted-foreground">{lead.clientName}</p>
            <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(lead.value)}</p>
          </CardContent>
        </Link>
        {/* Barra de ferramentas que aparece ao passar o mouse */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Oportunidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá apagar permanentemente a oportunidade "{lead.title}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(lead.id)}>Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    )}
  </Draggable>
);


export default function CrmPage() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [stages, setStages] = useState<Stage[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  
  // State for editing a stage
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const allStages = getStages();
    const allLeads = getLeads();
    setStages(allStages);
    
    // Efficiently group leads by stage
    const stageIds = new Set(allStages.map(s => s.id));
    const leadsGrouped = allLeads.reduce((acc, lead) => {
        let stageId = lead.stage;
        // If lead's stage is invalid or doesn't exist, assign it to the first available stage
        if (!stageIds.has(stageId) && allStages.length > 0) {
            stageId = allStages[0].id;
            saveLead({ ...lead, stage: stageId }); // Correct the lead in storage
        }
        
        if (!acc[stageId]) {
            acc[stageId] = [];
        }
        acc[stageId].push(lead);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Ensure all stages exist in the state, even if they have no leads
    allStages.forEach(stage => {
        if (!leadsGrouped[stage.id]) {
            leadsGrouped[stage.id] = [];
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
    
    const newStage: Stage = { id: newStageId, title: newStageName, description: '', isWon: false };
    const newStages = [...stages, newStage];
    setStages(newStages);
    saveStages(newStages);
    
    setLeadsByStage(prev => ({...prev, [newStage.id]: []}));
    setNewStageName("");
    toast({ title: "Sucesso!", description: `Etapa "${newStageName}" criada.` });
  };
  
  const handleDeleteStage = (stageId: string) => {
    const leadsInStage = leadsByStage[stageId] || [];
    if (leadsInStage.length > 0) {
        toast({ title: "Ação Bloqueada", description: "Não é possível excluir uma etapa que contém oportunidades.", variant: "destructive" });
        return;
    }

    const newStages = stages.filter(s => s.id !== stageId);
    setStages(newStages);
    saveStages(newStages);
    
    setLeadsByStage(prev => {
        const newState = {...prev};
        delete newState[stageId];
        return newState;
    });

    toast({ title: "Sucesso!", description: `A etapa foi excluída.` });
  };

  const handleDeleteLead = (leadId: string) => {
    const leadToDelete = getLeads().find(l => l.id === leadId);
    if (!leadToDelete) return;

    deleteLead(leadId); // Deleta do storage
    
    // Atualiza o estado para remover o lead da UI
    const newLeadsByStage = { ...leadsByStage };
    for (const stageId in newLeadsByStage) {
        newLeadsByStage[stageId] = newLeadsByStage[stageId].filter(lead => lead.id !== leadId);
    }
    setLeadsByStage(newLeadsByStage);

    toast({ title: "Oportunidade Excluída", description: `A oportunidade "${leadToDelete.title}" foi removida.` });
  };
  
  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveStageChanges = () => {
    if (!editingStage) return;

    const newStages = stages.map(s => (s.id === editingStage.id ? editingStage : s));
    
    // Se marcou um novo estágio como "Ganho", desmarcar todos os outros
    if (editingStage.isWon) {
      newStages.forEach(s => {
        if (s.id !== editingStage.id) {
          s.isWon = false;
        }
      });
    }

    setStages(newStages);
    saveStages(newStages);
    setEditingStage(null);
    setIsEditDialogOpen(false);
    toast({ title: "Sucesso!", description: "A etapa foi atualizada." });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    const startStageLeads = Array.from(leadsByStage[sourceStageId]);
    const [movedLead] = startStageLeads.splice(source.index, 1);

    if (sourceStageId === destStageId) {
      startStageLeads.splice(destination.index, 0, movedLead);
      setLeadsByStage(prev => ({ ...prev, [sourceStageId]: startStageLeads }));
    } else {
      const finishStageLeads = Array.from(leadsByStage[destStageId]);
      finishStageLeads.splice(destination.index, 0, movedLead);

      const destStage = stages.find(s => s.id === destStageId);
      if(destStage) {
        addHistoryEntry({ 
            clientId: movedLead.clientId, 
            text: `Oportunidade "${movedLead.title}" movida para a etapa "${destStage.title}".`, 
            type: 'log-stage',
            refId: movedLead.id
        });

        // Check for "Won" stage celebration
        if (destStage.isWon) {
            dispararFogos();
            toast({
                title: "🎉 Parabéns!",
                description: `Você ganhou a oportunidade "${movedLead.title}"!`,
                duration: 5000,
            });
        }
      }

      setLeadsByStage(prev => ({
        ...prev,
        [sourceStageId]: startStageLeads,
        [destStageId]: finishStageLeads,
      }));
      
      const updatedLead = { ...movedLead, stage: destStageId };
      saveLead(updatedLead);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-950">
          <Header />
          <main className="flex-1 p-6 flex flex-col">
              <div className="mb-6 flex items-center justify-start">
                  <Button size="lg" asChild>
                      <Link href="/crm/new-lead">
                          <PlusCircle className="mr-2 h-5 w-5"/>
                          Nova Oportunidade
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
                            className={`w-80 flex-shrink-0 flex flex-col rounded-xl p-4 transition-colors ${stage.isWon ? 'bg-green-500/10 border-2 border-dashed border-green-500/50' : snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-gray-200/50 dark:bg-gray-800/50'}`}
                          >
                            <div className="mb-4 flex justify-between items-center group">
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                       <h2 className="font-semibold text-foreground cursor-help">{stage.title}</h2>
                                    </TooltipTrigger>
                                    {stage.description && (
                                       <TooltipContent>
                                        <p className="max-w-xs">{stage.description}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleEditStage(stage)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
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
                            </div>
                              <div className="flex-1 min-h-[100px]">
                                {(leadsByStage[stage.id] && leadsByStage[stage.id].length > 0) ? (
                                  leadsByStage[stage.id].map((lead, index) => <LeadCard key={lead.id} lead={lead} index={index} onDelete={handleDeleteLead} />)
                                ) : (
                                  !snapshot.isDraggingOver && (
                                    <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground p-4 text-center">
                                      Sem oportunidades nesta etapa
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

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Etapa: {editingStage?.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <Label htmlFor="stage-title">Nome da Etapa</Label>
                    <Input 
                        id="stage-title" 
                        value={editingStage?.title || ''} 
                        onChange={(e) => setEditingStage(prev => prev ? {...prev, title: e.target.value} : null)}
                    />
                </div>
                <div>
                    <Label htmlFor="stage-description">Descrição</Label>
                    <Textarea 
                        id="stage-description" 
                        placeholder="Descreva o que acontece nesta etapa..."
                        value={editingStage?.description || ''}
                        onChange={(e) => setEditingStage(prev => prev ? {...prev, description: e.target.value} : null)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="is-won-stage"
                        checked={editingStage?.isWon || false}
                        onCheckedChange={(checked) => setEditingStage(prev => prev ? {...prev, isWon: checked} : null)}
                    />
                    <Label htmlFor="is-won-stage">Marcar como estágio "Ganho"?</Label>
                </div>
                 <p className="text-xs text-muted-foreground">
                    Marcar esta opção fará com que qualquer oportunidade movida para cá seja considerada uma venda concluída. Apenas uma etapa pode ser marcada como "Ganho".
                </p>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveStageChanges}>Salvar Alterações</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}
