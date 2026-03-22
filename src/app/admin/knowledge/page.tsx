import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, BookOpen, Globe, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Knowledge Base — Admin" };

export default async function AdminKnowledgePage() {
  const articles = await prisma.knowledgeArticle.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Knowledge Base</h1>
        <Button asChild>
          <Link href="/admin/knowledge/new">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Artículo
          </Link>
        </Button>
      </div>

      <p className="text-sm text-mpd-gray">{articles.length} artículos · {articles.filter((a) => a.isPublic).length} públicos · {articles.filter((a) => !a.isPublic).length} privados</p>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="text-lg font-semibold text-mpd-white mb-3">{cat}</h2>
          <div className="space-y-2">
            {articles
              .filter((a) => a.category === cat)
              .map((article) => (
                <Card key={article.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-mpd-gray shrink-0" />
                      <div>
                        <p className="text-sm text-mpd-white">{article.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={article.isPublic ? "success" : "secondary"} className="text-[10px]">
                            {article.isPublic ? <><Globe className="h-2.5 w-2.5 mr-0.5" />Público</> : <><Lock className="h-2.5 w-2.5 mr-0.5" />Privado</>}
                          </Badge>
                          {article.tags.map((tag) => (
                            <span key={tag} className="text-[10px] text-mpd-gray-dark">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-mpd-gray-dark">{formatDate(article.updatedAt)}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/knowledge/${article.id}`}>Editar</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
