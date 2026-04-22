"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Hash, Lock, ChevronDown, ChevronRight, MessageSquare,
  Shield, Wrench, GraduationCap, HelpCircle, Users,
} from "lucide-react";
import { getUnreadCounts } from "@/lib/actions/community";
import type { CurrentUser } from "./CommunityChat";
import type { PlayerStratum, UserRole } from "@prisma/client";

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  GENERAL: { label: "General", icon: MessageSquare },
  NIVEL: { label: "Por Nivel", icon: Users },
  HERRAMIENTAS: { label: "Herramientas", icon: Wrench },
  FORMACION: { label: "Formación", icon: GraduationCap },
  SOPORTE: { label: "Soporte", icon: HelpCircle },
};

const STRATUM_LABELS: Record<string, string> = {
  NOVATO: "Novato",
  SEMI_PRO: "Semi-Pro",
  PROFESIONAL: "Profesional",
  REFERENTE: "Referente",
};

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string | null;
  isPrivate: boolean;
  requiredStratum: PlayerStratum | null;
  requiredRole: UserRole | null;
  hasAccess: boolean;
  discordChannelId: string | null;
}

interface Props {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  currentUser: CurrentUser;
}

export function ChannelSidebar({ channels, selectedChannelId, onSelectChannel, currentUser }: Props) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getUnreadCounts().then(setUnreadCounts);
    const interval = setInterval(() => {
      getUnreadCounts().then(setUnreadCounts);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const categories = Object.keys(CATEGORY_CONFIG);
  const grouped = categories.reduce<Record<string, Channel[]>>((acc, cat) => {
    acc[cat] = channels.filter((c) => c.category === cat);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="w-[250px] h-full bg-[var(--mpd-black)] flex flex-col border-r border-[var(--mpd-border)]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-[var(--mpd-border)]">
        <Shield className="h-5 w-5 text-[var(--mpd-gold)] mr-2" />
        <h2 className="font-semibold text-[var(--mpd-white)] text-sm">Comunidad MPD</h2>
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto py-2">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const catChannels = grouped[cat];
          if (!catChannels || catChannels.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat);

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="flex items-center w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--mpd-gray)] hover:text-[var(--mpd-white)] transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                {config.label}
              </button>

              {!isCollapsed &&
                catChannels.map((channel) => {
                  const isSelected = channel.id === selectedChannelId;
                  const unread = unreadCounts[channel.id] ?? 0;
                  const locked = !channel.hasAccess;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => !locked && onSelectChannel(channel.id)}
                      disabled={locked}
                      title={
                        locked && channel.requiredStratum
                          ? `Requiere estrato ${STRATUM_LABELS[channel.requiredStratum]}`
                          : locked && channel.requiredRole
                          ? `Solo ${channel.requiredRole}`
                          : undefined
                      }
                      className={cn(
                        "flex items-center w-full px-2 py-1 mx-1 rounded text-sm transition-colors group",
                        isSelected
                          ? "bg-[var(--mpd-surface)] text-[var(--mpd-white)] border-l-2 border-[var(--mpd-gold)]"
                          : locked
                          ? "text-[var(--mpd-gray)] cursor-not-allowed"
                          : "text-[var(--mpd-gray)] hover:text-[var(--mpd-white)] hover:bg-[var(--mpd-surface)]"
                      )}
                      style={{ width: "calc(100% - 8px)" }}
                    >
                      {locked ? (
                        <Lock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      ) : (
                        <Hash className="h-3.5 w-3.5 mr-1.5 shrink-0 text-[var(--mpd-gray)]" />
                      )}
                      <span className="truncate flex-1 text-left">{channel.name}</span>
                      {unread > 0 && !locked && (
                        <span className="ml-auto bg-[var(--mpd-gold)] text-[var(--mpd-black)] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Current user info */}
      <div className="p-3 border-t border-[var(--mpd-border)]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[var(--mpd-surface)] flex items-center justify-center text-xs font-semibold text-[var(--mpd-white)]">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--mpd-green)] rounded-full border-2 border-[var(--mpd-black)]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--mpd-white)] truncate">
              {currentUser.nickname ?? currentUser.name}
            </p>
            <p className="text-[10px] text-[var(--mpd-gray)]">
              {STRATUM_LABELS[currentUser.stratum]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
