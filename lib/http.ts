import type { ApiError } from "@/lib/types";
import type { ValidationResult } from "@/lib/validation";

/**
 * Erro lançado quando a comunicação com a API externa (TVmaze) falha:
 * rede indisponível, tempo esgotado, resposta inesperada etc.
 * Os endpoints convertem esse erro em uma resposta 502.
 */
export class ExternalApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalApiError";
  }
}

/** Cria uma resposta de erro no formato padrão { "error": "..." }. */
export function jsonError(message: string, status: number): Response {
  const body: ApiError = { error: message };
  return Response.json(body, { status });
}

/**
 * Converte erros inesperados em respostas HTTP.
 * Detalhes técnicos vão apenas para o log do servidor; o usuário
 * recebe uma mensagem genérica em português.
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof ExternalApiError) {
    console.error("[TVmaze]", error.message);
    return jsonError(
      "Não foi possível consultar a TVmaze no momento. Tente novamente mais tarde.",
      502,
    );
  }

  console.error("[Erro interno]", error);
  return jsonError("Ocorreu um erro interno no servidor.", 500);
}

/**
 * Lê o corpo JSON da requisição. Devolve { ok: false } se o corpo estiver
 * vazio ou não for um JSON válido (o endpoint responde 400).
 */
export async function readJsonBody(
  request: Request,
): Promise<ValidationResult<unknown>> {
  try {
    const value: unknown = await request.json();
    return { ok: true, value };
  } catch {
    return { ok: false, error: "O corpo da requisição deve ser um JSON válido." };
  }
}
