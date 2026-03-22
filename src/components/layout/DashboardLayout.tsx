import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { NAVIGATION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      avatar: true,
      stratum: true,
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
          availableBalance: user.availableBalance,
        }}
        type="dashboard"
      />
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
