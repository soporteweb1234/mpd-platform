"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getChannelMembers } from "@/lib/actions/community";
import type { PlayerStratum } from "@prisma/client";

const STRATUM_ORDER: PlayerStratum[] = ["REFERENTE", "PROFESIONAL", "SEMI_PRO", "NOVATO"];

const STRATUM_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  REFERENTE: { label: "Referente", color: "text-[#00C875]", dot: "bg-[#00C875]" },
  PROFESIONAL: { label: "Profesional", color: "text-[#C9A84C]", dot: "bg-[#C9A84C]" },
  SEMI_PRO: { label: "Semi-Pro", color: "text-[#FF9500]", dot: "bg-[#FF9500]" },
  NOVATO: { label: "Novato", color: "text-[#8B949E]", dot: "bg-[#8B949E]" },
};

interface Member {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  stratum: PlayerStratum;
  role: string;
  isOnline: boolean;
}

interface Props {
  channelId: string;
  onClose: () => void;
}

export function MembersPanel({ channelId, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getChannelMembers(channelId).then((data) => {
      setMembers(data as Member[]);
      setLoading(false);
    });
  }, [channelId]);

  // Group by stratum (Referente first)
  const grouped: Record<string, Member[]> = {};
  for (const s of STRATUM_ORDER) {
    const stratumMembers = members.filter((m) => m.stratum === s);
    if (stratumMembers.length > 0) {
      grouped[s] = stratumMembers;
    }
  }

  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <div className="w-[240px] h-full bg-[#0D1117] border-l border-[#30363D] flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#30363D]">
        <span className="text-sm font-semibold text-[#E6EDF3]">
          Miembros
          {!loading && (
            <span className="text-[#8B949E] font-normal ml-1">— {members.length}</span>
          )}
        </span>
        <button onClick={onClose} className="text-[#8B949E] hover:text-[#E6EDF3] lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Online indicator */}
      {!loading && (
        <div className="px-4 py-2 border-b border-[#30363D]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00C875]" />
            <span className="text-xs text-[#8B949E]">{onlineCount} en línea</span>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <span className="text-xs text-[#8B949E]">Cargando...</span>
          </div>
        ) : (
          Object.entries(grouped).map(([stratum, stratumMembers]) => {
            const config = STRATUM_CONFIG[stratum];
            return (
              <div key={stratum} className="mb-3">
                <div className="px-3 py-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                    {config.label} — {stratumMembers.length}
                  </span>
                </div>
                {stratumMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-3 py-1 hover:bg-[#161B22] rounded-md mx-1 transition-colors"
                  >
                    <div className="relative shrink-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#30363D] flex items-center justify-center text-[10px] font-semibold text-[#E6EDF3]">
                          {(member.nickname ?? member.name)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0D1117] ${
                          member.isOnline ? "bg-[#00C875]" : "bg-[#656D76]"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${member.isOnline ? "text-[#E6EDF3]" : "text-[#8B949E]"}`}>
                        {member.nickname ?? member.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
