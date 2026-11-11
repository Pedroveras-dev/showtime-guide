// Funções usadas pelo FRONTEND para chamar os endpoints do próprio backend
// (/api/...). O frontend nunca acessa a TVmaze nem o banco diretamente.
import type { ApiError } from "@/lib/types";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

/**
 * Faz uma requisição HTTP a um endpoint do backend e devolve os dados ou a
 * mensagem de erro em português enviada pelo backend ({ "error": "..." }).
 * Uma resposta 204 (sem corpo) devolve data = null.
 */
export async function requestApi<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    // Requisição cancelada de propósito (AbortController): repassa o erro.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return { ok: false, status: 0, error: "Não foi possível conectar ao servidor. Verifique sua conexão." };
  }

  if (response.status === 204) {
    // O endpoint não devolve corpo; quem chama declara T como null nesse caso.
    return { ok: true, status: 204, data: null as T };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Corpo vazio ou que não é JSON: tratado abaixo.
  }

  if (!response.ok) {
    const error = isApiError(body) ? body.error : `Erro inesperado (código ${response.status}).`;
    return { ok: false, status: response.status, error };
  }

  // O formato da resposta é definido pelo nosso próprio backend (lib/types.ts),
  // por isso o tipo informado por quem chama é aceito sem nova verificação.
  return { ok: true, status: response.status, data: body as T };
}
