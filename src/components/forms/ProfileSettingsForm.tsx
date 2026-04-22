"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    availability: string | null;
    bio: string | null;
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
      availability: (fd.get("availability") as string) || null,
      bio: (fd.get("bio") as string) || null,
    };

    const result = await updateProfile(user.id, data);
    if (result.success) {
      toast.success("Perfil actualizado");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          <Input
            id="playingLevel"
            name="playingLevel"
            defaultValue={user.playingLevel ?? ""}
            placeholder="Ej: NL25"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeklyHours">Horas semanales</Label>
          <Input
            id="weeklyHours"
            name="weeklyHours"
            type="number"
            min={0}
            max={168}
            step={0.5}
            defaultValue={user.weeklyHours ?? ""}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-mpd-border/50 space-y-4">
        <p className="text-xs text-mpd-gray-dark uppercase tracking-wider">
          Información adicional
        </p>
        <p className="text-xs text-mpd-gray">
          Tus datos por sala (nick, email, código de afiliación, ID interno) se
          configuran directamente en{" "}
          <span className="text-mpd-white">Mis Salas</span>.
        </p>

        <div className="space-y-2">
          <Label htmlFor="availability">Disponibilidad</Label>
          <Textarea
            id="availability"
            name="availability"
            rows={2}
            defaultValue={user.availability ?? ""}
            placeholder="Ej: mañanas L-V, tardes S-D, zona horaria CET"
            maxLength={300}
          />
          <p className="text-[11px] text-mpd-gray-dark">
            Cuándo sueles estar disponible para jugar o reunirte con MPD.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Información extra</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={user.bio ?? ""}
            placeholder="Cualquier dato que quieras compartir con MPD: objetivos, estilo de juego, preferencias, etc."
            maxLength={1000}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
