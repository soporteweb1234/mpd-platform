import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Servicios — Admin" };

const categoryLabels: Record<string, string> = {
  VPN: "VPN",
  DATAMINING: "Datamining",
  TOOLS: "Herramientas",
  COACHING: "Coaching",
  OTHER: "Otros",
};

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Servicios</h1>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Servicio
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:border-mpd-border-light transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-mpd-white">{service.name}</h3>
                <Badge variant={service.status === "AVAILABLE" ? "success" : service.status === "COMING_SOON" ? "warning" : "secondary"}>
                  {service.status === "AVAILABLE" ? "Disponible" : service.status === "COMING_SOON" ? "Próximamente" : "Descontinuado"}
                </Badge>
              </div>
              <p className="text-xs text-mpd-gray mb-2">{service.shortDescription}</p>
              <div className="flex items-center justify-between text-xs mb-3">
                <Badge variant="outline">{categoryLabels[service.category] ?? service.category}</Badge>
                <span className="font-mono text-mpd-gold font-medium">{formatCurrency(service.priceEur)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-mpd-gray">{service._count.orders} pedidos</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/services/${service.id}`}>Editar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
