import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cursos",
  description: "Formación premium de Manager Poker Deal. Próximamente: cursos trimestrales en grupos cerrados para acelerar tu evolución como jugador.",
};

export default function CursosPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Badge variant="warning" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Próximamente
            </Badge>

            <div className="h-20 w-20 rounded-2xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-6">
              <GraduationCap className="h-10 w-10" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-mpd-white tracking-tight">
              Cursos
            </h1>
            <div className="mt-4 h-0.5 w-12 bg-mpd-gold rounded-full" />

            <p className="mt-6 text-lg text-mpd-gray max-w-xl">
              Estamos preparando el programa formativo de Manager Poker Deal: cursos trimestrales en grupos cerrados, impartidos por profesionales, diseñados para acelerar tu evolución como jugador.
            </p>

            <p className="mt-3 text-sm text-mpd-gray/80 max-w-xl">
              Plazas limitadas, contenido exclusivo y seguimiento personalizado. Muy pronto podrás reservar tu plaza desde aquí.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/servicios">Ver otros servicios</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
