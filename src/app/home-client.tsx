
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Users, Building2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppCardProps {
  href: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  className?: string;
  disabled?: boolean;
}

const AppCard = ({ href, icon, name, description, className, disabled }: AppCardProps) => (
  <Link href={disabled ? "#" : href} className={cn("block group", disabled && "pointer-events-none opacity-60")}>
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "h-full rounded-2xl p-6 text-center shadow-lg transition-all duration-300",
        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white font-headline">{name}</h3>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline">
          Acessar <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </motion.div>
  </Link>
);

export default function HomeClient() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // This code runs only on the client, after hydration
    setYear(new Date().getFullYear());
  }, []);

  return (
    <>
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Bem-vindo ao seu Centro de Gestão
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
          Selecione um aplicativo para começar a gerenciar o seu negócio de forma integrada.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AppCard
            href="/crm"
            icon={<Briefcase className="h-10 w-10 text-primary" />}
            name="CRM"
            description="Gerencie leads, oportunidades e feche mais negócios com o funil de vendas."
          />
          <AppCard
            href="/clientes"
            icon={<Users className="h-10 w-10 text-primary" />}
            name="Clientes"
            description="Centralize as informações e o histórico de todos os seus clientes."
          />
          <AppCard
            href="/inventario"
            icon={<Building2 className="h-10 w-10 text-primary" />}
            name="Inventário"
            description="Controle seus produtos, painéis, inversores e outros equipamentos."
          />
          <AppCard
            href="/definicoes"
            icon={<Settings className="h-10 w-10 text-primary" />}
            name="Definições"
            description="Configure os dados da sua empresa e personalize a aparência dos documentos."
          />
        </div>
      </section>
      <footer className="py-8">
        <div className="container mx-auto px-4 text-center text-white/50">
          {year && <p>&copy; {year} Solaris. Todos os direitos reservados.</p>}
        </div>
      </footer>
    </>
  );
}
