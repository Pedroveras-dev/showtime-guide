import type { NextRequest } from "next/server";

import { errorToResponse, jsonError } from "@/lib/http";
import { getSchedule } from "@/lib/tvmaze";
import { parseCountryCode, parseScheduleDate } from "@/lib/validation";

/**
 * GET /api/schedule?date=AAAA-MM-DD&country=BR
 * Retorna os episódios exibidos na TV de um país em uma data.
 * - date: opcional; padrão = dia atual no fuso America/Sao_Paulo
 * - country: opcional; padrão = BR
 * A resposta informa a data e o país usados: { date, country, items }.
 *
 * 200: programação (items pode ser vazio)
 * 400: data ou país inválidos
 * 502: falha na comunicação com a TVmaze
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const date = parseScheduleDate(searchParams.get("date"));
  if (!date.ok) {
    return jsonError(date.error, 400);
  }

  const country = parseCountryCode(searchParams.get("country"));
  if (!country.ok) {
    return jsonError(country.error, 400);
  }

  try {
    const schedule = await getSchedule(date.value, country.value);
    if (schedule === null) {
      return jsonError(`País não reconhecido pela TVmaze: ${country.value}.`, 400);
    }
    return Response.json(schedule);
  } catch (error) {
    return errorToResponse(error);
  }
}
