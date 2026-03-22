import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInterface } from "@/components/shared/ChatInterface";

export const metadata = { title: "Chat Bot" };

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-mpd-white">Chat con Asistente MPD</h1>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-mpd-green" />
            Asistente MPD
          </CardTitle>
          <p className="text-xs text-mpd-gray">Pregúntame sobre rakeback, salas, VPN o cualquier duda</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ChatInterface botType="FAQ" userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
