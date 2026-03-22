import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTicketForm } from "@/components/forms/CreateTicketForm";

export const metadata = { title: "Nuevo Ticket" };

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Nuevo Ticket de Soporte</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe tu problema</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTicketForm userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
