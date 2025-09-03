import { Wizard } from '@/components/wizard/Wizard';
import { Header } from '@/components/layout/Header';

export default function OrcamentoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Wizard />
      </main>
    </div>
  );
}
