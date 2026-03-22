"use client";

import { useState, useCallback } from "react";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatPanel } from "./ChatPanel";
import { MembersPanel } from "./MembersPanel";
import type { PlayerStratum, UserRole } from "@prisma/client";

interface ChannelData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string | null;
  isPrivate: boolean;
  requiredStratum: PlayerStratum | null;
  requiredRole: UserRole | null;
  sortOrder: number;
  discordChannelId: string | null;
  hasAccess: boolean;
  lastReadAt: Date | null;
  _count: { messages: number };
}

export interface CurrentUser {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  stratum: PlayerStratum;
  role: UserRole;
}

interface CommunityProps {
  channels: ChannelData[];
  currentUser: CurrentUser;
}

export function CommunityChat({ channels, currentUser }: CommunityProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    channels.find((c) => c.hasAccess && c.slug === "general")?.id ??
      channels.find((c) => c.hasAccess)?.id ??
      ""
  );
  const [showMembers, setShowMembers] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const handleSelectChannel = useCallback((id: string) => {
    setSelectedChannelId(id);
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen overflow-hidden bg-[#0D1117] -m-6 lg:-m-8">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Channel Sidebar */}
      <div
        className={`
          fixed lg:relative z-40 lg:z-auto h-full
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-transform duration-200
        `}
      >
        <ChannelSidebar
          channels={channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={handleSelectChannel}
          currentUser={currentUser}
        />
      </div>

      {/* Chat Panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedChannel ? (
          <ChatPanel
            channel={selectedChannel}
            currentUser={currentUser}
            showMembers={showMembers}
            onToggleMembers={() => setShowMembers(!showMembers)}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8B949E]">
            Selecciona un canal para comenzar
          </div>
        )}
      </div>

      {/* Members Panel */}
      {showMembers && selectedChannel && (
        <MembersPanel
          channelId={selectedChannel.id}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}
