
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { clientSchema, type ClientFormData } from "@/types";
import { UserPlus, SkipForward } from "lucide-react";

interface ClientRegistrationDialogProps {
  isOpen: boolean;
  onSave: (data: ClientFormData) => void;
  onSkip: () => void;
}

export function ClientRegistrationDialog({ isOpen, onSave, onSkip }: ClientRegistrationDialogProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      document: "",
      address: "",
    },
  });

  const onSubmit = (data: ClientFormData) => {
    onSave(data);
    form.reset();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onSkip(); }}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-headline">
                <UserPlus />
                Cadastrar Cliente
              </DialogTitle>
              <DialogDescription>
                Insira os dados do cliente para personalizar a proposta. Você também pode pular esta etapa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do Cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF ou CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da Instalação</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Nº, Bairro, Cidade - UF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onSkip}>
                <SkipForward className="mr-2" />
                Orçamento sem Cliente
              </Button>
              <Button type="submit">Salvar Cliente</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    