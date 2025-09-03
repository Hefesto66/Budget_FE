import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, DollarSign, BarChart2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 md:py-32">
          <div
            aria-hidden="true"
            className="absolute inset-0 top-0 h-full w-full bg-gradient-to-b from-primary/10 to-background"
          />
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              O Futuro da Energia está no seu Telhado
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/80">
              Descubra o potencial de economia da sua casa com a nossa calculadora solar. Simples, rápido e preciso.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/orcamento">Iniciar Orçamento Gratuito</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tudo que você precisa para economizar
              </h2>
              <p className="mt-4 text-lg text-foreground/80">
                Nossa ferramenta oferece uma análise completa e transparente para sua transição para a energia solar.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-accent" />}
                title="Cálculo Instantâneo"
                description="Receba uma estimativa precisa da quantidade de painéis e do custo total do sistema em segundos."
              />
              <FeatureCard
                icon={<DollarSign className="h-8 w-8 text-accent" />}
                title="Projeção de Economia"
                description="Visualize sua economia mensal e anual, e entenda o quão rápido seu investimento se paga."
              />
              <FeatureCard
                icon={<BarChart2 className="h-8 w-8 text-accent" />}
                title="Análise Gráfica"
                description="Gráficos intuitivos mostram os benefícios a longo prazo, facilitando a sua decisão."
              />
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-32 bg-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Pronto para fazer a mudança?
                </h2>
                <p className="mt-4 text-lg text-foreground/80">
                  Junte-se a milhares de brasileiros que estão economizando na conta de luz e contribuindo para um planeta mais sustentável.
                </p>
                <ul className="mt-8 space-y-4 text-foreground/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>Reduza sua conta de luz em até 95%.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>Valorize seu imóvel com um sistema de energia limpa.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>Contribua para um futuro mais verde e sustentável.</span>
                  </li>
                </ul>
                <div className="mt-10">
                  <Button asChild size="lg">
                    <Link href="/orcamento">Calcular Minha Economia</Link>
                  </Button>
                </div>
              </div>
              <div className="h-80 w-full overflow-hidden rounded-lg shadow-xl">
                 <Image
                    src="https://picsum.photos/600/400"
                    alt="Família feliz em casa com painéis solares"
                    width={600}
                    height={400}
                    data-ai-hint="solar panels house"
                    className="h-full w-full object-cover"
                  />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-foreground/60">
          <p>&copy; {new Date().getFullYear()} EcoCalc Solar. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg bg-card p-8 shadow-sm transition-shadow hover:shadow-lg">
      <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
        {icon}
      </div>
      <h3 className="font-headline text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-foreground/80">{description}</p>
    </div>
  );
}
