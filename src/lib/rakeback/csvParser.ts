import Papa from "papaparse";

export const REQUIRED_HEADERS = [
  "userEmail",
  "roomSlug",
  "rakeGenerated",
  "rakebackPercent",
  "periodStart",
  "periodEnd",
] as const;

export type RawRow = Record<string, string>;

export type ParsedRow = {
  index: number;
  userEmail: string;
  roomSlug: string;
  rakeGenerated: number;
  rakebackPercent: number;
  periodStart: string;
  periodEnd: string;
  period: string;
  notes?: string;
  errors: string[];
};

export type ParseResult = {
  headerError: string | null;
  rows: ParsedRow[];
};

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function parseRakebackCsv(text: string): ParseResult {
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return {
      headerError: `Faltan columnas obligatorias: ${missing.join(", ")}`,
      rows: [],
    };
  }

  const rows: ParsedRow[] = parsed.data.map((raw, idx) => {
    const errors: string[] = [];
    const userEmail = (raw.userEmail ?? "").trim().toLowerCase();
    const roomSlug = (raw.roomSlug ?? "").trim();
    const rakeGenerated = Number((raw.rakeGenerated ?? "").toString().replace(",", "."));
    const rakebackPercent = Number((raw.rakebackPercent ?? "").toString().replace(",", "."));
    const periodStart = (raw.periodStart ?? "").trim();
    const periodEnd = (raw.periodEnd ?? "").trim();
    const notes = raw.notes?.trim() || undefined;

    if (!userEmail) errors.push("userEmail vacío");
    if (!roomSlug) errors.push("roomSlug vacío");
    if (!isFinite(rakeGenerated) || rakeGenerated < 0) errors.push("rakeGenerated inválido");
    if (!isFinite(rakebackPercent) || rakebackPercent < 0 || rakebackPercent > 100) {
      errors.push("rakebackPercent inválido (0-100)");
    }
    if (!isIsoDate(periodStart)) errors.push("periodStart debe ser YYYY-MM-DD");
    if (!isIsoDate(periodEnd)) errors.push("periodEnd debe ser YYYY-MM-DD");
    if (isIsoDate(periodStart) && isIsoDate(periodEnd) && periodStart > periodEnd) {
      errors.push("periodStart > periodEnd");
    }

    const period = isIsoDate(periodStart) ? periodStart.slice(0, 7) : "";

    return {
      index: idx + 1,
      userEmail,
      roomSlug,
      rakeGenerated,
      rakebackPercent,
      periodStart,
      periodEnd,
      period,
      notes,
      errors,
    };
  });

  return { headerError: null, rows };
}
