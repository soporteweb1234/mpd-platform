import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata = {
  title: "Registro",
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Crear Cuenta</CardTitle>
        <CardDescription>Únete a Manager Poker Deal y optimiza tu poker</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-mpd-gray">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-mpd-gold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
