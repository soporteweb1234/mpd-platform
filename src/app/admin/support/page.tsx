import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Soporte — Admin" };

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_USER"] as const;
const HISTORY_STATUSES = ["RESOLVED", "CLOSED"] as const;

const statusLabels: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  WAITING_USER: "Esperando usuario",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const statusVariant: Record<string, "warning" | "default" | "success" | "secondary"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  WAITING_USER: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const priorityVariant: Record<string, "secondary" | "default" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Técnica",
  BILLING: "Facturación",
  ACCOUNT: "Cuenta",
  RAKEBACK: "Rakeback",
  SERVICE: "Servicio",
  OTHER: "Otra",
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "history" ? "history" : "open";
  const statuses = tab === "history" ? HISTORY_STATUSES : OPEN_STATUSES;

  const where: Record<string, unknown> = { status: { in: statuses } };
  if (params.category) where.category = params.category;
  if (params.priority) where.priority = params.priority;

  const [tickets, openCount, historyCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.supportTicket.count({ where: { status: { in: [...HISTORY_STATUSES] } } }),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    const merged = { tab, category: params.category, priority: params.priority, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) qs.set(k, v);
    }
    return `/admin/support?${qs.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Tickets de Soporte</h1>

      <div className="flex items-center gap-1 border-b border-mpd-border">
        <TabLink
          href={buildUrl({ tab: "open" })}
          active={tab === "open"}
          label="Abiertas"
          count={openCount}
        />
        <TabLink
          href={buildUrl({ tab: "history" })}
          active={tab === "history"}
          label="Historial"
          count={historyCount}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-mpd-gray">Filtros:</span>
        <FilterGroup
          label="Categoría"
          current={params.category}
          options={Object.keys(CATEGORY_LABELS).map((k) => ({ value: k, label: CATEGORY_LABELS[k] }))}
          buildHref={(v) => buildUrl({ category: v })}
        />
        <FilterGroup
          label="Prioridad"
          current={params.priority}
          options={[
            { value: "LOW", label: "Baja" },
            { value: "MEDIUM", label: "Media" },
            { value: "HIGH", label: "Alta" },
            { value: "URGENT", label: "Urgente" },
          ]}
          buildHref={(v) => buildUrl({ priority: v })}
        />
        {(params.category || params.priority) && (
          <Button size="sm" variant="ghost" asChild>
            <Link href={buildUrl({ category: undefined, priority: undefined })}>Limpiar</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/30">
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Asunto</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Jugador</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Categoría</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Prioridad</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Estado</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Mensajes</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Fecha</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/50">
                    <td className="py-3 px-4 text-mpd-white">{ticket.subject}</td>
                    <td className="py-3 px-4 text-mpd-gray">{ticket.user.name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={statusVariant[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-mpd-gray">{ticket._count.messages}</td>
                    <td className="py-3 px-4 text-right text-mpd-gray">{formatDate(ticket.updatedAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/support/${ticket.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-mpd-gray">
                      {tab === "open"
                        ? "No hay tickets abiertos con los filtros aplicados."
                        : "Sin historial para los filtros aplicados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-mpd-gold text-mpd-white"
          : "border-transparent text-mpd-gray hover:text-mpd-white"
      }`}
    >
      {label}
      <span className="ml-2 text-xs text-mpd-gray">({count})</span>
    </Link>
  );
}

function FilterGroup({
  label,
  current,
  options,
  buildHref,
}: {
  label: string;
  current: string | undefined;
  options: { value: string; label: string }[];
  buildHref: (v: string | undefined) => string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-mpd-gray">{label}:</span>
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={active ? buildHref(undefined) : buildHref(opt.value)}
            className={`rounded px-2 py-0.5 ${
              active
                ? "bg-mpd-gold/20 text-mpd-gold"
                : "text-mpd-gray hover:text-mpd-white"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
