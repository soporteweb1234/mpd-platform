import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark } from "lucide-react";

export const metadata = { title: "MPD Staking" };

export default function StakingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-mpd-white">MPD Staking</h1>
        <Badge variant="warning">Próximamente</Badge>
      </div>

      <Card className="border-mpd-gold/20">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-mpd-white mb-2">
            Bancaje y Staking entre la comunidad
          </h2>
          <p className="text-mpd-gray max-w-lg mx-auto">
            MPD Staking permitirá a los miembros de la comunidad participar en bancajes colectivos,
            invertir en jugadores cualificados y generar rendimientos basados en el rendimiento
            real de las mesas. Un sistema transparente, con métricas verificables y respaldado
            por la reputación dentro del ecosistema MPD.
          </p>
          <p className="mt-4 text-sm text-mpd-gray-dark">
            Estamos trabajando en los detalles. Pronto tendrás más información.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
