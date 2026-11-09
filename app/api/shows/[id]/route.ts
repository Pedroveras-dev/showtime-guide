import type { NextRequest } from "next/server";

import { errorToResponse, jsonError } from "@/lib/http";
import { getShowDetail } from "@/lib/tvmaze";
import { parsePositiveId } from "@/lib/validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/shows/[id]
 * [id] é o identificador da série NA TVMAZE (não o id da lista pessoal).
 * Retorna a série com sinopse em texto e episódios agrupados por temporada.
 *
 * 200: detalhe da série
 * 400: id inválido (não é inteiro positivo)
 * 404: série inexistente na TVmaze
 * 502: falha na comunicação com a TVmaze
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: rawId } = await params;

  const id = parsePositiveId(
    rawId,
    "O identificador da série deve ser um número inteiro positivo.",
  );
  if (!id.ok) {
    return jsonError(id.error, 400);
  }

  try {
    const show = await getShowDetail(id.value);
    if (show === null) {
      return jsonError("Série não encontrada na TVmaze.", 404);
    }
    return Response.json(show);
  } catch (error) {
    return errorToResponse(error);
  }
}
