import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthzError } from "@/lib/auth/guards";
import { TwoFactorEnroll } from "@/components/admin/TwoFactorEnroll";

export const metadata = { title: "Activar 2FA — Admin" };

export default async function TwoFactorSetupPage() {
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    if (err instanceof AuthzError) redirect(err.status === 401 ? "/login" : "/dashboard");
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });
  if (user?.twoFactorEnabled) redirect("/admin");

  return (
    <div className="min-h-screen bg-mpd-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <TwoFactorEnroll />
      </div>
    </div>
  );
}
