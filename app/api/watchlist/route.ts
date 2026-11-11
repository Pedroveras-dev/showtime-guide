import { errorToResponse, jsonError, readJsonBody } from "@/lib/http";
import { getShowSummary } from "@/lib/tvmaze";
import { parseCreateWatchlistBody } from "@/lib/validation";
import { findByShowId, insertWatchlistItem, listWatchlist } from "@/lib/watchlist";

/**
 * GET /api/watchlist
 * Lista as séries da lista pessoal, da inclusão mais recente para a mais antiga.
 *
 * 200: lista (pode ser vazia)
 * 500: erro ao acessar o banco
 */
export async function GET() {
  try {
    return Response.json(listWatchlist());
  } catch (error) {
    return errorToResponse(error);
  }
}

/**
 * POST /api/watchlist
 * Corpo: { "show_id": 169, "status"?: "watching", "note"?: "texto" }
 * O nome e a imagem são buscados na TVmaze pelo show_id, e não enviados pelo cliente.
 *
 * 201: item criado (cabeçalho Location aponta para o novo recurso)
 * 400: JSON inválido, campo não permitido, show_id/status/note inválidos
 * 404: série inexistente na TVmaze
 * 409: série já está na lista
 * 502: falha na comunicação com a TVmaze
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return jsonError(body.error, 400);
  }

  const input = parseCreateWatchlistBody(body.value);
  if (!input.ok) {
    return jsonError(input.error, 400);
  }

  const duplicateMessage = "Esta série já está na sua lista.";

  try {
    // Confere a duplicidade antes de consultar a TVmaze (evita uma requisição inútil).
    if (findByShowId(input.value.show_id) !== undefined) {
      return jsonError(duplicateMessage, 409);
    }

    const show = await getShowSummary(input.value.show_id);
    if (show === null) {
      return jsonError("Série não encontrada na TVmaze.", 404);
    }

    const created = insertWatchlistItem({
      show_id: show.id,
      name: show.name,
      image_url: show.image_url,
      status: input.value.status,
      note: input.value.note,
    });
    if (created === null) {
      return jsonError(duplicateMessage, 409);
    }

    return Response.json(created, {
      status: 201,
      headers: { Location: `/api/watchlist/${created.id}` },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
