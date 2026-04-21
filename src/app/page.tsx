import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight, Calculator, Shield, Database, Wrench, GraduationCap, Users,
  TrendingUp, CheckCircle2, Zap, BarChart3, Wallet, ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 text-mpd-gold border-mpd-gold/30">
              Ecosistema integral para jugadores de poker
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-mpd-white leading-[1.05]">
              Tú juegas al poker.
              <span className="block mt-2 tagline-glow">
                Nosotros resolvemos todo lo demás.
              </span>
            </h1>
            <p className="mt-6 text-lg text-mpd-gray max-w-2xl">
              Manager Poker Deals es tu plataforma integral: rakeback optimizado, herramientas profesionales,
              coaching, comunidad y gestión de bankroll. Todo en un solo lugar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/calculadora">
                  <Calculator className="mr-2 h-5 w-5" />
                  Calcula tu Rakeback
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/register">
                  Únete Ahora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-8 text-sm text-mpd-gray">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-mpd-green" />
                Rakeback optimizado en las mejores salas
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-mpd-gold" />
                Ecosistema integral para jugadores
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 border-t border-mpd-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mpd-white">Cómo Funciona</h2>
            <p className="mt-2 text-mpd-gray">En 4 simples pasos empiezas a optimizar tu poker</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", icon: <Users className="h-6 w-6" />, title: "Regístrate", desc: "Crea tu cuenta y cuéntanos tu nivel de juego" },
              { step: "02", icon: <BarChart3 className="h-6 w-6" />, title: "Elige tu sala", desc: "Analizamos tu perfil, stake, situación particular y temporalidad para recomendarte la opción con mejor relación calidad-precio para ti" },
              { step: "03", icon: <Zap className="h-6 w-6" />, title: "Juega", desc: "Juega como siempre. Tu rakeback se acumula automáticamente. Pertenece a la comunidad MPD: accede a recursos exclusivos y retroalimentación de otros jugadores" },
              { step: "04", icon: <Wallet className="h-6 w-6" />, title: "Canjea", desc: "Usa tu saldo en servicios premium o retíralo" },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="relative mx-auto mb-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-mpd-surface border border-mpd-border group-hover:border-mpd-gold/50 flex items-center justify-center text-mpd-gold transition-colors">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-mpd-gold text-mpd-black text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-mpd-white">{item.title}</h3>
                <p className="mt-1 text-sm text-mpd-gray">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-mpd-surface/30 border-t border-mpd-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mpd-white">Ecosistema Completo</h2>
            <p className="mt-2 text-mpd-gray">Todo lo que necesitas para profesionalizar tu poker</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingUp className="h-5 w-5" />, title: "Rakeback Optimizado", desc: "Los mejores % de rakeback negociados con las principales salas", badge: "Core", special: false },
              { icon: <Shield className="h-5 w-5" />, title: "Redes", desc: "Soluciones de conectividad profesional adaptadas a tu situación", badge: "Especial", special: true },
              { icon: <Database className="h-5 w-5" />, title: "Datamining", desc: "Millones de manos de todas las salas para mejorar tu análisis", badge: "Disponible", special: false },
              { icon: <Wrench className="h-5 w-5" />, title: "Herramientas con Descuento", desc: "HUDs, solvers, scripts y software a precio de grupo", badge: "Disponible", special: false },
              { icon: <GraduationCap className="h-5 w-5" />, title: "Sesiones de Estudio y Coaching", desc: "Formación trimestral con profesionales y sesiones 1-on-1", badge: "Disponible", special: false },
              { icon: <Wallet className="h-5 w-5" />, title: "Bancaje Selectivo", desc: "Financiación parcial de bankroll para jugadores cualificados", badge: "Selectivo", special: false },
            ].map((item) => (
              <Card key={item.title} className="group hover:border-mpd-gold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold group-hover:bg-mpd-gold/20 transition-colors">
                      {item.icon}
                    </div>
                    <Badge variant={item.badge === "Core" ? "default" : item.badge === "Selectivo" ? "warning" : item.badge === "Especial" ? "outline" : "success"} className="text-[10px]">
                      {item.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-mpd-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-mpd-gray">{item.desc}</p>
                  {item.special && (
                    <Link href="/contacto" className="inline-block mt-2">
                      <Badge variant="warning" className="text-[10px] hover:bg-mpd-amber/30 transition-colors cursor-pointer">
                        Requiere servicios especiales (+info)
                      </Badge>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/contacto">
                Pedir +info para adaptar tu perfil, stake, situación y temporalidad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <section className="py-20 border-t border-mpd-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mpd-white">Comunidad MPD</h2>
            <p className="mt-2 text-mpd-gray">Más que una plataforma: una red de jugadores que crece junta</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Users className="h-5 w-5" />, title: "Networking", desc: "Conecta con jugadores de tu nivel y amplía tu red de contactos en el poker profesional" },
              { icon: <GraduationCap className="h-5 w-5" />, title: "Aprendizaje Colectivo", desc: "Retroalimentación constante, análisis de manos compartido y debates estratégicos" },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Participación Activa", desc: "Ventajas exclusivas por contribuir a la comunidad: comparte, enseña y crece" },
              { icon: <Shield className="h-5 w-5" />, title: "Galones y Prestigio", desc: "Sistema de insignias, logros e índice de prestigio dentro de la comunidad (próximamente)" },
            ].map((item) => (
              <Card key={item.title} className="group hover:border-mpd-gold/30 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold group-hover:bg-mpd-gold/20 transition-colors mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-mpd-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-mpd-gray">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-mpd-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mpd-white">Preguntas Frecuentes</h2>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="space-y-4">
            {[
              { q: "¿Qué es el rakeback?", a: "Es un porcentaje del rake (comisión) que generas jugando poker online y que se te devuelve. Con MPD, negociamos los mejores porcentajes y te lo acumulamos como saldo interno." },
              { q: "¿Tiene algún coste registrarse?", a: "No. El registro en MPD es completamente gratuito. Solo necesitas registrarte en una de nuestras salas afiliadas con nuestro código." },
              { q: "¿Cómo funciona el saldo interno?", a: "Tu rakeback se acumula como crédito dentro de MPD. Puedes usarlo para comprar servicios (VPN, datamining, cursos) o solicitarlo como retiro." },
              { q: "¿Puedo jugar en todas las salas?", a: "El acceso a cada sala puede depender de tu ubicación y situación particular. Contacta con nuestro equipo y te asesoramos sobre las opciones disponibles para tu caso." },
              { q: "¿Qué salas están disponibles?", a: "Trabajamos con PokerStars, GGPoker, 888poker, WPT Global e iPoker Network. Estamos constantemente negociando con nuevas salas." },
              { q: "¿Puedo referir a otros jugadores?", a: "Sí. Cada usuario tiene un código de referido único. Cuando alguien se registra con tu código, recibes comisiones por su actividad." },
            ].map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between p-4 rounded-lg bg-mpd-surface border border-mpd-border cursor-pointer hover:border-mpd-border-light transition-colors list-none">
                  <span className="text-sm font-medium text-mpd-white">{item.q}</span>
                  <ChevronDown className="h-4 w-4 text-mpd-gray group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <p className="text-sm text-mpd-gray">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-mpd-surface/50 to-mpd-black border-t border-mpd-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-mpd-white">
            ¿Listo para optimizar tu poker?
          </h2>
          <p className="mt-4 text-lg text-mpd-gray">
            Únete a Manager Poker Deal y empieza a recibir rakeback desde tu primera sesión.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Crear Cuenta <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/calculadora">Calcula tu Rakeback</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
