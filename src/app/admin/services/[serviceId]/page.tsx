import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceEditForm } from "@/components/admin/ServiceEditForm";
import { ServiceWhitelistManager } from "@/components/admin/ServiceWhitelistManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Editar servicio — Admin" };

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const [service, users] = await Promise.all([
    prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        whitelist: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!service) notFound();

  const whitelistUsers = service.whitelist.map((w) => w.user);
  const whitelistIds = new Set(whitelistUsers.map((u) => u.id));
  const candidateUsers = users.filter((u) => !whitelistIds.has(u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">{service.name}</h1>
          <p className="text-sm text-mpd-gray">
            {service.category} · slug <span className="font-mono">{service.slug}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceEditForm
            service={{
              id: service.id,
              name: service.name,
              slug: service.slug,
              category: service.category,
              description: service.description,
              shortDescription: service.shortDescription,
              icon: service.icon,
              priceEur: service.priceEur,
              priceInBalance: service.priceInBalance,
              isRecurring: service.isRecurring,
              recurringPeriod: service.recurringPeriod,
              features: service.features,
              setupInstructions: service.setupInstructions,
              status: service.status,
              requiredStratum: service.requiredStratum,
              sortOrder: service.sortOrder,
              priceVisible: service.priceVisible,
              locked: service.locked,
              lockedLabel: service.lockedLabel,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Whitelist</span>
            <span className="text-xs font-normal text-mpd-gray">
              Usuarios con acceso aunque el servicio esté bloqueado
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceWhitelistManager
            serviceId={service.id}
            members={whitelistUsers}
            candidates={candidateUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
