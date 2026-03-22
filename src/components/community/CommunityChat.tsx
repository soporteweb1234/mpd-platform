"use client";

import { useState } from "react";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatPanel } from "./ChatPanel";
import { MembersPanel } from "./MembersPanel";
import type { PlayerStratum, UserRole } from "@prisma/client";

export interface CurrentUser {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  stratum: PlayerStratum;
  role: UserRole;
}

export interface ChannelData {
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

interface CommunityChatProps {
  channels: ChannelData[];
  currentUser: CurrentUser;
}

export function CommunityChat({ channels, currentUser }: CommunityChatProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    channels.find((c) => c.hasAccess)?.id ?? channels[0]?.id ?? ""
  );
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border border-[#30363D]">
      {/* Channel Sidebar */}
      <div className={`${showSidebar ? "block" : "hidden"} lg:block`}>
        <ChannelSidebar
          channels={channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={(id) => {
            setSelectedChannelId(id);
            setShowSidebar(false);
          }}
          currentUser={currentUser}
        />
      </div>

      {/* Chat Panel */}
      {selectedChannel && selectedChannel.hasAccess ? (
        <ChatPanel
          channel={{
            id: selectedChannel.id,
            name: selectedChannel.name,
            description: selectedChannel.description,
            discordChannelId: selectedChannel.discordChannelId,
          }}
          currentUser={currentUser}
          showMembers={showMembers}
          onToggleMembers={() => setShowMembers(!showMembers)}
          onOpenSidebar={() => setShowSidebar(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#161B22]">
          <div className="text-center">
            <p className="text-[#8B949E]">Selecciona un canal para empezar</p>
          </div>
        </div>
      )}

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
