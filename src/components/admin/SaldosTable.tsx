"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, getInitials } from "@/lib/utils";
import { updateUserBalances } from "@/lib/actions/admin";
import { Pencil, X, Check, Loader2 } from "lucide-react";

interface UserBalance {
  id: string;
  name: string;
  email: string;
  availableBalance: number;
  pendingBalance: number;
  totalRakeback: number;
  investedBalance: number;
}

interface EditState {
  availableBalance: string;
  pendingBalance: string;
  totalRakeback: string;
  investedBalance: string;
}

export function SaldosTable({ users }: { users: UserBalance[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditState>({
    availableBalance: "",
    pendingBalance: "",
    totalRakeback: "",
    investedBalance: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit(user: UserBalance) {
    setEditingId(user.id);
    setError(null);
    setEditValues({
      availableBalance: user.availableBalance.toFixed(2),
      pendingBalance: user.pendingBalance.toFixed(2),
      totalRakeback: user.totalRakeback.toFixed(2),
      investedBalance: user.investedBalance.toFixed(2),
    });
  }

  function closeEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSave(userId: string) {
    const available = parseFloat(editValues.availableBalance);
    const pending = parseFloat(editValues.pendingBalance);
    const total = parseFloat(editValues.totalRakeback);
    const invested = parseFloat(editValues.investedBalance);

    if ([available, pending, total, invested].some(isNaN)) {
      setError("Todos los campos deben ser números válidos.");
      return;
    }
    if ([available, pending, total, invested].some((v) => v < 0)) {
      setError("Los saldos no pueden ser negativos.");
      return;
    }

    startTransition(async () => {
      const result = await updateUserBalances({
        userId,
        availableBalance: available,
        pendingBalance: pending,
        totalRakeback: total,
        investedBalance: invested,
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mpd-border bg-mpd-black/30">
                <th className="text-left py-3 px-4 text-mpd-gray font-medium">Jugador</th>
                <th className="text-right py-3 px-4 text-mpd-gray font-medium">Disponible</th>
                <th className="text-right py-3 px-4 text-mpd-gray font-medium">Pendiente</th>
                <th className="text-right py-3 px-4 text-mpd-gray font-medium">Ganado total</th>
                <th className="text-right py-3 px-4 text-mpd-gray font-medium">Invertido</th>
                <th className="text-center py-3 px-4 text-mpd-gray font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingId === user.id;
                return (
                  <tr key={user.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-mpd-white font-medium">{user.name}</p>
                          <p className="text-xs text-mpd-gray">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {isEditing ? (
                      <>
                        {(["availableBalance", "pendingBalance", "totalRakeback", "investedBalance"] as const).map(
                          (field) => (
                            <td key={field} className="py-2 px-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editValues[field]}
                                onChange={(e) =>
                                  setEditValues((prev) => ({ ...prev, [field]: e.target.value }))
                                }
                                className="w-28 text-right font-mono text-sm h-8"
                              />
                            </td>
                          )
                        )}
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSave(user.id)}
                              disabled={isPending}
                              className="h-8 w-8 p-0 text-mpd-green hover:text-mpd-green"
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={closeEdit}
                              disabled={isPending}
                              className="h-8 w-8 p-0 text-mpd-red hover:text-mpd-red"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-right font-mono text-mpd-green">{formatCurrency(user.availableBalance)}</td>
                        <td className="py-3 px-4 text-right font-mono text-mpd-amber">{formatCurrency(user.pendingBalance)}</td>
                        <td className="py-3 px-4 text-right font-mono text-mpd-white">{formatCurrency(user.totalRakeback)}</td>
                        <td className="py-3 px-4 text-right font-mono text-mpd-gray">{formatCurrency(user.investedBalance)}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(user)}
                            disabled={editingId !== null}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="p-4 border-t border-mpd-border">
            <p className="text-sm text-mpd-red">{error}</p>
          </div>
        )}

        {users.length === 0 && (
          <div className="p-8 text-center text-mpd-gray text-sm">
            No hay usuarios registrados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
