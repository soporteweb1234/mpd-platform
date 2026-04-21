import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, MessageSquare, Mail, LifeBuoy, Users } from "lucide-react";

export const metadata = {
  title: "Contacto",
  description:
    "Ponte en contacto con Manager Poker Deal. Únete a nuestro Discord o escríbenos para solicitar asesoramiento personalizado.",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />

      <section className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-mpd-white">Contacto</h1>
            <p className="mt-4 text-lg text-mpd-gray">
              ¿Dudas sobre salas, rakeback o servicios? Elige el canal que mejor te encaje.
            </p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <Card className="group hover:border-mpd-gold/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-mpd-white">Discord de la comunidad</h3>
                <p className="mt-1 text-sm text-mpd-gray">
                  Accede al servidor oficial, conecta con el equipo y con otros jugadores.
                </p>
                <Button size="sm" className="mt-4" asChild>
                  <a
                    href="https://discord.gg/managerpokerdeal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unirme al Discord <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:border-mpd-gold/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-mpd-white">Email directo</h3>
                <p className="mt-1 text-sm text-mpd-gray">
                  Para consultas comerciales, prensa o propuestas de colaboración.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a href="mailto:hola@managerpokerdeal.com">
                    hola@managerpokerdeal.com
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:border-mpd-gold/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-mpd-white">Soporte a jugadores</h3>
                <p className="mt-1 text-sm text-mpd-gray">
                  ¿Ya eres miembro? Abre un ticket desde tu panel personal.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/dashboard/support">Ir a soporte</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:border-mpd-gold/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-mpd-white">Asesoramiento personalizado</h3>
                <p className="mt-1 text-sm text-mpd-gray">
                  Analizamos tu perfil, stake y temporalidad para recomendarte la mejor opción.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/register">
                    Crear cuenta <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-mpd-gray">
              Nuestro equipo responde todas las consultas en un máximo de 24h hábiles.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
