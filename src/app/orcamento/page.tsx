
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

// This is the component that will be rendered by the router
export default function OrcamentoPage() {
  return (
    // You could have a loading state here while the Suspense boundary is resolving
    <Suspense fallback={<div>Carregando...</div>}>
      <OrcamentoPageComponent />
    </Suspense>
  )
}
