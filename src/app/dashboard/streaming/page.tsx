import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Clock } from "lucide-react";

export const metadata = { title: "Streaming" };

export default async function StreamingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Streaming</h1>

      <div className="flex items-center justify-center min-h-[420px]">
        <Card className="w-full max-w-md border-mpd-gold/20 bg-mpd-surface">
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-mpd-gold/10 border border-mpd-gold/20">
              <Radio className="h-10 w-10 text-mpd-gold" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mpd-amber/10 border border-mpd-amber/20 text-mpd-amber text-xs font-medium">
                <Clock className="h-3 w-3" />
                Próximamente
              </div>
              <h2 className="text-xl font-bold text-mpd-white">
                Streams en Vivo MPD
              </h2>
              <p className="text-sm text-mpd-gray leading-relaxed max-w-sm">
                Sesiones en directo de la comunidad: análisis de manos,
                torneos comentados y entrevistas con jugadores de referencia.
                Solo para miembros activos.
              </p>
            </div>

            <div className="w-full grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "Formato", value: "En directo" },
                { label: "Acceso", value: "Miembros" },
                { label: "Archivo", value: "72h VOD" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-0.5 rounded-lg bg-mpd-black/50 border border-mpd-border p-3 text-center"
                >
                  <span className="text-xs text-mpd-gold font-medium">{item.value}</span>
                  <span className="text-[10px] text-mpd-gray-dark">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-mpd-gray-dark">
              Recibirás una notificación cuando se emita el primer stream.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
