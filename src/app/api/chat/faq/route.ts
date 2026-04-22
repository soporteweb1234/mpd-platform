import { NextResponse } from "next/server";

/**
 * FASE 5 deprecó este endpoint: el chat de MIKE usa RAG + streaming en
 * /api/chat/stream (pgvector + hybrid search + SSE).
 * Responde 410 Gone para que clientes stale sepan que hay que actualizar.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint deprecado. Usa /api/chat/stream (SSE + RAG).",
      code: "GONE",
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usa /api/chat/stream.", code: "GONE" },
    { status: 410 },
  );
}
