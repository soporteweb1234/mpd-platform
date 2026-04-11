import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Database, Wrench, GraduationCap, Wallet, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Servicios",
  description: "Servicios premium del ecosistema Manager Poker Deal: conexión, datamining, herramientas, coaching y bancaje.",
};

const services = [
  { icon: <Shield className="h-6 w-6" />, title: "Servicios de Conexión", price: "Consultar", desc: "Soluciones de conectividad profesional adaptadas a tu situación y necesidades.", features: ["Configuración personalizada", "Conexión estable 24/7", "Soporte técnico dedicado"], available: true, special: true },
  { icon: <Database className="h-6 w-6" />, title: "Datamining", price: "€30/mes", desc: "Paquete de datos de manos de las principales salas para mejorar tu análisis.", features: ["Millones de manos", "Todas las salas principales", "Formato HM3/PT4"], available: true, special: false },
  { icon: <Wrench className="h-6 w-6" />, title: "PokerTracker 4", price: "€70", desc: "Licencia de PokerTracker 4 a precio de grupo.", features: ["Licencia completa", "Descuento exclusivo", "Soporte instalación"], available: true, special: false },
  { icon: <Wrench className="h-6 w-6" />, title: "PioSolver", price: "€200", desc: "Licencia de PioSolver a precio de grupo.", features: ["Licencia PioSolver", "Precio de grupo", "Guía de uso"], available: true, special: false },
  { icon: <ShoppingBag className="h-6 w-6" />, title: "Más Herramientas", price: "Consultar", desc: "HUDs, solvers, scripts y software profesional a precio de grupo.", features: ["HUDs y trackers", "Solvers y calculadoras", "Scripts y utilidades"], available: true, special: false },
  { icon: <GraduationCap className="h-6 w-6" />, title: "Sesiones de Estudio y Coaching", price: "€120/sesión", desc: "Sesiones grupales y coaching personalizado con profesionales.", features: ["Sesiones de 90 minutos", "Revisión de manos", "Plan de mejora personalizado"], available: true, special: false },
  { icon: <Wallet className="h-6 w-6" />, title: "Bancaje Selectivo", price: "Consultar", desc: "Financiación parcial de bankroll 50/50 para jugadores cualificados.", features: ["50/50 contribución", "Revisión mensual", "Makeup tracking"], available: false, special: false },
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
                  {s.special && (
                    <Link href="/contacto" className="inline-block mt-3">
                      <Badge variant="warning" className="text-[10px] hover:bg-mpd-amber/30 transition-colors cursor-pointer">
                        Requiere servicios especiales (+info)
                      </Badge>
                    </Link>
                  )}
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
