import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Database, Wrench, GraduationCap, Wallet, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Servicios",
  description: "Servicios premium del ecosistema Manager Poker Deal: VPN, datamining, herramientas, coaching y bancaje.",
};

const services = [
  { icon: <Shield className="h-6 w-6" />, title: "VPN Residencial", price: "€45/mes", desc: "IP residencial dedicada exclusiva para jugar sin restricciones geográficas.", features: ["IP residencial exclusiva", "Conexión estable 24/7", "Soporte técnico"], available: true },
  { icon: <Shield className="h-6 w-6" />, title: "VPN Comercial", price: "€15/mes", desc: "VPN de alta velocidad para juego casual o como backup.", features: ["Alta velocidad", "Múltiples ubicaciones", "Fácil configuración"], available: true },
  { icon: <Database className="h-6 w-6" />, title: "Datamining", price: "€30/mes", desc: "Paquete de datos de manos de las principales salas, actualización semanal.", features: ["Millones de manos", "Actualización semanal", "Formato HM3/PT4"], available: true },
  { icon: <Wrench className="h-6 w-6" />, title: "PokerTracker 4", price: "€70", desc: "Licencia de PokerTracker 4 con descuento exclusivo para miembros MPD.", features: ["Licencia completa", "Descuento exclusivo", "Soporte instalación"], available: true },
  { icon: <Wrench className="h-6 w-6" />, title: "PioSolver", price: "€200", desc: "Licencia de PioSolver con precio especial para miembros MPD.", features: ["Licencia PioSolver", "Descuento MPD", "Guía de uso"], available: true },
  { icon: <GraduationCap className="h-6 w-6" />, title: "Coaching 1-on-1", price: "€120/sesión", desc: "Sesión de coaching personalizado de 90 minutos con un coach profesional.", features: ["90 minutos", "Revisión de manos", "Plan de mejora"], available: true },
  { icon: <Wallet className="h-6 w-6" />, title: "Bancaje Selectivo", price: "Consultar", desc: "Financiación parcial de bankroll 50/50 para jugadores cualificados.", features: ["50/50 contribución", "Revisión mensual", "Makeup tracking"], available: false },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-mpd-white">Servicios del Ecosistema</h1>
            <p className="mt-2 text-mpd-gray">Todo lo que necesitas para profesionalizar tu poker</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.title} className="hover:border-mpd-gold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold">
                      {s.icon}
                    </div>
                    <Badge variant={s.available ? "success" : "warning"}>
                      {s.available ? "Disponible" : "Selectivo"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-mpd-white">{s.title}</h3>
                  <p className="text-2xl font-bold font-mono text-mpd-gold mt-1">{s.price}</p>
                  <p className="text-sm text-mpd-gray mt-2">{s.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {s.features.map((f, i) => (
                      <li key={i} className="text-xs text-mpd-gray flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-mpd-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-mpd-gray mb-4">Todos los servicios se pagan con saldo interno de rakeback</p>
            <Button size="lg" asChild>
              <Link href="/register">
                Únete para Acceder <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
