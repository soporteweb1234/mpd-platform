import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Clock } from "lucide-react";

export const metadata = { title: "Cursos" };

export default async function CursosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Cursos</h1>

      <div className="flex items-center justify-center min-h-[420px]">
        <Card className="w-full max-w-md border-mpd-gold/20 bg-mpd-surface">
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-mpd-gold/10 border border-mpd-gold/20">
              <GraduationCap className="h-10 w-10 text-mpd-gold" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mpd-amber/10 border border-mpd-amber/20 text-mpd-amber text-xs font-medium">
                <Clock className="h-3 w-3" />
                Próximamente
              </div>
              <h2 className="text-xl font-bold text-mpd-white">
                Cursos de Poker MPD
              </h2>
              <p className="text-sm text-mpd-gray leading-relaxed max-w-sm">
                Grupos cerrados de estudio con análisis de manos, teoría avanzada
                y retroalimentación personalizada. Máximo 12 alumnos por cohorte.
              </p>
            </div>

            <div className="w-full grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "Sesiones en vivo", value: "Semanales" },
                { label: "Tamaño grupo", value: "Máx. 12" },
                { label: "Nivel mínimo", value: "NL25+" },
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
              Recibirás una notificación cuando se abra la próxima convocatoria.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
