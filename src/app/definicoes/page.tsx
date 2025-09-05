
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ArrowRight, Building, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  href: string;
  icon: React.ReactNode;
  name: string;
  description: string;
}

const SettingsCard = ({ href, icon, name, description }: SettingsCardProps) => (
  <Link href={href} className="block group">
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "h-full rounded-2xl p-6 text-left shadow-lg transition-all duration-300",
        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
        "flex items-start gap-6"
      )}
    >
      <div className="mt-1 rounded-full bg-primary/10 p-4">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white font-headline">{name}</h3>
        <p className="mt-2 text-sm text-white/60">{description}</p>
        <div className="mt-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline">
            Acessar <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.div>
  </Link>
);


export default function DefinicoesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Definições
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Ajuste as configurações gerais da sua aplicação, personalize documentos e gira os dados da sua empresa.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <SettingsCard
              href="/minha-empresa"
              icon={<Building className="h-8 w-8 text-primary" />}
              name="Minha Empresa"
              description="Edite as informações da sua empresa que aparecem nos documentos, como nome, logotipo e endereço."
            />
            <SettingsCard
              href="/personalizar-proposta"
              icon={<Palette className="h-8 w-8 text-primary" />}
              name="Personalizar Proposta"
              description="Ajuste a aparência e o conteúdo das propostas comerciais para que reflitam a sua marca."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
