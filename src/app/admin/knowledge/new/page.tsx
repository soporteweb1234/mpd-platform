import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KnowledgeArticleForm } from "@/components/admin/KnowledgeArticleForm";

export const metadata = { title: "Nuevo artículo — KB Admin" };
export const dynamic = "force-dynamic";

export default async function AdminKnowledgeNewPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/knowledge">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Nuevo artículo KB</h1>
        <p className="text-sm text-mpd-gray">
          Al guardar se re-indexa para el chat RAG y el buscador ⌘K.
        </p>
      </div>
      <Card>
        <CardContent className="p-4">
          <KnowledgeArticleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
