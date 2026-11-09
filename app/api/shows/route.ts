import type { NextRequest } from "next/server";

import { errorToResponse, jsonError } from "@/lib/http";
import { searchShows } from "@/lib/tvmaze";
import { parseSearchQuery } from "@/lib/validation";

/**
 * GET /api/shows?q=<nome>
 * Busca séries pelo nome na TVmaze.
 *
 * 200: lista de séries (pode ser vazia)
 * 400: parâmetro `q` ausente, vazio ou longo demais
 * 502: falha na comunicação com a TVmaze
 */
export async function GET(request: NextRequest) {
  const query = parseSearchQuery(request.nextUrl.searchParams.get("q"));
  if (!query.ok) {
    return jsonError(query.error, 400);
  }

  try {
    const shows = await searchShows(query.value);
    return Response.json(shows);
  } catch (error) {
    return errorToResponse(error);
  }
}
