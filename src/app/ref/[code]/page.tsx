import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export default async function RefPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });

  if (referrer) {
    const cookieStore = await cookies();
    cookieStore.set("ref", code, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      httpOnly: true,
    });
  }

  redirect("/register");
}
