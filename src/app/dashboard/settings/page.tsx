import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/forms/ProfileSettingsForm";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, nickname: true, email: true, country: true,
      playingLevel: true, weeklyHours: true, primaryRoom: true,
      availability: true, bio: true,
      discordConnected: true, discordUsername: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-mpd-white">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discord</CardTitle>
        </CardHeader>
        <CardContent>
          {user.discordConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mpd-white">Conectado como <span className="text-mpd-gold">{user.discordUsername}</span></p>
                <p className="text-xs text-mpd-gray mt-0.5">Tu cuenta de Discord está vinculada</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-mpd-green" />
            </div>
          ) : (
            <div>
              <p className="text-sm text-mpd-gray mb-3">Vincula tu cuenta de Discord para recibir notificaciones y acceder a la comunidad.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}