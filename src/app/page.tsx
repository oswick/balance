'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Lightbulb, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Comprehensive Dashboard",
      description: "Get a 360-degree view of your business with key metrics like revenue, expenses, and profit margins at a glance.",
      image: "https://placehold.co/600x400.png",
      aiHint: "business dashboard"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Inventory & Sales Tracking",
      description: "Effortlessly manage your product catalog, track stock levels, and record sales. Never lose sight of your inventory.",
      image: "https://placehold.co/600x400.png",
      aiHint: "inventory management"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Expense & Purchase Logging",
      description: "Keep a detailed record of all your expenses and product purchases. Understand where your money is going.",
      image: "https://placehold.co/600x400.png",
      aiHint: "finance tracking"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "AI-Powered Smart Buy",
      description: "Leverage AI to get smart suggestions on when and what to purchase, optimizing your stock and maximizing profitability.",
      image: "https://placehold.co/600x400.png",
      aiHint: "artificial intelligence"
    }
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="text-center py-20 md:py-32 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Control Total. Cero Complicaciones.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Balance es la herramienta definitiva para pequeños negocios. Centraliza tus ventas, gastos, inventario y obtén análisis inteligentes para crecer.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/login">Empezar Ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase">Todo lo que necesitas para tu negocio</h2>
            <p className="text-muted-foreground mt-2">Desde el seguimiento de ventas hasta la inteligencia artificial.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-3 border-2 border-border mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl uppercase">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Feature Section */}
       <section className="py-20 md:py-24 border-b-2 border-t-2 border-border">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase">Visualiza tu Éxito</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Con un dashboard intuitivo y gráficos claros, Balance convierte tus datos en decisiones estratégicas. Entiende tu rendimiento de un vistazo y planifica tu próximo movimiento con confianza.
            </p>
            <ul className="mt-6 space-y-4 text-base">
                <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                    <span>Métricas clave en tiempo real para un pulso constante de tu negocio.</span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                    <span>Análisis de rentabilidad por producto para maximizar tus ganancias.</span>
                </li>
                 <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                    <span>Informes visuales que simplifican datos complejos.</span>
                </li>
            </ul>
          </div>
           <div className="w-full h-auto border-2 border-border shadow-brutal">
            <Image 
                src="https://placehold.co/600x400.png" 
                alt="Dashboard Screenshot"
                width={600}
                height={400}
                className="object-cover w-full h-full"
                data-ai-hint="dashboard analytics"
             />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-20 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black uppercase">Toma el control de tu negocio hoy</h2>
          <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto">
            Deja de adivinar. Empieza a decidir con datos.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Registrate Gratis</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
)
