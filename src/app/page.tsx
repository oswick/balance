'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Lightbulb, TrendingUp, Coffee, Zap, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Coffee className="w-8 h-8" />,
      title: "Dashboard simple",
      description: "Tus números principales en una pantalla. Revenue, gastos, profit. Sin gráficos raros que nadie entiende.",
      emoji: "📊"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Inventario básico",
      description: "Agrega productos, trackea stock, registra ventas. Lo esencial, sin complicaciones.",
      emoji: "📦"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Control de gastos",
      description: "Apunta cada gasto para saber en qué se va tu dinero. A veces la verdad duele, pero es útil.",
      emoji: "💸"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Suppliers",
      description: "Gestiona tus proveedores y controla tus compras.",
      emoji: "🚚"
    }    
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 border-b-2 border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-950/20 dark:to-green-950/20 -z-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="inline-block mb-4 px-4 py-2 bg-yellow-200 dark:bg-yellow-900 border-2 border-border transform -rotate-1">
            <span className="text-sm font-bold">Una app que hice para no usar Excel</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            Balance<br />
            <span className="text-primary text-2xl md:text-3xl normal-case font-normal">Contabilidad que no da miedo</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            Creé esto porque estaba cansado de Excel y no encontré algo igual. 
            Es simple: ventas, gastos, inventario. Sin más rollos.
          </p>
          
          <div className="mt-8">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/login">Echar un vistazo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
              Lo que incluye
            </h2>
            <p className="text-muted-foreground">Todo lo necesario, nada más</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-border hover:shadow-brutal transition-all duration-200 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{feature.emoji}</span>
                    <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Social Proof / Testimonial */}
     

      {/* CTA Section */}
      <section className="text-center py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-6">
            Probalo si te sirve
          </h2>
          
          <p className="text-lg mb-8 max-w-xl mx-auto opacity-90">
            Es gratis. Si te sirve, genial. Si no, no pasa nada.
          </p>
          
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/login">Empezar</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-border bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Balance • Homo Labs
          </p>
        </div>
      </footer>
    </div>
  );
}

const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)