"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addServiceWhitelist, removeServiceWhitelist } from "@/lib/actions/admin";
import { UserPlus, X, Search } from "lucide-react";

type U = { id: string; name: string; email: string };

export function ServiceWhitelistManager({
  serviceId,
  members,
  candidates,
}: {
  serviceId: string;
  members: U[];
  candidates: U[];
}) {
  const [currentMembers, setCurrentMembers] = useState<U[]>(members);
  const [currentCandidates, setCurrentCandidates] = useState<U[]>(candidates);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return currentCandidates.slice(0, 10);
    return currentCandidates
      .filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      )
      .slice(0, 10);
  }, [q, currentCandidates]);

  const add = (user: U) => {
    startTransition(async () => {
      const res = await addServiceWhitelist(serviceId, user.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setCurrentMembers((m) => [...m, user]);
      setCurrentCandidates((c) => c.filter((u) => u.id !== user.id));
      setQ("");
      toast.success(`${user.name} añadido a la whitelist`);
    });
  };

  const remove = (user: U) => {
    startTransition(async () => {
      const res = await removeServiceWhitelist(serviceId, user.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setCurrentMembers((m) => m.filter((u) => u.id !== user.id));
      setCurrentCandidates((c) => [...c, user]);
      toast.success(`${user.name} retirado de la whitelist`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="h-4 w-4 text-mpd-gray absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar usuario por nombre o email…"
          className="pl-9"
        />
        {q && filtered.length > 0 && (
          <div className="absolute top-full mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-mpd-border bg-mpd-surface shadow-lg z-10">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={isPending}
                onClick={() => add(u)}
                className="w-full text-left px-3 py-2 hover:bg-mpd-black/40 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-mpd-white">{u.name}</p>
                  <p className="text-xs text-mpd-gray">{u.email}</p>
                </div>
                <UserPlus className="h-4 w-4 text-mpd-gold" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {currentMembers.length === 0 ? (
          <p className="text-xs text-mpd-gray">
            Sin usuarios en whitelist. El candado aplica a todo el mundo.
          </p>
        ) : (
          currentMembers.map((u) => (
            <Badge
              key={u.id}
              variant="outline"
              className="flex items-center gap-1.5 pl-2 pr-1 py-1"
            >
              <span className="text-xs">{u.name}</span>
              <button
                type="button"
                onClick={() => remove(u)}
                disabled={isPending}
                className="rounded hover:bg-mpd-black/40 p-0.5"
                aria-label={`Quitar ${u.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
