// Formatação de valores para exibição na interface (em português).
import type { WatchStatus } from "@/lib/types";

/** "2008-01-20" → "20/01/2008". Sem conversão de fuso: a data já é do calendário local. */
export function formatDate(isoDate: string | null): string | null {
  if (isoDate === null) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate;
}

/**
 * Duração em minutos, com a unidade sempre explícita.
 * 45 → "45 min"; 420 → "420 min (7 h)"; 125 → "125 min (2 h 5 min)".
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const inHours = rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  return `${minutes} min (${inHours})`;
}

/** Situação da série na TVmaze, traduzida. Valores desconhecidos aparecem como vieram. */
export function formatShowStatus(status: string | null): string | null {
  const labels: Record<string, string> = {
    Running: "Em exibição",
    Ended: "Encerrada",
    "To Be Determined": "Indefinida",
    "In Development": "Em desenvolvimento",
  };
  return status === null ? null : (labels[status] ?? status);
}

/** Rótulos das situações da lista pessoal, exibidos na interface. */
export const WATCH_STATUS_LABELS = {
  want_to_watch: "Quero assistir",
  watching: "Assistindo",
  finished: "Concluída",
} satisfies Record<WatchStatus, string>;

/** Nome do país em português a partir do código ISO ("BR" → "Brasil"). */
export function formatCountry(code: string): string {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Data de um instante gravado em UTC (ex.: created_at), mostrada no fuso do
 * Brasil. Fuso fixo: servidor e navegador produzem o mesmo texto.
 * "2026-11-11T02:30:00.000Z" → "10/11/2026".
 */
export function formatTimestampDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date);
}
