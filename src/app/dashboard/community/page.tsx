import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChannels } from "@/lib/actions/community";
import { CommunityChat } from "@/components/community/CommunityChat";

export const metadata = {
  title: "Comunidad | MPD",
  description: "Chat de la comunidad Manager Poker Deal",
};

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const channels = await getChannels();

  return (
    <CommunityChat
      channels={channels}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        nickname: session.user.nickname,
        avatar: session.user.avatar,
        stratum: session.user.stratum,
        role: session.user.role,
      }}
    />
  );
}
