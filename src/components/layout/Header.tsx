import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/minha-empresa"><Building className="mr-2 h-4 w-4"/> Minha Empresa</Link>
          </Button>
          <Button asChild>
            <Link href="/orcamento">Novo Orçamento</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
