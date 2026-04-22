import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  BookOpen,
  Sparkles,
  Globe,
  Lock,
  Sliders,
  FlaskConical,
  ScrollText,
  MessageSquare,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SuggestedQuestionsManager } from "@/components/admin/SuggestedQuestionsManager";
import { SystemPromptEditor } from "@/components/admin/SystemPromptEditor";
import { RagParamsEditor } from "@/components/admin/RagParamsEditor";
import { ReindexButton } from "@/components/admin/ReindexButton";
import { RagTestPanel } from "@/components/admin/RagTestPanel";
import {
  ChatQueryLogTable,
  type ChatQueryLogRow,
} from "@/components/admin/ChatQueryLogTable";

export const metadata = { title: "Bot interno — Admin" };

const DEFAULT_SYSTEM_PROMPT = `Eres MIKE, asistente 24h de Manager Poker Deal (MPD). Responde en español usando EXCLUSIVAMENTE la información del bloque <context>. Si no está ahí, dilo y ofrece abrir un ticket.`;

const SETTING_KEYS = [
  "chat.system_prompt",
  "chat.escalation_threshold",
  "chat.topk_vector",
  "chat.topk_final",
  "chat.model",
] as const;

export default async function AdminBotPage() {
  const [questions, articles, lastUpdate, chunkStats, settingsRows, recentLogs] =
    await Promise.all([
      prisma.suggestedQuestion.findMany({
        orderBy: [
          { active: "desc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.knowledgeArticle.findMany({ select: { id: true, isPublic: true } }),
      prisma.knowledgeArticle.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.knowledgeChunk.count(),
      prisma.systemSetting.findMany({
        where: { key: { in: [...SETTING_KEYS] } },
        select: { key: true, value: true },
      }),
      prisma.chatQueryLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          query: true,
          maxSimilarity: true,
          latencyMs: true,
          tokensIn: true,
          tokensOut: true,
          escalatedToTicketId: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
    ]);

  const pub = articles.filter((a) => a.isPublic).length;
  const priv = articles.length - pub;
  const activeQ = questions.filter((q) => q.active).length;

  const settingsMap = new Map(settingsRows.map((r) => [r.key, r.value]));
  const systemPrompt = settingsMap.get("chat.system_prompt") ?? DEFAULT_SYSTEM_PROMPT;
  const escalationThreshold = settingsMap.get("chat.escalation_threshold") ?? "0.65";
  const threshold = parseFloat(escalationThreshold) || 0.65;
  const topKVector = settingsMap.get("chat.topk_vector") ?? "20";
  const topKFinal = settingsMap.get("chat.topk_final") ?? "5";
  const model = settingsMap.get("chat.model") ?? "claude-haiku-4-5-20251001";

  const logRows: ChatQueryLogRow[] = recentLogs.map((l) => ({
    id: l.id,
    query: l.query,
    maxSimilarity: l.maxSimilarity,
    latencyMs: l.latencyMs,
    tokensIn: l.tokensIn,
    tokensOut: l.tokensOut,
    escalatedToTicketId: l.escalatedToTicketId,
    createdAt: l.createdAt,
    userLabel: l.user?.email ?? l.user?.name ?? "—",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-mpd-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Bot interno</h1>
          <p className="text-sm text-mpd-gray">
            Chat MIKE con RAG productivo. System prompt, parámetros y telemetría.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-mpd-gray" /> Knowledge status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Artículos
                </p>
                <p className="text-2xl font-bold text-mpd-white">
                  {articles.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Chunks
                </p>
                <p className="text-2xl font-bold text-mpd-white">{chunkStats}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Últ. update
                </p>
                <p className="text-xs text-mpd-white mt-1">
                  {lastUpdate ? formatDateTime(lastUpdate.updatedAt) : "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="success" className="text-[10px]">
                <Globe className="h-2.5 w-2.5 mr-0.5" /> {pub} públicos
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <Lock className="h-2.5 w-2.5 mr-0.5" /> {priv} privados
              </Badge>
            </div>
            <ReindexButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-mpd-gray" /> Resumen preguntas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Total
                </p>
                <p className="text-2xl font-bold text-mpd-white">
                  {questions.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Activas
                </p>
                <p className="text-2xl font-bold text-mpd-green">{activeQ}</p>
              </div>
            </div>
            <p className="text-[11px] text-mpd-gray">
              Se muestran como chips iniciales en{" "}
              <span className="font-mono">/dashboard/chat</span> (top 6 por
              priority + timesAsked).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-mpd-gray" /> System prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SystemPromptEditor initialValue={systemPrompt} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4 text-mpd-gray" /> Parámetros RAG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RagParamsEditor
            initial={{
              escalationThreshold,
              topKVector,
              topKFinal,
              model,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-mpd-gray" /> Test query
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RagTestPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-mpd-gray" /> Últimas consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChatQueryLogTable rows={logRows} threshold={threshold} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preguntas sugeridas</CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestedQuestionsManager
            items={questions.map((q) => ({
              id: q.id,
              question: q.question,
              category: q.category,
              priority: q.priority,
              active: q.active,
              timesAsked: q.timesAsked,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
