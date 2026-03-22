"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Pin, Reply, Trash2, Pencil, Copy, Smile, Check, X,
  Globe, MessageSquare,
} from "lucide-react";
import type { MessageData } from "./ChatPanel";

const STRATUM_COLORS: Record<string, string> = {
  NOVATO: "text-[#8B949E]",
  SEMI_PRO: "text-[#FF9500]",
  PROFESIONAL: "text-[#C9A84C]",
  REFERENTE: "text-[#00C875]",
};

const STRATUM_LABELS: Record<string, string> = {
  NOVATO: "Novato",
  SEMI_PRO: "Semi-Pro",
  PROFESIONAL: "Profesional",
  REFERENTE: "Referente",
};

interface Props {
  message: MessageData;
  currentUserId: string;
  isAdmin: boolean;
  editingId: string | null;
  editValue: string;
  onSetEditValue: (v: string) => void;
  onStartEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (msg: MessageData) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  quickEmojis: string[];
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  return formatTime(date);
}

function formatFullDate(date: Date | string) {
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Simple markdown-like rendering
function renderContent(content: string) {
  // Bold: **text**
  let html = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  // Inline code: `text`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#0D1117] px-1 py-0.5 rounded text-[#C9A84C] text-xs">$1</code>');
  // Links
  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#C9A84C] hover:underline">$1</a>'
  );
  return html;
}

export function MessageBubble({
  message,
  currentUserId,
  isAdmin,
  editingId,
  editValue,
  onSetEditValue,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  onReaction,
  onPin,
  quickEmojis,
}: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwn = message.userId === currentUserId;
  const isEditing = editingId === message.id;

  const authorName =
    message.user?.nickname ?? message.user?.name ?? message.discordAuthorName ?? "Usuario";
  const authorAvatar = message.user?.avatar ?? message.discordAuthorAvatar;
  const initials = authorName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Group reactions by emoji
  const reactionGroups: Record<string, { emoji: string; count: number; hasOwn: boolean }> = {};
  for (const r of message.reactions) {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, hasOwn: false };
    }
    reactionGroups[r.emoji].count++;
    if (r.userId === currentUserId) reactionGroups[r.emoji].hasOwn = true;
  }

  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-[#8B949E] italic">{message.content}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="group relative flex gap-3 px-2 py-1.5 rounded-md hover:bg-[#1C2128] transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#30363D] flex items-center justify-center text-xs font-semibold text-[#E6EDF3]">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#E6EDF3]">{authorName}</span>

          {/* Stratum badge */}
          {message.user?.stratum && (
            <span
              className={cn(
                "text-[10px] font-medium px-1 py-0.5 rounded",
                STRATUM_COLORS[message.user.stratum],
                "bg-current/10"
              )}
              style={{
                backgroundColor:
                  message.user.stratum === "NOVATO"
                    ? "rgba(139,148,158,0.1)"
                    : message.user.stratum === "SEMI_PRO"
                    ? "rgba(255,149,0,0.1)"
                    : message.user.stratum === "PROFESIONAL"
                    ? "rgba(201,168,76,0.1)"
                    : "rgba(0,200,117,0.1)",
              }}
            >
              {STRATUM_LABELS[message.user.stratum]}
            </span>
          )}

          {/* Source badge */}
          {message.source === "DISCORD" && !message.user && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#656D76] bg-[#656D76]/10 px-1 py-0.5 rounded">
              <MessageSquare className="h-2.5 w-2.5" />
              Discord
            </span>
          )}

          {/* Timestamp */}
          <span className="text-[10px] text-[#656D76]" title={formatFullDate(message.createdAt)}>
            {formatRelativeTime(message.createdAt)}
          </span>

          {message.isEdited && (
            <span className="text-[10px] text-[#656D76] italic">(editado)</span>
          )}

          {message.isPinned && (
            <Pin className="h-3 w-3 text-[#C9A84C]" />
          )}
        </div>

        {/* Reply reference */}
        {message.replyTo && (
          <div className="flex items-center gap-1.5 mt-0.5 mb-1 text-xs text-[#8B949E] bg-[#0D1117] rounded px-2 py-1 border-l-2 border-[#C9A84C]">
            <Reply className="h-3 w-3 shrink-0" />
            <span className="font-medium text-[#C9A84C]">
              {message.replyTo.user?.nickname ??
                message.replyTo.user?.name ??
                message.replyTo.discordAuthorName}
            </span>
            <span className="truncate">{message.replyTo.content}</span>
          </div>
        )}

        {/* Message content */}
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editValue}
              onChange={(e) => onSetEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSaveEdit(message.id);
                }
                if (e.key === "Escape") onCancelEdit();
              }}
              className="w-full bg-[#0D1117] text-[#E6EDF3] text-sm rounded border border-[#30363D] px-2 py-1 outline-none focus:border-[#C9A84C] resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => onSaveEdit(message.id)}
                className="text-xs text-[#00C875] hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Guardar
              </button>
              <button
                onClick={onCancelEdit}
                className="text-xs text-[#8B949E] hover:underline flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-[#E6EDF3] break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          />
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.values(reactionGroups).map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReaction(message.id, r.emoji)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                  r.hasOwn
                    ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#E6EDF3]"
                    : "border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:border-[#8B949E]"
                )}
              >
                <span>{r.emoji}</span>
                <span className="font-mono text-[10px]">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons on hover */}
      {showActions && !isEditing && (
        <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-[#161B22] border border-[#30363D] rounded-md shadow-lg px-1 py-0.5">
          {/* Emoji picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-[#8B949E] hover:text-[#E6EDF3] rounded transition-colors"
              title="Reaccionar"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-1 bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl p-2 flex gap-1 z-50">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:bg-[#1C2128] p-1 rounded text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onReply(message)}
            className="p-1 text-[#8B949E] hover:text-[#E6EDF3] rounded transition-colors"
            title="Responder"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(message.content)}
            className="p-1 text-[#8B949E] hover:text-[#E6EDF3] rounded transition-colors"
            title="Copiar"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          {(isOwn || isAdmin) && (
            <>
              <button
                onClick={() => onStartEdit(message.id, message.content)}
                className="p-1 text-[#8B949E] hover:text-[#E6EDF3] rounded transition-colors"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 text-[#8B949E] hover:text-[#F85149] rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => onPin(message.id)}
              className={cn(
                "p-1 rounded transition-colors",
                message.isPinned ? "text-[#C9A84C]" : "text-[#8B949E] hover:text-[#C9A84C]"
              )}
              title={message.isPinned ? "Desfijar" : "Fijar"}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
