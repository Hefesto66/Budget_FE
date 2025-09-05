
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ArrowRight, BookUser, Briefcase, Building2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppCardProps {
  href: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  className?: string;
}

const AppCard = ({ href, icon, name, description, className }: AppCardProps) => (
  <Link href={href} className="block group">
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
       <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Bem-vindo ao seu Centro de Gestão
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Selecione um aplicativo para começar a gerenciar o seu negócio de forma integrada.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AppCard
              href="/crm"
              icon={<Briefcase className="h-10 w-10 text-primary" />}
              name="CRM"
              description="Gerencie leads, oportunidades e feche mais negócios com o funil de vendas."
            />
            <AppCard
              href="#"
              icon={<Users className="h-10 w-10 text-primary" />}
              name="Clientes"
              description="Centralize as informações e o histórico de todos os seus clientes."
            />
            <AppCard
              href="#"
              icon={<Building2 className="h-10 w-10 text-primary" />}
              name="Inventário"
              description="Controle seus produtos, painéis, inversores e outros equipamentos."
            />
          </div>
        </section>
      </main>

      <footer className="py-8">
        <div className="container mx-auto px-4 text-center text-white/50">
          <p>&copy; {new Date().getFullYear()} FE Sistema Solar. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
