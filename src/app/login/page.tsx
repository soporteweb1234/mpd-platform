import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = {
  title: "Iniciar Sesión",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
        <CardDescription>Accede a tu panel de Manager Poker Deal</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-mpd-gray">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-mpd-gold hover:underline">
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
