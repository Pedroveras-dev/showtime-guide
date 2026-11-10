// Funções de validação das entradas recebidas pelos endpoints.
// Cada função devolve o valor já tratado ou uma mensagem de erro em português.

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
