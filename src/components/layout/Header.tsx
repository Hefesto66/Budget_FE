
"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useMemo } from 'react';

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { title, showQuickQuote } = useMemo(() => {
    if (pathname === '/crm') {
      return { title: 'Meu Funil de Vendas', showQuickQuote: false };
    }
    if (pathname === '/clientes') {
      return { title: 'Meus Clientes', showQuickQuote: false };
    }
    if (pathname.startsWith('/clientes/')) {
        const isNew = pathname.endsWith('/novo');
        return { title: isNew ? 'Novo Cliente' : 'Editar Cliente', showQuickQuote: false };
    }
    if (pathname.startsWith('/crm/')) {
        const isNew = pathname.endsWith('/new-lead');
        return { title: isNew ? 'Nova Oportunidade' : 'Detalhes da Oportunidade', showQuickQuote: false };
    }
    if (pathname === '/orcamento') {
      const hasLead = searchParams.has('leadId');
      return { title: hasLead ? 'Cotação' : 'Cotação Rápida', showQuickQuote: false };
    }
     if (pathname === '/definicoes') {
      return { title: 'Definições', showQuickQuote: false };
    }
    if (pathname === '/minha-empresa') {
      return { title: 'Dados da Sua Empresa', showQuickQuote: false };
    }
    if (pathname === '/personalizar-proposta') {
      return { title: 'Personalizar Proposta', showQuickQuote: false };
    }
    if (pathname === '/inventario') {
        return { title: 'Inventário', showQuickQuote: false };
    }
     if (pathname.startsWith('/inventario/')) {
        const isNew = pathname.endsWith('/novo');
        return { title: isNew ? 'Novo Produto' : 'Editar Produto', showQuickQuote: false };
    }
    // Default state for home page
    return { title: null, showQuickQuote: true };
  }, [pathname, searchParams]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/">
              <Logo />
            </Link>
            {title && (
              <>
                <div className="h-6 w-px bg-white/20"></div>
                <h1 className="text-xl font-semibold text-white">{title}</h1>
              </>
            )}
        </div>
        
        <div className="flex items-center gap-4">
          {showQuickQuote && (
            <Button asChild>
              <Link href="/orcamento"><PlusCircle /> Cotação Rápida</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
