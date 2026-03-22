import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Actividad — Admin" };

export default async function AdminActivityPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Log de Actividad</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/30">
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Acción</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Entidad</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/50">
                    <td className="py-3 px-4 text-mpd-gray-dark text-xs font-mono">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3 px-4 text-mpd-white">{log.user?.name ?? "Sistema"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                    </td>
                    <td className="py-3 px-4 text-mpd-gray">{log.entityType ?? "-"}</td>
                    <td className="py-3 px-4 text-mpd-gray-dark text-xs font-mono">{log.ipAddress ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
