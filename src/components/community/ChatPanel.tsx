"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Hash, Users, Menu, Wifi, Pin, Reply, Trash2, Pencil, Copy,
  Smile, Send, X, Globe, MessageSquare as DiscordIcon,
} from "lucide-react";
import { getChannelMessages, sendMessage, deleteMessage, editMessage, toggleReaction, togglePin } from "@/lib/actions/community";
import { MessageBubble } from "./MessageBubble";
import type { CurrentUser } from "./CommunityChat";
import type { PlayerStratum, UserRole } from "@prisma/client";

interface MessageUser {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  stratum: PlayerStratum;
  role: UserRole;
}

interface ReplyInfo {
  id: string;
  content: string;
  user: { name: string; nickname: string | null } | null;
  discordAuthorName: string | null;
}

export interface MessageData {
  id: string;
  content: string;
  source: string;
  type: string;
  isPinned: boolean;
  isEdited: boolean;
  createdAt: Date | string;
  userId: string | null;
  user: MessageUser | null;
  discordAuthorName: string | null;
  discordAuthorAvatar: string | null;
  replyTo: ReplyInfo | null;
  reactions: { id: string; emoji: string; userId: string }[];
}

interface ChannelInfo {
  id: string;
  name: string;
  description: string | null;
  discordChannelId: string | null;
}

interface Props {
  channel: ChannelInfo;
  currentUser: CurrentUser;
  showMembers: boolean;
  onToggleMembers: () => void;
  onOpenSidebar: () => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎯", "🔥", "♠️", "💰", "🤔"];

export function ChatPanel({
  channel,
  currentUser,
  showMembers,
  onToggleMembers,
  onOpenSidebar,
}: Props) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  // Load initial messages
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setNextCursor(null);
    setReplyTo(null);
    setEditingId(null);

    getChannelMessages(channel.id).then(({ messages: msgs, nextCursor: cursor }) => {
      setMessages(msgs);
      setNextCursor(cursor);
      setLoading(false);
      setTimeout(() => scrollToBottom(), 50);
    });
  }, [channel.id]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      const { messages: msgs } = await getChannelMessages(channel.id);
      setMessages((prev) => {
        if (msgs.length === 0) return prev;
        // Merge: keep older loaded messages, update with latest
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length > 0 && isAtBottomRef.current) {
          setTimeout(() => scrollToBottom(), 50);
        }
        // Replace last batch with fresh data + prepend any older messages not in new batch
        const newIds = new Set(msgs.map((m) => m.id));
        const olderMsgs = prev.filter((m) => !newIds.has(m.id));
        return [...olderMsgs, ...msgs];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [channel.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isAtBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    // Load more on scroll to top
    if (container.scrollTop < 100 && nextCursor && !loadingMore) {
      setLoadingMore(true);
      getChannelMessages(channel.id, nextCursor).then(({ messages: older, nextCursor: cursor }) => {
        const prevHeight = container.scrollHeight;
        setMessages((prev) => [...older, ...prev]);
        setNextCursor(cursor);
        setLoadingMore(false);
        // Maintain scroll position
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevHeight;
        });
      });
    }
  }, [channel.id, nextCursor, loadingMore]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    setInputValue("");

    const result = await sendMessage(channel.id, text, replyTo?.id);
    if (result) {
      setMessages((prev) => [...prev, result as MessageData]);
      setReplyTo(null);
      setTimeout(() => scrollToBottom(), 50);
    }

    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEdit = async (messageId: string) => {
    const text = editValue.trim();
    if (!text) return;

    await editMessage(messageId, text);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: text, isEdited: true } : m
      )
    );
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await toggleReaction(messageId, emoji);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find(
          (r) => r.emoji === emoji && r.userId === currentUser.id
        );
        if (existing) {
          return { ...m, reactions: m.reactions.filter((r) => r.id !== existing.id) };
        }
        return {
          ...m,
          reactions: [
            ...m.reactions,
            { id: `temp-${Date.now()}`, emoji, userId: currentUser.id },
          ],
        };
      })
    );
  };

  const handlePin = async (messageId: string) => {
    await togglePin(messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      )
    );
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageData[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(currentUser.role);

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#161B22]">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#30363D] bg-[#161B22] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1 text-[#8B949E] hover:text-[#E6EDF3]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Hash className="h-4 w-4 text-[#656D76] shrink-0" />
          <span className="font-semibold text-[#E6EDF3] text-sm">{channel.name}</span>
          {channel.description && (
            <>
              <div className="w-px h-4 bg-[#30363D] mx-1" />
              <span className="text-xs text-[#8B949E] truncate">{channel.description}</span>
            </>
          )}
          {channel.discordChannelId && (
            <span className="flex items-center gap-1 text-[10px] text-[#8B949E] bg-[#1C2128] px-1.5 py-0.5 rounded ml-1">
              <Wifi className="h-3 w-3 text-[#00C875]" />
              Discord
            </span>
          )}
        </div>
        <button
          onClick={onToggleMembers}
          className={cn(
            "p-1.5 rounded transition-colors",
            showMembers
              ? "text-[#E6EDF3] bg-[#1C2128]"
              : "text-[#8B949E] hover:text-[#E6EDF3]"
          )}
        >
          <Users className="h-4 w-4" />
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {loadingMore && (
          <div className="text-center py-2">
            <span className="text-xs text-[#8B949E]">Cargando mensajes anteriores...</span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <span className="text-[#8B949E]">Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
            <Hash className="h-12 w-12 text-[#30363D] mb-3" />
            <p className="text-[#E6EDF3] font-semibold">Bienvenido a #{channel.name}</p>
            <p className="text-sm text-[#8B949E] mt-1">
              Este es el inicio del canal. Sé el primero en escribir.
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-[#30363D]" />
                <span className="px-3 text-[10px] font-medium text-[#8B949E] uppercase">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-[#30363D]" />
              </div>

              <AnimatePresence>
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUser.id}
                    isAdmin={isAdmin}
                    editingId={editingId}
                    editValue={editValue}
                    onSetEditValue={setEditValue}
                    onStartEdit={(id, content) => {
                      setEditingId(id);
                      setEditValue(content);
                    }}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditValue("");
                    }}
                    onSaveEdit={handleEdit}
                    onDelete={handleDelete}
                    onReply={(msg) =>
                      setReplyTo({
                        id: msg.id,
                        content: msg.content,
                        user: msg.user ? { name: msg.user.name, nickname: msg.user.nickname } : null,
                        discordAuthorName: msg.discordAuthorName,
                      })
                    }
                    onReaction={handleReaction}
                    onPin={handlePin}
                    quickEmojis={QUICK_EMOJIS}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-[#1C2128] border-t border-[#30363D] flex items-center gap-2">
          <Reply className="h-4 w-4 text-[#C9A84C] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[#C9A84C] font-medium">
              Respondiendo a{" "}
              {replyTo.user?.nickname ?? replyTo.user?.name ?? replyTo.discordAuthorName}
            </span>
            <p className="text-xs text-[#8B949E] truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-[#8B949E] hover:text-[#E6EDF3]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 bg-[#1C2128] border-t border-[#30363D] shrink-0">
        <div className="flex items-end gap-2 bg-[#0D1117] rounded-lg border border-[#30363D] px-3 py-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe en #${channel.name}...`}
            rows={1}
            className="flex-1 bg-transparent text-[#E6EDF3] text-sm resize-none outline-none placeholder:text-[#656D76] min-h-[24px] max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className={cn(
              "p-1.5 rounded transition-colors shrink-0",
              inputValue.trim()
                ? "text-[#C9A84C] hover:bg-[#C9A84C]/10"
                : "text-[#656D76] cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
