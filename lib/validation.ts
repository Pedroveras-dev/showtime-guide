// Funções de validação das entradas recebidas pelos endpoints.
// Cada função devolve o valor já tratado ou uma mensagem de erro em português.
// Caminho relativo com extensão (e não "@/lib/types"): este arquivo também é
// importado diretamente pelo Node nos testes, que não conhece o atalho "@/".
import { WATCH_STATUSES, type WatchStatus } from "./types.ts";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const MAX_SEARCH_QUERY_LENGTH = 100;

/** Valida o parâmetro `q` da busca de séries. */
export function parseSearchQuery(
  raw: string | null,
): ValidationResult<string> {
  const query = raw?.trim() ?? "";

  if (query === "") {
    return {
      ok: false,
      error: "Informe o nome da série no parâmetro 'q'.",
    };
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      ok: false,
      error: `O termo de busca deve ter no máximo ${MAX_SEARCH_QUERY_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: query };
}

export const DEFAULT_COUNTRY = "BR";

// Fuso usado para definir "hoje" quando a data não é informada.
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

/** Data atual (AAAA-MM-DD) no fuso informado, e não no fuso do servidor. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Valida o parâmetro `date` da programação.
 * Exige o formato AAAA-MM-DD e uma data que exista no calendário
 * (rejeita, por exemplo, 2026-02-30 e 2025-02-29).
 * Sem data (ou com valor vazio), usa o dia atual no fuso do Brasil.
 */
export function parseScheduleDate(
  raw: string | null,
  now: Date = new Date(),
): ValidationResult<string> {
  const value = raw?.trim() ?? "";
  if (value === "") {
    return { ok: true, value: todayIn(DEFAULT_TIME_ZONE, now) };
  }

  const invalid: ValidationResult<string> = {
    ok: false,
    error: "Data inválida. Use o formato AAAA-MM-DD com uma data existente (ex.: 2026-11-22).",
  };

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return invalid;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    return invalid;
  }

  return { ok: true, value };
}

/**
 * Valida o parâmetro `country` (código ISO 3166-1 de duas letras, ex.: BR, US).
 * Sem país (ou com valor vazio), usa o Brasil. Letras minúsculas são aceitas
 * e convertidas para maiúsculas.
 */
export function parseCountryCode(raw: string | null): ValidationResult<string> {
  const value = raw?.trim() ?? "";
  if (value === "") {
    return { ok: true, value: DEFAULT_COUNTRY };
  }

  if (!/^[A-Za-z]{2}$/.test(value)) {
    return {
      ok: false,
      error: "País inválido. Use o código de duas letras (ex.: BR, US, GB).",
    };
  }

  return { ok: true, value: value.toUpperCase() };
}

/**
 * Valida um identificador recebido na URL (ex.: /api/shows/169).
 * Aceita apenas inteiros positivos escritos só com dígitos.
 */
export function parsePositiveId(
  raw: string,
  errorMessage: string,
): ValidationResult<number> {
  if (!/^[1-9]\d*$/.test(raw)) {
    return { ok: false, error: errorMessage };
  }

  const id = Number(raw);
  if (!Number.isSafeInteger(id)) {
    return { ok: false, error: errorMessage };
  }

  return { ok: true, value: id };
}

// ---------------------------------------------------------------------------
// Lista pessoal (watchlist): corpo JSON de POST e PATCH
// ---------------------------------------------------------------------------

export const MAX_NOTE_LENGTH = 500;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWatchStatus(value: unknown): value is WatchStatus {
  return WATCH_STATUSES.some((status) => status === value);
}

/** Rejeita campos fora da lista permitida. */
function checkAllowedFields(body: Record<string, unknown>, allowed: readonly string[]): string | null {
  const extra = Object.keys(body).filter((key) => !allowed.includes(key));
  if (extra.length === 0) {
    return null;
  }
  const list = allowed.map((key) => `'${key}'`).join(", ");
  return `Campo(s) não permitido(s): ${extra.join(", ")}. Envie apenas: ${list}.`;
}

function parseStatus(value: unknown): ValidationResult<WatchStatus> {
  if (!isWatchStatus(value)) {
    return {
      ok: false,
      error: "Status inválido. Use 'want_to_watch', 'watching' ou 'finished'.",
    };
  }
  return { ok: true, value };
}

/**
 * Valida a anotação. null, texto vazio ou só com espaços = sem anotação (null).
 * O limite de 500 caracteres vale para o texto sem os espaços das pontas.
 */
function parseNote(value: unknown): ValidationResult<string | null> {
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "A anotação deve ser um texto (ou null para apagá-la)." };
  }

  const note = value.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `A anotação deve ter no máximo ${MAX_NOTE_LENGTH} caracteres.`,
    };
  }
  return { ok: true, value: note === "" ? null : note };
}

export type CreateWatchlistInput = {
  show_id: number;
  status: WatchStatus;
  note: string | null;
};

/**
 * Valida o corpo do POST /api/watchlist: { show_id, status?, note? }.
 * name e image_url NÃO são aceitos: o backend os busca na TVmaze.
 */
export function parseCreateWatchlistBody(body: unknown): ValidationResult<CreateWatchlistInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "O corpo da requisição deve ser um objeto JSON." };
  }

  const fieldsError = checkAllowedFields(body, ["show_id", "status", "note"]);
  if (fieldsError !== null) {
    return { ok: false, error: fieldsError };
  }

  if (!("show_id" in body)) {
    return { ok: false, error: "Informe o campo 'show_id' (id da série na TVmaze)." };
  }
  const showId = body.show_id;
  if (typeof showId !== "number" || !Number.isSafeInteger(showId) || showId <= 0) {
    return { ok: false, error: "O campo 'show_id' deve ser um número inteiro positivo." };
  }

  let status: WatchStatus = "want_to_watch";
  if ("status" in body) {
    const parsed = parseStatus(body.status);
    if (!parsed.ok) {
      return parsed;
    }
    status = parsed.value;
  }

  let note: string | null = null;
  if ("note" in body) {
    const parsed = parseNote(body.note);
    if (!parsed.ok) {
      return parsed;
    }
    note = parsed.value;
  }

  return { ok: true, value: { show_id: showId, status, note } };
}

export type UpdateWatchlistInput = {
  status?: WatchStatus;
  note?: string | null;
};

/**
 * Valida o corpo do PATCH /api/watchlist/[id]. Só 'status' e 'note' podem
 * ser alterados; os dois são opcionais, mas pelo menos um é obrigatório.
 * Campo ausente = manter o valor atual; "note": null ou "" = apagar a anotação.
 */
export function parseUpdateWatchlistBody(body: unknown): ValidationResult<UpdateWatchlistInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "O corpo da requisição deve ser um objeto JSON." };
  }

  const fieldsError = checkAllowedFields(body, ["status", "note"]);
  if (fieldsError !== null) {
    return { ok: false, error: fieldsError };
  }

  const changes: UpdateWatchlistInput = {};

  if ("status" in body) {
    const parsed = parseStatus(body.status);
    if (!parsed.ok) {
      return parsed;
    }
    changes.status = parsed.value;
  }

  if ("note" in body) {
    const parsed = parseNote(body.note);
    if (!parsed.ok) {
      return parsed;
    }
    changes.note = parsed.value;
  }

  if (Object.keys(changes).length === 0) {
    return { ok: false, error: "Informe ao menos um campo para alterar: 'status' ou 'note'." };
  }

  return { ok: true, value: changes };
}
