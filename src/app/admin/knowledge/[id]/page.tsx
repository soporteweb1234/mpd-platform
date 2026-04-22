import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KnowledgeArticleForm } from "@/components/admin/KnowledgeArticleForm";

export const metadata = { title: "Editar artículo — KB Admin" };
export const dynamic = "force-dynamic";

export default async function AdminKnowledgeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      category: true,
      isPublic: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!article) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/knowledge">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Editar artículo</h1>
        <p className="text-sm text-mpd-gray font-mono">{article.slug}</p>
      </div>
      <Card>
        <CardContent className="p-4">
          <KnowledgeArticleForm
            mode="edit"
            article={{
              id: article.id,
              title: article.title,
              slug: article.slug,
              content: article.content,
              category: article.category,
              isPublic: article.isPublic,
              tags: article.tags,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
