import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { NAVIGATION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { toNum } from "@/lib/money";
import { GlobalSearchMount } from "@/components/shared/GlobalSearchMount";

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatar: true,
      stratum: true,
      statusLevel: true,
      prestigeScore: true,
      reputationScore: true,
      role: true,
      availableBalance: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-mpd-black">
      <Sidebar
        items={NAVIGATION.dashboard}
        user={{
          name: user.name,
          avatar: user.avatar,
          stratum: user.stratum,
          statusLevel: user.statusLevel,
          prestigeScore: user.prestigeScore,
          reputationScore: user.reputationScore,
          role: user.role,
          availableBalance: toNum(user.availableBalance),
        }}
        type="dashboard"
      />
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
      <GlobalSearchMount />
    </div>
  );
}
