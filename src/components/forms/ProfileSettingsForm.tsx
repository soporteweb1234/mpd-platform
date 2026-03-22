"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileSettingsFormProps {
  user: {
    id: string;
    name: string;
    nickname: string | null;
    email: string;
    country: string | null;
    playingLevel: string | null;
    weeklyHours: number | null;
    primaryRoom: string | null;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      nickname: (fd.get("nickname") as string) || null,
      country: (fd.get("country") as string) || null,
      playingLevel: (fd.get("playingLevel") as string) || null,
      weeklyHours: fd.get("weeklyHours") ? Number(fd.get("weeklyHours")) : null,
      primaryRoom: (fd.get("primaryRoom") as string) || null,
    };

    const result = await updateProfile(user.id, data);
    if (result.success) {
      toast.success("Perfil actualizado");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" defaultValue={user.nickname ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="opacity-50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" name="country" defaultValue={user.country ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="playingLevel">Nivel de juego</Label>
          <Input id="playingLevel" name="playingLevel" defaultValue={user.playingLevel ?? ""} placeholder="Ej: NL25" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeklyHours">Horas semanales</Label>
          <Input id="weeklyHours" name="weeklyHours" type="number" defaultValue={user.weeklyHours ?? ""} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}