import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/forms/OnboardingForm";

export const metadata = {
  title: "Completa tu perfil",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingStep: true,
      country: true,
      playingLevel: true,
      primaryRoom: true,
      secondaryRooms: true,
      weeklyHours: true,
      goals: true,
      nickname: true,
    },
  });
  if (!user) redirect("/login");
  if ((user.onboardingStep ?? 0) >= 4) redirect("/dashboard");

  const initialStep = Math.min(Math.max(user.onboardingStep ?? 0, 1), 3);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Completa tu perfil</CardTitle>
        <CardDescription>
          Personalicemos tu experiencia en Manager Poker Deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm
          userId={session.user.id}
          initialStep={initialStep}
          initialData={{
            country: user.country ?? "",
            playingLevel: user.playingLevel ?? "",
            primaryRoom: user.primaryRoom ?? "",
            secondaryRooms: user.secondaryRooms ?? [],
            weeklyHours: user.weeklyHours ?? null,
            goals: user.goals ?? [],
            nickname: user.nickname ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
