import { Users, Gift, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function ReferralStatsCards({
  totalReferrals,
  activeReferrals,
  kFactor,
  lifetimeEarnings,
  pendingEarnings,
}: {
  totalReferrals: number;
  activeReferrals: number;
  kFactor: number;
  lifetimeEarnings: number;
  pendingEarnings: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Stat
        icon={<Users className="h-4 w-4 text-mpd-white" />}
        label="Total referidos"
        value={String(totalReferrals)}
      />
      <Stat
        icon={<Gift className="h-4 w-4 text-mpd-green" />}
        label="Activos"
        value={String(activeReferrals)}
      />
      <Stat
        icon={<TrendingUp className="h-4 w-4 text-mpd-gold" />}
        label="K-factor"
        value={kFactor.toFixed(2)}
        hint={kFactor >= 1 ? "Viral" : "Pre-viral"}
      />
      <Stat
        icon={<DollarSign className="h-4 w-4 text-mpd-green" />}
        label="Ganado lifetime"
        value={fmtMoney(lifetimeEarnings)}
      />
      <Stat
        icon={<Clock className="h-4 w-4 text-mpd-amber" />}
        label="Pendiente"
        value={fmtMoney(pendingEarnings)}
        hint="Se libera tras hold"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <p className="text-[10px] uppercase tracking-wide text-mpd-gray">{label}</p>
        </div>
        <p className="text-lg font-mono text-mpd-white">{value}</p>
        {hint && <p className="text-[10px] text-mpd-gray mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}
