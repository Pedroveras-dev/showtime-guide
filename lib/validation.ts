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
