import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin, AuthzError } from "@/lib/auth/guards";
import { GlobalSearchMount } from "@/components/shared/GlobalSearchMount";

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    if (err instanceof AuthzError) {
      redirect(err.status === 401 ? "/login" : "/dashboard");
    }
    throw err;
  }

  return (
    <div className="min-h-screen bg-mpd-black">
      <AdminSidebar
        user={{
          name: session.user.name ?? "Admin",
          avatar: session.user.avatar,
          role: session.user.role,
        }}
      />
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
      <GlobalSearchMount />
    </div>
  );
}
