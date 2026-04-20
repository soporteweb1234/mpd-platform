import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, CheckCircle2, Clock, MessageCircle, Send,
  UserPlus, CreditCard, BarChart3, ArrowLeft, ExternalLink, Shield
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await prisma.pokerRoom.findUnique({ where: { slug }, select: { name: true } });
  return { title: room ? `${room.name} — Alta MPD` : "Sala" };
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;

  const room = await prisma.pokerRoom.findUnique({
    where: { slug },
    include: {
      rakebackTiers: { orderBy: { stratum: "asc" } },
    },
  });

  if (!room) notFound();

  const affiliation = await prisma.roomAffiliation.findFirst({
    where: { userId: session.user.id, roomId: room.id },
  });

  const isAffiliated = Boolean(affiliation);

  const steps = [
    {
      num: 1,
      icon: <UserPlus className="h-5 w-5" />,
      title: "Crea tu cuenta en la sala",
      desc: room.setupGuide
        ? room.setupGuide
        : `Regístrate en ${room.name} usando nuestro código de afiliación. Sin código no se puede gestionar tu rakeback.`,
      cta: room.website
        ? { label: `Ir a ${room.name}`, href: room.website, external: true }
        : null,
    },
    {
      num: 2,
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Contacta con MPD",
      desc: "Envíanos el mensaje 'Alta en sala' con tu nick en la sala y el código de afiliación usado. Gestionamos el resto.",
      ctaGroup: true,
    },
    {
      num: 3,
      icon: <CreditCard className="h-5 w-5" />,
      title: "MPD completa el alta",
      desc: "Tramitamos tu afiliación directamente con la sala. Recibirás confirmación cuando esté activa.",
      cta: null,
    },
    {
      num: 4,
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Recibe tu rakeback mensual",
      desc: "Al cierre de cada mes cargamos tu rakeback en tu saldo MPD. Consúltalo en la sección Rakeback.",
      cta: { label: "Ver Rakeback", href: "/dashboard/rakeback", external: false },
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Button variant="ghost" size="sm" className="text-mpd-gray hover:text-mpd-white -ml-2" asChild>
        <Link href="/dashboard/rooms">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Mis Salas
        </Link>
      </Button>

      {/* Room header */}
      <Card className={isAffiliated ? "border-mpd-green/30" : "border-mpd-gold/20"}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-mpd-gold/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-mpd-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-mpd-white">{room.name}</h1>
                <p className="text-sm text-mpd-gray">Rakeback base: {room.rakebackBase}%</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {isAffiliated ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {affiliation?.verified ? "Verificada" : "Pendiente"}
                </Badge>
              ) : (
                <Badge variant="outline">Disponible</Badge>
              )}
              {room.vpnRequired && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Requiere VPN
                </Badge>
              )}
            </div>
          </div>
          {room.description && (
            <p className="mt-3 text-sm text-mpd-gray">{room.description}</p>
          )}
          {room.affiliateCode && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-mpd-black/50 border border-mpd-border">
              <span className="text-xs text-mpd-gray">Código de afiliación:</span>
              <code className="text-xs font-mono text-mpd-gold font-semibold">{room.affiliateCode}</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flow steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proceso de alta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              <div className="flex gap-4">
                {/* Step indicator + connector */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isAffiliated && step.num <= 2 ? "bg-mpd-green/10 border-mpd-green/40 text-mpd-green" : "bg-mpd-gold/10 border-mpd-gold/30 text-mpd-gold"}`}>
                    {isAffiliated && step.num <= 2 ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-mpd-border min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mpd-white font-medium text-sm">{step.title}</span>
                  </div>
                  <p className="text-xs text-mpd-gray leading-relaxed">{step.desc}</p>

                  {/* Telegram / WhatsApp CTA */}
                  {step.ctaGroup && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" asChild className="bg-[#229ED9] hover:bg-[#1a8fc4] text-white border-0">
                        <a href="https://t.me/mpd_soporte" target="_blank" rel="noopener noreferrer">
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          Telegram
                        </a>
                      </Button>
                      <Button size="sm" asChild className="bg-[#25D366] hover:bg-[#1da851] text-white border-0">
                        <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Single CTA */}
                  {step.cta && (
                    <div className="mt-3">
                      {step.cta.external ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={step.cta.href} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            {step.cta.label}
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={step.cta.href}>{step.cta.label}</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* VPN instructions */}
      {room.vpnRequired && room.vpnInstructions && (
        <Card className="border-mpd-amber/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-mpd-amber" />
              Instrucciones VPN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-mpd-gray whitespace-pre-line">{room.vpnInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Already affiliated state */}
      {isAffiliated && (
        <Card className="border-mpd-green/20 bg-mpd-green/5">
          <CardContent className="p-5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-mpd-green shrink-0" />
            <div>
              <p className="text-sm font-medium text-mpd-white">
                {affiliation?.verified ? "Afiliación verificada" : "Solicitud en proceso"}
              </p>
              <p className="text-xs text-mpd-gray">
                {affiliation?.verified
                  ? "Tu cuenta en esta sala está vinculada con MPD. El rakeback se carga mensualmente."
                  : "Estamos verificando tu afiliación. Te notificaremos cuando esté activa."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
