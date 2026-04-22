import Link from "next/link";
import { MessageSquare, Wallet, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Configuración — Admin" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/admin/settings/discord",
    label: "Discord",
    description: "Bot, token, guild, sync de canales e importación de histórico.",
    icon: MessageSquare,
  },
  {
    href: "/admin/settings/wallets",
    label: "Wallets USDT",
    description: "Direcciones corporativas ERC20 / TRC20 / BEP20 para retiros.",
    icon: Wallet,
  },
];

export default async function AdminSettingsHubPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-mpd-border bg-mpd-surface p-2.5">
          <SettingsIcon className="h-5 w-5 text-mpd-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Configuración</h1>
          <p className="text-sm text-mpd-gray">Ajustes globales del sistema.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="hover:border-mpd-gold/40 transition-colors">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-2">
                    <Icon className="h-4 w-4 text-mpd-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-mpd-white">{s.label}</p>
                    <p className="text-xs text-mpd-gray mt-0.5">{s.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-mpd-gray" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
