import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart3, Zap, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cómo Funciona",
  description: "Descubre cómo Manager Poker Deal te ayuda a optimizar tu rakeback y profesionalizar tu poker en 4 simples pasos.",
};

export default function ComoFuncionaPage() {
  const steps = [
    { icon: <Users className="h-8 w-8" />, title: "1. Regístrate", description: "Crea tu cuenta en Manager Poker Deal. Solo necesitas un email y 2 minutos. Cuéntanos tu nivel de juego y tus objetivos para personalizar tu experiencia." },
    { icon: <BarChart3 className="h-8 w-8" />, title: "2. Elige tu sala", description: "Te recomendamos la sala que mejor se adapta a tu perfil y te guiamos paso a paso en el proceso de alta. Usa nuestro código de afiliación para activar tu rakeback premium." },
    { icon: <Zap className="h-8 w-8" />, title: "3. Juega como siempre", description: "Juega tus sesiones normales. Tu rakeback se calcula automáticamente y se acumula en tu saldo interno de MPD. Sin cambiar nada en tu forma de jugar." },
    { icon: <Wallet className="h-8 w-8" />, title: "4. Canjea tu saldo", description: "Usa tu saldo acumulado para comprar servicios premium (VPN, datamining, coaching) o solicita un retiro. Tú decides cómo usar tu rakeback." },
  ];

  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-mpd-white">Cómo Funciona</h1>
            <p className="mt-2 text-mpd-gray">4 pasos para empezar a optimizar tu poker</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <Card key={i} className="hover:border-mpd-gold/30 transition-colors">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-mpd-white mb-2">{step.title}</h3>
                    <p className="text-mpd-gray">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Empezar Ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
