import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, BookOpen, Sparkles, Globe, Lock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SuggestedQuestionsManager } from "@/components/admin/SuggestedQuestionsManager";

export const metadata = { title: "Bot interno — Admin" };

export default async function AdminBotPage() {
  const [questions, articles, lastUpdate] = await Promise.all([
    prisma.suggestedQuestion.findMany({
      orderBy: [{ active: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.knowledgeArticle.findMany({
      select: { id: true, isPublic: true },
    }),
    prisma.knowledgeArticle.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const pub = articles.filter((a) => a.isPublic).length;
  const priv = articles.length - pub;
  const activeQ = questions.filter((q) => q.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-mpd-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Bot interno</h1>
          <p className="text-sm text-mpd-gray">
            Preguntas sugeridas + estado del knowledge base. El LLM productivo llega
            en FASE 5.
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Artículos
                </p>
                <p className="text-2xl font-bold text-mpd-white">{articles.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Última actualización
                </p>
                <p className="text-sm text-mpd-white mt-1">
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
            <div className="rounded-lg border border-dashed border-mpd-border bg-mpd-black/30 p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-mpd-amber mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-mpd-white">
                  Embeddings pgvector — FASE 5
                </p>
                <p className="text-[11px] text-mpd-gray mt-0.5">
                  Cuando esté, cada actualización de KB re-vectoriza y el bot usará
                  RAG contra este corpus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen preguntas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Total
                </p>
                <p className="text-2xl font-bold text-mpd-white">{questions.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                  Activas
                </p>
                <p className="text-2xl font-bold text-mpd-green">{activeQ}</p>
              </div>
            </div>
            <p className="text-[11px] text-mpd-gray">
              Se mostrarán como chips iniciales en <span className="font-mono">/dashboard/chat</span>{" "}
              cuando el bot entre en producción.
            </p>
          </CardContent>
        </Card>
      </div>

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
