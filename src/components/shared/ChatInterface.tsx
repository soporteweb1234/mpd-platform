"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EscalationCard } from "./EscalationCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Si el backend señaló shouldEscalate, se guarda logId para el banner. */
  escalationLogId?: string;
}

interface Suggestion {
  id: string;
  question: string;
}

interface ChatInterfaceProps {
  botType: "FAQ" | "INTERNAL";
  userId: string;
}

function boldify(str: string): string {
  return str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

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
      </ul>,
    );
    listBuffer = [];
  }

  lines.forEach((line, i) => {
    const trimLine = line.trim();
    if (trimLine.startsWith("- ") || trimLine.startsWith("• ")) {
      listBuffer.push(trimLine.slice(2));
    } else {
      flushList(`list-${i}`);
      if (trimLine !== "") {
        elements.push(
          <p
            key={i}
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: boldify(trimLine) }}
          />,
        );
      }
    }
  });
  flushList("list-end");

  return <div className="space-y-1">{elements}</div>;
}

export function ChatInterface({ botType, userId: _userId }: ChatInterfaceProps) {
  void _userId; // userId real se toma del server via session; lo ignoramos.
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy **MIKE**, el asistente 24h de Manager Poker Deal. ¿En qué puedo ayudarte ahora mismo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carga inicial de sugerencias dinámicas (sólo FAQ; INTERNAL no las usa).
  useEffect(() => {
    if (botType !== "FAQ") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat/suggestions", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: Suggestion[] };
        if (!cancelled && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      } catch {
        /* fallback silencioso — sin chips si falla */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [botType]);

  const streamResponse = useCallback(
    async (history: Message[], userMsg: string) => {
      // Mensaje del asistente vacío que iremos rellenando con los deltas.
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const payload = {
        messages: [
          ...history.slice(1).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMsg },
        ],
      };

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const clone = [...prev];
          clone[clone.length - 1] = {
            role: "assistant",
            content:
              "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o abre un ticket en **Soporte**.",
          };
          return clone;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let shouldEscalate = false;
      let logId: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (!jsonStr) continue;
          let evt: {
            type: string;
            delta?: string;
            logId?: string | null;
            shouldEscalate?: boolean;
            message?: string;
          };
          try {
            evt = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (evt.type === "text" && typeof evt.delta === "string") {
            const delta = evt.delta;
            setMessages((prev) => {
              const clone = [...prev];
              const last = clone[clone.length - 1];
              if (last && last.role === "assistant") {
                clone[clone.length - 1] = {
                  ...last,
                  content: last.content + delta,
                };
              }
              return clone;
            });
          } else if (evt.type === "meta") {
            if (typeof evt.shouldEscalate === "boolean")
              shouldEscalate = evt.shouldEscalate;
          } else if (evt.type === "done") {
            if (typeof evt.shouldEscalate === "boolean")
              shouldEscalate = evt.shouldEscalate;
            if (typeof evt.logId === "string") logId = evt.logId;
          } else if (evt.type === "error" && evt.message) {
            setMessages((prev) => {
              const clone = [...prev];
              const last = clone[clone.length - 1];
              if (last && last.role === "assistant" && !last.content) {
                clone[clone.length - 1] = { ...last, content: evt.message! };
              }
              return clone;
            });
          }
        }
      }

      if (shouldEscalate && logId) {
        setMessages((prev) => {
          const clone = [...prev];
          const last = clone[clone.length - 1];
          if (last && last.role === "assistant") {
            clone[clone.length - 1] = { ...last, escalationLogId: logId! };
          }
          return clone;
        });
      }
    },
    [],
  );

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      if (botType === "FAQ") {
        await streamResponse(newMessages.slice(0, -1), trimmed);
      } else {
        // INTERNAL bot no usa RAG — se mantiene por ahora como placeholder.
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "El bot interno aún no está disponible en FASE 5.",
          },
        ]);
      }
    } catch (err) {
      console.error("[chat] send fail:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión. Intenta de nuevo." },
      ]);
    }

    setLoading(false);
  };

  const bumpSuggestion = async (id: string) => {
    try {
      await fetch(`/api/chat/suggestions/${id}/bump`, { method: "POST" });
    } catch {
      /* non-critical */
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const showSuggestions =
    botType === "FAQ" && suggestions.length > 0 && messages.length === 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
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
                    : "bg-mpd-surface border border-mpd-border text-mpd-white",
                )}
              >
                {msg.content ? (
                  renderMarkdown(msg.content)
                ) : (
                  <div className="flex gap-1.5 items-center py-1">
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-mpd-gray animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-mpd-surface border border-mpd-border flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-mpd-gray" />
                </div>
              )}
            </div>
            {msg.escalationLogId && (
              <div className="pl-10 pr-2">
                <EscalationCard logId={msg.escalationLogId} />
              </div>
            )}
          </div>
        ))}

        {showSuggestions && !loading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  void bumpSuggestion(s.id);
                  send(s.question);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-mpd-gold/30 text-mpd-gold hover:bg-mpd-gold/10 transition-colors"
              >
                {s.question}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-1.5 border-t border-mpd-border/50 flex items-center justify-between">
        <span className="text-[10px] text-mpd-gray-dark">
          ¿No encuentras lo que buscas?
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-mpd-gray hover:text-mpd-white px-2"
          asChild
        >
          <Link href="/dashboard/support/new">
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir ticket de soporte
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-mpd-border flex gap-2"
      >
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
