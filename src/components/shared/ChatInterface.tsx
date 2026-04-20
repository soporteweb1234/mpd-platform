"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  botType: "FAQ" | "INTERNAL";
  userId: string;
}

const SUGGESTIONS = [
  "¿Qué es el rakeback NGR?",
  "¿Cómo me doy de alta en una sala?",
  "¿Qué tipos de saldo tengo?",
  "¿Qué servicios ofrece MPD?",
  "¿Cómo funcionan los galones?",
];

// Minimal markdown: **bold**, - list items, \n
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList(key: string) {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="list-disc list-inside space-y-0.5 my-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: boldify(item) }} />
        ))}
      </ul>
    );
    listBuffer = [];
  }

  function boldify(str: string): string {
    return str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  lines.forEach((line, i) => {
    const trimLine = line.trim();
    if (trimLine.startsWith("- ") || trimLine.startsWith("• ")) {
      listBuffer.push(trimLine.slice(2));
    } else {
      flushList(`list-${i}`);
      if (trimLine === "") {
        // skip blank lines after list flush
      } else {
        elements.push(
          <p
            key={i}
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: boldify(trimLine) }}
          />
        );
      }
    }
  });
  flushList("list-end");

  return <div className="space-y-1">{elements}</div>;
}

export function ChatInterface({ botType, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy **EDU**, el asistente de Manager Poker Deal. Puedo ayudarte con dudas sobre rakeback, salas, servicios, saldo, galones y más.\n\n¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Pass conversation history (exclude system greeting, last user msg already in newMessages)
      const history = newMessages.slice(1, -1); // skip initial greeting + last user msg

      const res = await fetch(`/api/chat/${botType.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userId, history }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o abre un ticket en **Soporte**." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión. Por favor, intenta de nuevo." },
      ]);
    }

    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const showSuggestions = messages.length === 1; // only initial greeting shown

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-mpd-gold/10 border border-mpd-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-mpd-gold" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[82%] rounded-xl px-4 py-2.5",
                msg.role === "user"
                  ? "bg-mpd-gold/10 border border-mpd-gold/20 text-mpd-white"
                  : "bg-mpd-surface border border-mpd-border text-mpd-white"
              )}
            >
              {renderMarkdown(msg.content)}
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-mpd-surface border border-mpd-border flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-mpd-gray" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-mpd-gold/10 border border-mpd-gold/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-mpd-gold" />
            </div>
            <div className="bg-mpd-surface border border-mpd-border rounded-xl px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestion chips — only before first user message */}
        {showSuggestions && !loading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-mpd-gold/30 text-mpd-gold hover:bg-mpd-gold/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Soporte shortcut */}
      <div className="px-4 py-1.5 border-t border-mpd-border/50 flex items-center justify-between">
        <span className="text-[10px] text-mpd-gray-dark">¿No encuentras lo que buscas?</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-mpd-gray hover:text-mpd-white px-2" asChild>
          <Link href="/dashboard/support/new">
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir ticket de soporte
          </Link>
        </Button>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-mpd-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
          className="flex-1"
          maxLength={1000}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
