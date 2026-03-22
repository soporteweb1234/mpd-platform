import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { message, userId } = await req.json();

  // Save user message
  await prisma.chatMessage.create({
    data: { userId, botType: "FAQ", role: "user", content: message },
  });

  // Search knowledge base for relevant articles
  const searchTerms = message.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      isPublic: true,
      OR: searchTerms.flatMap((term: string) => [
        { title: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { tags: { has: term } },
      ]),
    },
    take: 3,
    orderBy: { sortOrder: "asc" },
  });

  let response: string;

  if (process.env.ANTHROPIC_API_KEY) {
    // Use Claude API if available
    try {
      const context = articles.map((a) => `## ${a.title}\n${a.content}`).join("\n\n");
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: `Eres el asistente de Manager Poker Deal. Responde preguntas sobre rakeback, salas de poker, alta en salas, VPN, y servicios del ecosistema. Sé conciso, directo y amable. Si no puedes resolver la duda, sugiere al jugador abrir un ticket de soporte. Responde siempre en español.\n\nContexto relevante:\n${context}`,
          messages: [{ role: "user", content: message }],
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        response = data.content[0].text;
      } else {
        response = generateFallbackResponse(message, articles);
      }
    } catch {
      response = generateFallbackResponse(message, articles);
    }
  } else {
    response = generateFallbackResponse(message, articles);
  }

  // Save bot response
  await prisma.chatMessage.create({
    data: { userId, botType: "FAQ", role: "assistant", content: response },
  });

  return NextResponse.json({ response });
}

function generateFallbackResponse(
  message: string,
  articles: { title: string; content: string }[]
): string {
  if (articles.length > 0) {
    const articleSummaries = articles
      .map((a) => `**${a.title}:** ${a.content.slice(0, 200)}...`)
      .join("\n\n");
    return `He encontrado información relevante:\n\n${articleSummaries}\n\nSi necesitas más ayuda, puedes abrir un ticket de soporte desde tu dashboard.`;
  }
  return "No he encontrado información sobre tu consulta en nuestra base de conocimiento. Te recomiendo abrir un ticket de soporte para que nuestro equipo pueda ayudarte directamente. Puedes hacerlo desde la sección de Soporte en tu dashboard.";
}
