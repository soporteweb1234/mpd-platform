import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hybridSearch, maxSimilarity, type RetrievedChunk } from "@/lib/ai/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_THRESHOLD = 0.65;
const DEFAULT_TOPK_VECTOR = 20;
const DEFAULT_TOPK_FINAL = 5;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_SYSTEM_PROMPT = `Eres MIKE, asistente 24h de Manager Poker Deal (MPD). Personalidad: educado, correcto, formal, asertivo, orientado a soluciones y empático. Experto en poker online, rakeback y gestión de bankroll.

REGLAS:
- Responde en español, máximo 3–4 párrafos.
- Usa **negrita** para términos clave; listas con guion para enumerar.
- Usa EXCLUSIVAMENTE la información del bloque <context> para responder; si la respuesta no está ahí, dilo claramente y ofrece abrir un ticket de soporte.
- No inventes porcentajes de salas, cifras concretas ni prometas rendimientos.
- Si la consulta requiere datos personales del jugador, indica que los encontrará en su dashboard.`;

interface ChatSettings {
  systemPrompt: string;
  escalationThreshold: number;
  topKVector: number;
  topKFinal: number;
  model: string;
}

let settingsCache: { value: ChatSettings; ts: number } | null = null;
const SETTINGS_TTL_MS = 60_000;

async function loadChatSettings(): Promise<ChatSettings> {
  if (settingsCache && Date.now() - settingsCache.ts < SETTINGS_TTL_MS) {
    return settingsCache.value;
  }
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          "chat.system_prompt",
          "chat.escalation_threshold",
          "chat.topk_vector",
          "chat.topk_final",
          "chat.model",
        ],
      },
    },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const value: ChatSettings = {
    systemPrompt: map.get("chat.system_prompt") ?? DEFAULT_SYSTEM_PROMPT,
    escalationThreshold:
      parseFloat(map.get("chat.escalation_threshold") ?? "") || DEFAULT_THRESHOLD,
    topKVector: parseInt(map.get("chat.topk_vector") ?? "", 10) || DEFAULT_TOPK_VECTOR,
    topKFinal: parseInt(map.get("chat.topk_final") ?? "", 10) || DEFAULT_TOPK_FINAL,
    model: map.get("chat.model") ?? DEFAULT_MODEL,
  };
  settingsCache = { value, ts: Date.now() };
  return value;
}

/** Invalida el cache de settings — llamable desde admin actions tras save. */
export function invalidateChatSettings() {
  settingsCache = null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "<context>(sin resultados relevantes en la base de conocimiento)</context>";
  const lines = chunks.map((c, i) => {
    const sim =
      c.similarity !== undefined ? ` similitud=${c.similarity.toFixed(3)}` : "";
    const title = c.articleTitle ? ` "${c.articleTitle}"` : "";
    return `[chunk ${i + 1}${title}${sim}]\n${c.content}`;
  });
  return `<context>\n${lines.join("\n\n---\n\n")}\n</context>`;
}

function sseEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = session.user.id;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada en el servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages?: ChatMessage[]; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Aceptamos tanto { messages: [...] } como legacy { message, history }.
  const incomingMessages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is ChatMessage =>
            m !== null &&
            typeof m === "object" &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string",
        )
        .slice(-10)
    : typeof body.message === "string"
      ? [{ role: "user", content: body.message }]
      : [];

  const lastUser = [...incomingMessages].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return new Response(JSON.stringify({ error: "Mensaje vacío" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userQuery = lastUser.content.trim().slice(0, 2000);
  const settings = await loadChatSettings();

  // Persistir el mensaje de user (userId verificado de la sesión).
  await prisma.chatMessage.create({
    data: { userId, botType: "FAQ", role: "user", content: userQuery },
  });

  // Retrieval.
  let chunks: RetrievedChunk[] = [];
  let ragError: string | null = null;
  try {
    chunks = await hybridSearch(userQuery, settings.topKVector, settings.topKFinal);
  } catch (err) {
    ragError = err instanceof Error ? err.message : String(err);
    console.error("[chat/stream] hybridSearch fail:", ragError);
  }

  const maxSim = maxSimilarity(chunks);
  const shouldEscalate = chunks.length === 0 || maxSim < settings.escalationThreshold;

  const contextBlock = buildContextBlock(chunks);
  const systemPrompt = `${settings.systemPrompt}\n\n${contextBlock}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(sseEvent(payload));
      let fullText = "";
      let tokensIn: number | null = null;
      let tokensOut: number | null = null;

      try {
        send({
          type: "meta",
          chunkIds: chunks.map((c) => c.id),
          maxSimilarity: maxSim,
          shouldEscalate,
          ragError,
        });

        const response = anthropic.messages.stream({
          model: settings.model,
          max_tokens: DEFAULT_MAX_TOKENS,
          system: systemPrompt,
          messages: incomingMessages.map((m) => ({ role: m.role, content: m.content })),
        });

        response.on("text", (delta) => {
          fullText += delta;
          send({ type: "text", delta });
        });

        const finalMessage = await response.finalMessage();
        tokensIn = finalMessage.usage?.input_tokens ?? null;
        tokensOut = finalMessage.usage?.output_tokens ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[chat/stream] anthropic fail:", msg);
        send({ type: "error", message: "Fallo del asistente. Intenta de nuevo." });
      }

      const latencyMs = Date.now() - startedAt;
      let logId: string | null = null;
      try {
        const log = await prisma.chatQueryLog.create({
          data: {
            userId,
            query: userQuery,
            answer: fullText || null,
            maxSimilarity: chunks.length > 0 ? maxSim : null,
            chunkIds: chunks.map((c) => c.id),
            latencyMs,
            tokensIn,
            tokensOut,
          },
          select: { id: true },
        });
        logId = log.id;
      } catch (err) {
        console.error("[chat/stream] log persist fail:", err);
      }

      if (fullText) {
        try {
          await prisma.chatMessage.create({
            data: { userId, botType: "FAQ", role: "assistant", content: fullText },
          });
        } catch (err) {
          console.error("[chat/stream] chatMessage persist fail:", err);
        }
      }

      send({
        type: "done",
        logId,
        chunkIds: chunks.map((c) => c.id),
        maxSimilarity: maxSim,
        shouldEscalate,
        latencyMs,
        tokensIn,
        tokensOut,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
