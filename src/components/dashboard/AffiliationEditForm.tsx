"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateRoomAffiliation } from "@/lib/actions/rooms";
import { CheckCircle2, Pencil } from "lucide-react";

interface Props {
  affiliationId: string;
  defaults: {
    nickname: string | null;
    roomEmail: string | null;
    referralCodeAtRoom: string | null;
    codeId: string | null;
  };
}

export function AffiliationEditForm({ affiliationId, defaults }: Props) {
  const [nickname, setNickname] = useState(defaults.nickname ?? "");
  const [roomEmail, setRoomEmail] = useState(defaults.roomEmail ?? "");
  const [referralCodeAtRoom, setReferralCodeAtRoom] = useState(
    defaults.referralCodeAtRoom ?? ""
  );
  const [codeId, setCodeId] = useState(defaults.codeId ?? "");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setStatus("idle");
    setError(null);
    start(async () => {
      const res = await updateRoomAffiliation({
        affiliationId,
        nickname: nickname.trim() || null,
        roomEmail: roomEmail.trim() || null,
        referralCodeAtRoom: referralCodeAtRoom.trim() || null,
        codeId: codeId.trim() || null,
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
        setError(res.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pencil className="h-4 w-4 text-mpd-gold" />
          Datos de tu cuenta en la sala
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname en la sala</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej: MikePoker24"
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomEmail">Email usado en la sala</Label>
            <Input
              id="roomEmail"
              type="email"
              value={roomEmail}
              onChange={(e) => setRoomEmail(e.target.value)}
              placeholder="tu@email.com"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referralCodeAtRoom">Código de afiliación usado</Label>
            <Input
              id="referralCodeAtRoom"
              value={referralCodeAtRoom}
              onChange={(e) => setReferralCodeAtRoom(e.target.value)}
              placeholder="MPD"
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codeId">ID / referencia interna</Label>
            <Input
              id="codeId"
              value={codeId}
              onChange={(e) => setCodeId(e.target.value)}
              placeholder="Opcional"
              maxLength={60}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs">
            {status === "saved" && (
              <span className="inline-flex items-center gap-1 text-mpd-green">
                <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
            {status === "error" && error && (
              <span className="text-mpd-red">{error}</span>
            )}
          </div>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
