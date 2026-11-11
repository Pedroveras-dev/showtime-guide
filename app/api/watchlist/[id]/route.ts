import { errorToResponse, jsonError, readJsonBody } from "@/lib/http";
import { parsePositiveId, parseUpdateWatchlistBody } from "@/lib/validation";
import { deleteWatchlistItem, updateWatchlistItem } from "@/lib/watchlist";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// [id] é o identificador LOCAL do item (gerado pelo SQLite), e não o id da TVmaze.
const INVALID_ID = "O identificador do item deve ser um número inteiro positivo.";
const NOT_FOUND = "Item não encontrado na sua lista.";

/**
 * PATCH /api/watchlist/[id]
 * Corpo: { "status"?: "...", "note"?: "texto" | null } (ao menos um dos dois).
 * Só os campos enviados são alterados; "note": null ou "" apaga a anotação.
 *
 * 200: item atualizado
 * 400: id inválido, JSON inválido, campo não permitido ou valor inválido
 * 404: item inexistente
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const id = parsePositiveId((await params).id, INVALID_ID);
  if (!id.ok) {
    return jsonError(id.error, 400);
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return jsonError(body.error, 400);
  }

  const changes = parseUpdateWatchlistBody(body.value);
  if (!changes.ok) {
    return jsonError(changes.error, 400);
  }

  try {
    const updated = updateWatchlistItem(id.value, changes.value);
    if (updated === null) {
      return jsonError(NOT_FOUND, 404);
    }
    return Response.json(updated);
  } catch (error) {
    return errorToResponse(error);
  }
}

/**
 * DELETE /api/watchlist/[id]
 *
 * 204: item removido (resposta sem corpo)
 * 400: id inválido
 * 404: item inexistente
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = parsePositiveId((await params).id, INVALID_ID);
  if (!id.ok) {
    return jsonError(id.error, 400);
  }

  try {
    if (!deleteWatchlistItem(id.value)) {
      return jsonError(NOT_FOUND, 404);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
