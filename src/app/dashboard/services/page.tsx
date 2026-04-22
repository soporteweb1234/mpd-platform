import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getStratumLabel, formatUSD } from "@/lib/utils";
import {
  ShoppingBag,
  Shield,
  Globe,
  Database,
  Wrench,
  GraduationCap,
  Lock,
  MessageCircle,
  Send,
} from "lucide-react";
import { getBooleanSetting, SETTING_KEYS } from "@/lib/settings";
import Link from "next/link";

export const metadata = { title: "Servicios" };

const categoryIcons: Record<string, React.ReactNode> = {
  VPN: <Shield className="h-5 w-5" />,
  VPN_RESIDENTIAL: <Globe className="h-5 w-5" />,
  DATAMINING: <Database className="h-5 w-5" />,
  TOOLS: <Wrench className="h-5 w-5" />,
  COACHING: <GraduationCap className="h-5 w-5" />,
  OTHER: <ShoppingBag className="h-5 w-5" />,
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  COMING_SOON: "Próximamente",
  DISCONTINUED: "No disponible",
};

/**
 * CAMBIOS 9.1 — VPN ahora se muestra en 2 modalidades:
 *   1. "Red internacional residencial HtH" — para multi-región
 *   2. "Red comercial" — datacenter estándar
 * El display aplica overrides de naming sobre servicios cat=VPN según su slug/name.
 */
function resolveVpnLabel(name: string, slug: string): string {
  const key = `${name} ${slug}`.toLowerCase();
  if (/resid|hth|international|internacional/.test(key)) {
    return "Red internacional residencial HtH";
  }
  if (/comercial|commercial|datacenter|dc/.test(key)) {
    return "Red comercial";
  }
  return name;
}

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [services, userOrders, showPrices] = await Promise.all([
    prisma.service.findMany({
      where: { status: { not: "DISCONTINUED" } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.serviceOrder.findMany({
      where: { userId: session.user.id },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    }),
    getBooleanSetting(SETTING_KEYS.SERVICES_SHOW_PRICES, false),
  ]);

  const stratum = session.user.stratum;
  const strataOrder = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"];
  const userStratumIndex = strataOrder.indexOf(stratum);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Servicios</h1>
        <p className="mt-1 text-sm text-mpd-gray">
          Servicios del ecosistema MPD. Para adquirir cualquiera, abre un ticket
          o escríbenos por Telegram.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const requiredIndex = service.requiredStratum
            ? strataOrder.indexOf(service.requiredStratum)
            : -1;
          const isLocked = requiredIndex > userStratumIndex;
          const isComingSoon = service.status === "COMING_SOON";
          const displayName =
            service.category === "VPN"
              ? resolveVpnLabel(service.name, service.slug)
              : service.name;

          return (
            <Card
              key={service.id}
              className={`relative flex flex-col ${
                isLocked || isComingSoon ? "opacity-60" : "hover:border-mpd-gold/30"
              } transition-colors`}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-mpd-black/60 rounded-xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-mpd-gray mx-auto mb-1" />
                    <p className="text-xs text-mpd-gray">
                      Disponible desde {getStratumLabel(service.requiredStratum!)}
                    </p>
                  </div>
                </div>
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center text-mpd-gold">
                      {categoryIcons[service.category] ?? (
                        <ShoppingBag className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-mpd-white">{displayName}</h3>
                      <Badge
                        variant={isComingSoon ? "warning" : "success"}
                        className="mt-0.5"
                      >
                        {statusLabels[service.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-mpd-gray mb-3">
                  {service.shortDescription}
                </p>
                {service.features.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {service.features.slice(0, 3).map((f, i) => (
                      <li
                        key={i}
                        className="text-xs text-mpd-gray flex items-center gap-1.5"
                      >
                        <span className="h-1 w-1 rounded-full bg-mpd-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-3 border-t border-mpd-border/50 space-y-2">
                  {showPrices && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono text-mpd-gold">
                        {formatUSD(service.priceEur)}
                      </span>
                      {service.isRecurring && (
                        <span className="text-[10px] text-mpd-gray">
                          /{service.recurringPeriod?.toLowerCase()}
                        </span>
                      )}
                    </div>
                  )}
                  {!isLocked && !isComingSoon && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link
                          href={`/dashboard/support/new?subject=${encodeURIComponent(
                            `Adquirir: ${displayName}`,
                          )}&category=OTHER&message=${encodeURIComponent(
                            `Hola, me interesa adquirir el servicio "${displayName}". Quedo a la espera de información sobre el proceso de pago.`,
                          )}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                          Adquirir
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10"
                      >
                        <a
                          href="https://t.me/mpd_soporte"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Contactar por Telegram"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userOrders.length > 0 && (
        <div>
          <SectionHeading title="Mis Compras" className="mb-4" />
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-mpd-white">{order.service.name}</p>
                      <p className="text-xs text-mpd-gray">
                        {new Date(order.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {showPrices && (
                        <span className="text-sm font-mono text-mpd-white">
                          {formatUSD(order.amount)}
                        </span>
                      )}
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "success"
                            : order.status === "PENDING"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {order.status === "DELIVERED"
                          ? "Entregado"
                          : order.status === "PENDING"
                            ? "Pendiente"
                            : order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
