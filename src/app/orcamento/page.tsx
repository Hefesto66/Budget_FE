
"use client";

import { Suspense } from 'react';
import { Wizard } from '@/components/wizard/Wizard';
import { Header } from '@/components/layout/Header';

function OrcamentoPageComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Wizard />
      </main>
    </div>
  );
}

export default function OrcamentoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OrcamentoPageComponent />
    </Suspense>
  )
}
