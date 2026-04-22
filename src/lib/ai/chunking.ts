/**
 * Chunking recursivo: prueba separadores en orden (\n\n → \n → ". " → " ")
 * hasta que cada segmento cabe en `size` tokens (aprox len/4).
 * Aplica overlap arrastrando los últimos `overlap` tokens del chunk anterior.
 */

export interface Chunk {
  content: string;
  tokenCount: number;
}

const SEPARATORS = ["\n\n", "\n", ". ", " "];
const CHARS_PER_TOKEN = 4;

function approxTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitRecursive(text: string, targetTokens: number, sepIndex = 0): string[] {
  if (approxTokens(text) <= targetTokens) return [text];
  if (sepIndex >= SEPARATORS.length) {
    // Hard split por caracteres cuando ya no hay separadores útiles.
    const step = targetTokens * CHARS_PER_TOKEN;
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += step) {
      parts.push(text.slice(i, i + step));
    }
    return parts;
  }
  const sep = SEPARATORS[sepIndex];
  const pieces = text.split(sep).filter((p) => p.length > 0);
  if (pieces.length === 1) {
    return splitRecursive(text, targetTokens, sepIndex + 1);
  }
  const result: string[] = [];
  let buffer = "";
  for (const piece of pieces) {
    const candidate = buffer ? buffer + sep + piece : piece;
    if (approxTokens(candidate) <= targetTokens) {
      buffer = candidate;
    } else {
      if (buffer) result.push(buffer);
      if (approxTokens(piece) > targetTokens) {
        result.push(...splitRecursive(piece, targetTokens, sepIndex + 1));
        buffer = "";
      } else {
        buffer = piece;
      }
    }
  }
  if (buffer) result.push(buffer);
  return result;
}

function tailOverlap(text: string, overlapTokens: number): string {
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  if (text.length <= overlapChars) return text;
  return text.slice(text.length - overlapChars);
}

export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {}
): Chunk[] {
  const size = opts.size ?? 1500;
  const overlap = opts.overlap ?? 200;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const rawChunks = splitRecursive(normalized, size);
  const chunks: Chunk[] = [];
  let carry = "";

  for (const raw of rawChunks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const body = carry ? `${carry}\n${trimmed}` : trimmed;
    chunks.push({ content: body, tokenCount: approxTokens(body) });
    carry = tailOverlap(body, overlap);
  }

  return chunks;
}
