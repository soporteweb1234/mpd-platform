import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Base de conocimiento — MPD" };
export const dynamic = "force-dynamic";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();
  const { slug } = await params;

  const article = await prisma.knowledgeArticle.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!article) notFound();

  return (
    <article className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/chat">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al chat
        </Link>
      </Button>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            <BookOpen className="h-3 w-3 mr-1" />
            {article.category || "general"}
          </Badge>
          {article.tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              <Tag className="h-3 w-3 mr-1" />
              {t}
            </Badge>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-mpd-white">{article.title}</h1>
        <p className="text-xs text-mpd-gray font-mono">
          Actualizado {new Date(article.updatedAt).toLocaleDateString("es-ES")}
        </p>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none text-mpd-white whitespace-pre-wrap leading-relaxed">
            {article.content}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-mpd-gray">
        ¿No encuentras lo que buscas? Usa <strong>⌘K</strong> para buscar o abre un ticket
        en <Link href="/dashboard/support/new" className="text-mpd-gold hover:underline">
          soporte
        </Link>
        .
      </p>
    </article>
  );
}
