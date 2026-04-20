import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const SYSTEM_PROMPT = `Eres EDU, el asistente experto de Manager Poker Deal (MPD). Personalidad: profesional, cercana, directa. Experto en poker online, rakeback y gestión de bankroll.

## RAKEBACK NGR
- **Rake**: comisión que cobra la sala en cada mano/torneo
- **NGR**: rake generado MENOS bonificaciones/promociones directas de la sala (base real del cálculo)
- **Fórmula**: Rakeback = NGR × % negociado con la sala
- MPD negocia porcentajes superiores al estándar gracias al volumen grupal
- El rakeback se acumula mensualmente y aparece en la sección Rakeback del dashboard

## SALDO MPD
- **Disponible**: listo para usar en servicios o solicitar retirada
- **Pendiente**: rakeback del mes en curso, pendiente de confirmar por la sala
- **Ganado total**: acumulado histórico de todo el rakeback recibido
- **Invertido**: capital comprometido en staking activo (bancaje)

## ESTRATOS DE JUGADOR
- **Novato**: NL2-NL10, 0–500€ rakeback acumulado. Acceso a comunidad y contenido básico
- **Semi-Pro**: NL25-NL50, 500–2.000€. Herramientas, grupos de estudio, rakeback preferente
- **Profesional**: NL100-NL200, 2.000–10.000€. Análisis avanzado, bancaje, coaching
- **Referente**: NL500+, >10.000€. Acceso exclusivo y visibilidad en la comunidad

## SERVICIOS MPD
1. **Redes** (VPN/Conectividad): soluciones adaptadas a sala y país. Precio: consultar
2. **Datamining**: paquetes de manos de las principales salas para análisis en PT4/HM3. ~€30/mes
3. **Herramientas**: PokerTracker 4 (€70), PioSolver (€200), HUDs y scripts a precio de grupo
4. **Sesiones de Estudio y Coaching**: grupos cerrados máx. 12 alumnos, 90 min, revisión de manos. €120/sesión
5. **Bancaje Selectivo**: financiación 50/50 del bankroll para jugadores cualificados. Makeup tracking mensual. Consultar

## FLUJO DE ALTA EN SALA
1. Regístrate en la sala con el **código de afiliación MPD** (imprescindible para gestionar el rakeback)
2. Contacta a MPD por **Telegram** (@mpd_soporte) o **WhatsApp** indicando tu nick y el código usado
3. MPD tramita el alta directamente con la sala
4. A cierre de mes se carga el rakeback en tu saldo disponible

## GALONES Y RANGO
Los galones reflejan el nivel de actividad en MPD:
- 🥉 **Bronce** (nivel 1–4): 1 franja
- 🥈 **Plata** (nivel 5–9): 2 franjas
- 🥇 **Oro** (nivel 10–14): 3 franjas
- ⭐ **Platino** (nivel 15–19): 4 franjas
- 💎 **Diamante** (nivel 20+): 5 franjas
Los niveles se obtienen acumulando puntos mediante actividad en la plataforma.

## LOGROS E ÍNDICE DE PRESTIGIO
- **Logros**: hitos desbloqueables por acciones en la plataforma; cada uno otorga puntos. Algunos son secretos
- **Índice de Prestigio**: (puntos/100) + (logros×5) + (nivel×10)
  - Novato (0–49) → Activo (50–149) → Establecido (150–299) → Veterano (300–499) → Leyenda (500+)

## REGLAS DE RESPUESTA
- Responde SIEMPRE en español
- Usa **negrita** para términos clave y listas con guion para enumerar conceptos
- Máximo 3–4 párrafos salvo que la complejidad lo requiera
- Si la pregunta requiere datos personales del jugador (saldo exacto, historial concreto), indica que puede consultarlos directamente en su dashboard
- Si no puedes responder con certeza, deriva: "Para esta consulta específica, te recomiendo abrir un ticket en la sección Soporte o escribir a @mpd_soporte en Telegram"
- No inventes porcentajes de salas específicas ni prometas rendimientos`;

interface HistoryMsg { role: "user" | "assistant"; content: string; }

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const message: string = body.message ?? "";
  const history: HistoryMsg[] = Array.isArray(body.history) ? body.history : [];

  if (!message.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const trimmed = message.trim().slice(0, 1000);

  // Save user message (verified userId from session, not client)
  await prisma.chatMessage.create({
    data: { userId: session.user.id, botType: "FAQ", role: "user", content: trimmed },
  });

  // KB search
  const terms = trimmed.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const articles = terms.length > 0
    ? await prisma.knowledgeArticle.findMany({
        where: {
          isPublic: true,
          OR: terms.flatMap((t) => [
            { title: { contains: t, mode: "insensitive" as const } },
            { content: { contains: t, mode: "insensitive" as const } },
            { tags: { has: t } },
          ]),
        },
        take: 3,
        orderBy: { sortOrder: "asc" },
      })
    : [];

  let response: string;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const kbExtra = articles.length > 0
        ? `\n\n## ARTÍCULOS KB ADICIONALES\n${articles.map((a) => `### ${a.title}\n${a.content}`).join("\n\n")}`
        : "";

      // Last 10 turns of history + current message
      const claudeMessages = [
        ...history.slice(-10),
        { role: "user" as const, content: trimmed },
      ];

      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          system: SYSTEM_PROMPT + kbExtra,
          messages: claudeMessages,
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        response = data.content[0].text;
      } else {
        response = fallback(trimmed, articles);
      }
    } catch {
      response = fallback(trimmed, articles);
    }
  } else {
    response = fallback(trimmed, articles);
  }

  await prisma.chatMessage.create({
    data: { userId: session.user.id, botType: "FAQ", role: "assistant", content: response },
  });

  return NextResponse.json({ response });
}

function fallback(msg: string, articles: { title: string; content: string }[]): string {
  const m = msg.toLowerCase();
  if (m.includes("rakeback") || m.includes("ngr") || m.includes("rake")) {
    return "**Rakeback NGR en MPD**\n\nEl rakeback se calcula sobre el NGR (rake generado menos bonificaciones directas de la sala). MPD aplica sobre ese NGR un porcentaje negociado superior al estándar.\n\nTu rakeback se acumula cada mes y aparece en la sección **Rakeback** de tu dashboard.";
  }
  if (m.includes("alta") || m.includes("sala") || m.includes("registro") || m.includes("afilia")) {
    return "**Proceso de alta en sala**\n\n1. Regístrate en la sala con nuestro código de afiliación\n2. Contacta a MPD por **Telegram** (@mpd_soporte) o **WhatsApp** con tu nick y el código usado\n3. Tramitamos el alta con la sala\n4. El rakeback se carga mensualmente en tu saldo\n\nSin código de afiliación no podemos gestionar el rakeback.";
  }
  if (m.includes("saldo") || m.includes("balance") || m.includes("dinero") || m.includes("disponible")) {
    return "**Tipos de saldo MPD**\n\n- **Disponible**: listo para usar o retirar\n- **Pendiente**: rakeback del mes en curso\n- **Ganado total**: histórico acumulado\n- **Invertido**: capital en staking activo\n\nConsulta tu saldo en la sección **Saldo** del dashboard.";
  }
  if (m.includes("galón") || m.includes("galon") || m.includes("nivel") || m.includes("prestigio") || m.includes("logro")) {
    return "**Galones y Prestigio**\n\n🥉 Bronce (niv. 1–4) · 🥈 Plata (5–9) · 🥇 Oro (10–14) · ⭐ Platino (15–19) · 💎 Diamante (20+)\n\nEl **Índice de Prestigio** combina puntos, logros y nivel. Visible en **Logros** y en el **Ranking**.";
  }
  if (m.includes("servicio") || m.includes("vpn") || m.includes("datamining") || m.includes("coaching") || m.includes("bancaje") || m.includes("herramienta")) {
    return "**Servicios MPD**\n\n- **Redes** (VPN): conectividad adaptada a tu sala\n- **Datamining**: manos de todas las salas (~€30/mes)\n- **Herramientas**: PT4 (€70), PioSolver (€200)\n- **Sesiones de Estudio**: grupos max. 12, €120/sesión\n- **Bancaje**: financiación 50/50 selectiva\n\nVer disponibilidad en la sección **Servicios**.";
  }
  if (articles.length > 0) {
    const summaries = articles.map((a) => `**${a.title}:** ${a.content.slice(0, 180)}...`).join("\n\n");
    return `Encontré información relevante:\n\n${summaries}\n\nSi necesitas más detalles, abre un ticket en **Soporte**.`;
  }
  return "No tengo información específica sobre esa consulta. Puedes:\n\n- Abrir un ticket en la sección **Soporte** del dashboard\n- Escribir directamente a **@mpd_soporte** en Telegram";
}
