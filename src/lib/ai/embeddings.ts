import OpenAI from "openai";

const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;
const MAX_BATCH = 100;
const MAX_RETRIES = 3;

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY no definida. Requerida para generar embeddings (text-embedding-3-small).",
    );
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedBatch(texts: string[], attempt = 1): Promise<number[][]> {
  try {
    const client = getClient();
    const res = await client.embeddings.create({
      model: MODEL,
      input: texts,
      dimensions: DIMENSIONS,
    });
    return res.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    const backoff = Math.min(30000, 1000 * Math.pow(2, attempt));
    await sleep(backoff);
    return embedBatch(texts, attempt + 1);
  }
}

/**
 * Genera embeddings en batches de 100 con retry exponencial.
 * Devuelve vectores en el mismo orden que `texts`.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const slice = texts.slice(i, i + MAX_BATCH);
    const batch = await embedBatch(slice);
    results.push(...batch);
  }
  return results;
}

export const EMBEDDING_MODEL = MODEL;
export const EMBEDDING_DIMENSIONS = DIMENSIONS;
