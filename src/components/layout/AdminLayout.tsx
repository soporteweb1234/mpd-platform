import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { NAVIGATION } from "@/lib/constants";

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-mpd-black">
      <Sidebar
        items={NAVIGATION.admin}
        user={{
          name: session.user.name ?? "Admin",
          avatar: session.user.avatar,
          role: session.user.role,
        }}
        type="admin"
      />
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
