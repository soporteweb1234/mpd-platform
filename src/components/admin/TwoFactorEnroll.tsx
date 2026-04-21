"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Step = "intro" | "scan" | "verify" | "codes";

export function TwoFactorEnroll() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function enroll() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/enroll", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al generar el QR");
      setQr(json.qr);
      setSecret(json.secret);
      setStep("scan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Código incorrecto");
      setBackupCodes(json.backupCodes ?? []);
      setStep("codes");
      toast.success("2FA activado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    router.replace("/admin");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación en 2 pasos obligatoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "intro" && (
          <>
            <p className="text-sm text-mpd-gray">
              Como nuevo administrador debes configurar 2FA antes de acceder al panel.
              Necesitarás una app tipo Google Authenticator, 1Password o Authy.
            </p>
            <Button onClick={enroll} disabled={loading}>
              {loading ? "Generando..." : "Generar código QR"}
            </Button>
          </>
        )}

        {step === "scan" && qr && (
          <>
            <p className="text-sm text-mpd-gray">
              Escanea este QR en tu app de autenticación. Si no puedes escanearlo,
              introduce el código manualmente: <code className="text-mpd-gold">{secret}</code>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR 2FA" className="w-48 h-48 rounded-lg border border-mpd-border" />
            <Button onClick={() => setStep("verify")}>Siguiente</Button>
          </>
        )}

        {step === "verify" && (
          <form onSubmit={verify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Verificando..." : "Activar 2FA"}
            </Button>
          </form>
        )}

        {step === "codes" && (
          <>
            <p className="text-sm text-mpd-gray">
              Guarda estos códigos de respaldo. Son tu única vía de acceso si pierdes
              tu dispositivo. <strong>No volverán a mostrarse.</strong>
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-mpd-gold bg-mpd-surface p-4 rounded-lg border border-mpd-border">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Button onClick={finish}>He guardado los códigos, entrar</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
