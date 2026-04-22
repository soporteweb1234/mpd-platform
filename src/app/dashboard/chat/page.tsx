import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInterface } from "@/components/shared/ChatInterface";

export const metadata = { title: "Chat MPD" };

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  const firstName = (user?.name ?? "").split(" ")[0] || "jugador";
  const welcome = `Hola ${firstName}, soy Chat MPD — tu asistente personal dentro del ecosistema. Pregúntame cualquier duda sobre rakeback, salas, saldo o servicios.`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl text-mpd-white">Chat MPD</h1>
        <p className="mt-1 text-sm text-mpd-gray">
          Tu asistente dentro del ecosistema Manager Poker Deals.
        </p>
      </div>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-mpd-green" />
            Chat MPD
          </CardTitle>
          <p className="text-xs text-mpd-gray">{welcome}</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ChatInterface botType="FAQ" userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
