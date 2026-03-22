import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: "Preguntas Frecuentes",
  description: "Resolvemos tus dudas sobre rakeback, salas de poker, VPN y servicios de Manager Poker Deal.",
};

export default async function FAQPage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublic: true, category: "FAQ" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-mpd-white">Preguntas Frecuentes</h1>
            <p className="mt-2 text-mpd-gray">Todo lo que necesitas saber sobre Manager Poker Deal</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <div className="space-y-3">
            {articles.map((article) => (
              <details key={article.id} className="group">
                <summary className="flex items-center justify-between p-4 rounded-lg bg-mpd-surface border border-mpd-border cursor-pointer hover:border-mpd-border-light transition-colors list-none">
                  <span className="text-sm font-medium text-mpd-white">{article.title}</span>
                  <ChevronDown className="h-4 w-4 text-mpd-gray group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <div className="text-sm text-mpd-gray whitespace-pre-line">{article.content}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
