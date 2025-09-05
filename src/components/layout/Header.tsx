
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings, PlusCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
           <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/definicoes"><Settings className="mr-2 h-4 w-4"/> Definições</Link>
          </Button>
          <Button asChild>
            <Link href="/orcamento"><PlusCircle /> Cotação Rápida</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
