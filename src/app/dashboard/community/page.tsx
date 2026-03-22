import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChannels } from "@/lib/actions/community";
import { CommunityChat } from "@/components/community/CommunityChat";

export const metadata = { title: "Comunidad" };

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const channels = await getChannels();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-mpd-white">Comunidad</h1>
      <CommunityChat
        channels={channels}
        currentUser={{
          id: session.user.id,
          name: session.user.name ?? "Jugador",
          nickname: session.user.nickname,
          avatar: session.user.avatar,
          stratum: session.user.stratum,
          role: session.user.role,
        }}
      />
    </div>
  );
}
