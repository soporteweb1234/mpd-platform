import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getStratumLabel(stratum: string): string {
  const labels: Record<string, string> = {
    NOVATO: "Novato",
    SEMI_PRO: "Semi-Pro",
    PROFESIONAL: "Profesional",
    REFERENTE: "Referente",
  };
  return labels[stratum] ?? stratum;
}

export function getStatusLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    APRENDIZ: "Aprendiz",
    VERSADO: "Versado",
    PROFESIONAL: "Profesional",
    EXPERTO: "Experto",
    MAESTRO: "Maestro",
  };
  return labels[level] ?? level;
}

export function getStatusGalon(level: string): { tier: string; nivel: number; color: string } {
  const map: Record<string, { tier: string; nivel: number; color: string }> = {
    APRENDIZ: { tier: "Bronce", nivel: 1, color: "text-mpd-amber" },
    VERSADO: { tier: "Plata", nivel: 2, color: "text-mpd-gray" },
    PROFESIONAL: { tier: "Oro", nivel: 3, color: "text-mpd-gold" },
    EXPERTO: { tier: "Platino", nivel: 4, color: "text-mpd-white" },
    MAESTRO: { tier: "Diamante", nivel: 5, color: "text-mpd-green" },
  };
  return map[level] ?? { tier: "Bronce", nivel: 1, color: "text-mpd-amber" };
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    PLAYER: "Jugador",
    SUBAGENT: "Subagente",
    MODERATOR: "Moderador",
    ANALYST: "Analista",
    TEACHER: "Profesor",
    ADMIN: "Administrador",
    SUPER_ADMIN: "Super Admin",
  };
  return labels[role] ?? role;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    ACTIVE: "Activo",
    SUSPENDED: "Suspendido",
    BANNED: "Baneado",
    INACTIVE: "Inactivo",
  };
  return labels[status] ?? status;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
