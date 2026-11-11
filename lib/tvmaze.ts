// Cliente da API externa TVmaze (https://www.tvmaze.com/api).
// O import abaixo faz o build falhar se este módulo for importado por um
// componente do navegador: só o backend pode acessar a TVmaze.
import "server-only";

import { ExternalApiError } from "@/lib/http";
import { groupEpisodesBySeason, type EpisodeWithSeason } from "@/lib/seasons";
import { stripHtml } from "@/lib/text";
import type { Schedule, ScheduleItem, ShowDetail, ShowSummary } from "@/lib/types";

const TVMAZE_BASE_URL = "https://api.tvmaze.com";

// A documentação da TVmaze recomenda um User-Agent que identifique a aplicação.
const USER_AGENT =
  "ShowtimeGuide/0.1 (trabalho academico UESPI; https://github.com/Pedroveras-dev/showtime-guide)";

// Tempo máximo de espera por uma resposta da TVmaze.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Faz um GET na TVmaze e devolve o JSON da resposta.
 * Com `nullOnStatus`, esse status da TVmaze devolve null em vez de erro
 * (ex.: 404 = série inexistente; 422 = país rejeitado pela TVmaze).
 * Qualquer outra falha de comunicação vira ExternalApiError (resposta 502).
 */
async function getJson(
  path: string,
  options: { nullOnStatus?: number } = {},
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${TVMAZE_BASE_URL}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store", // dados sempre consultados em tempo de execução
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalApiError(`Falha de rede em ${path}: ${String(error)}`);
  }

  if (response.status === options.nullOnStatus) {
    return null;
  }

  if (!response.ok) {
    throw new ExternalApiError(`A TVmaze respondeu ${response.status} em ${path}`);
  }

  try {
    return await response.json();
  } catch {
    throw new ExternalApiError(`Resposta da TVmaze não é um JSON válido em ${path}`);
  }
}

// ---------------------------------------------------------------------------
// Normalização: converte o JSON da TVmaze (tipo `unknown`) nos contratos da
// aplicação. Os campos são verificados um a um, então valores nulos ou
// ausentes não quebram a aplicação.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/** A TVmaze envia `image: { medium, original }` ou `image: null`. */
function toImageUrl(image: unknown): string | null {
  if (!isRecord(image)) {
    return null;
  }
  return toStringOrNull(image.medium) ?? toStringOrNull(image.original);
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Nome da emissora (network) ou, se não houver, do serviço de streaming. */
function toNetworkName(network: unknown, webChannel: unknown): string | null {
  for (const channel of [network, webChannel]) {
    if (isRecord(channel)) {
      const name = toStringOrNull(channel.name);
      if (name !== null) {
        return name;
      }
    }
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/** Converte uma série da TVmaze em ShowSummary; devolve null se faltar id ou nome. */
function toShowSummary(raw: unknown): ShowSummary | null {
  if (!isRecord(raw) || typeof raw.id !== "number" || typeof raw.name !== "string") {
    return null;
  }

  return {
    id: raw.id,
    name: raw.name,
    image_url: toImageUrl(raw.image),
    genres: toStringArray(raw.genres),
    premiered: toStringOrNull(raw.premiered),
  };
}

/**
 * Converte um episódio da TVmaze. Episódios sem id ou sem número de
 * temporada são descartados (devolve null).
 */
function toEpisode(raw: unknown): EpisodeWithSeason | null {
  if (!isRecord(raw) || typeof raw.id !== "number" || typeof raw.season !== "number") {
    return null;
  }

  const runtime = toNumberOrNull(raw.runtime);

  return {
    id: raw.id,
    season: raw.season,
    number: toNumberOrNull(raw.number),
    name: toStringOrNull(raw.name) ?? "Episódio sem título",
    airdate: toStringOrNull(raw.airdate),
    // Duração zero ou negativa é tratada como desconhecida.
    runtime_minutes: runtime !== null && runtime > 0 ? runtime : null,
    summary: stripHtml(toStringOrNull(raw.summary)),
  };
}

// ---------------------------------------------------------------------------
// Operações públicas usadas pelos Route Handlers
// ---------------------------------------------------------------------------

/**
 * Busca séries pelo nome.
 * Endpoint externo: GET /search/shows?q=:query
 * Resposta externa: [{ score, show: { id, name, image, ... } }, ...]
 */
export async function searchShows(query: string): Promise<ShowSummary[]> {
  const params = new URLSearchParams({ q: query });
  const data = await getJson(`/search/shows?${params.toString()}`);

  if (!Array.isArray(data)) {
    throw new ExternalApiError("Formato inesperado na busca de séries");
  }

  const shows: ShowSummary[] = [];
  for (const item of data) {
    const show = isRecord(item) ? toShowSummary(item.show) : null;
    if (show !== null) {
      shows.push(show);
    }
  }
  return shows;
}

/**
 * Dados resumidos de uma série (nome, imagem...), sem os episódios.
 * Endpoint externo: GET /shows/:id
 * Usado ao incluir uma série na lista pessoal. Devolve null se ela não existir (404).
 */
export async function getShowSummary(id: number): Promise<ShowSummary | null> {
  const data = await getJson(`/shows/${id}`, { nullOnStatus: 404 });

  if (data === null) {
    return null;
  }

  const show = toShowSummary(data);
  if (show === null) {
    throw new ExternalApiError(`Formato inesperado na série ${id}`);
  }
  return show;
}

/**
 * Busca uma série com todos os episódios, já agrupados por temporada.
 * Endpoint externo: GET /shows/:id?embed=episodes
 * Episódios especiais não vêm por padrão nesse endpoint da TVmaze.
 * Devolve null quando a série não existe na TVmaze (404).
 */
export async function getShowDetail(id: number): Promise<ShowDetail | null> {
  const data = await getJson(`/shows/${id}?embed=episodes`, { nullOnStatus: 404 });

  if (data === null) {
    return null;
  }

  const show = toShowSummary(data);
  if (!isRecord(data) || show === null) {
    throw new ExternalApiError(`Formato inesperado no detalhe da série ${id}`);
  }

  const embedded = isRecord(data._embedded) ? data._embedded : {};
  const rawEpisodes = Array.isArray(embedded.episodes) ? embedded.episodes : [];

  const episodes: EpisodeWithSeason[] = [];
  for (const rawEpisode of rawEpisodes) {
    const episode = toEpisode(rawEpisode);
    if (episode !== null) {
      episodes.push(episode);
    }
  }

  return {
    ...show,
    ended: toStringOrNull(data.ended),
    status: toStringOrNull(data.status),
    language: toStringOrNull(data.language),
    network: toNetworkName(data.network, data.webChannel),
    rating: isRecord(data.rating) ? toNumberOrNull(data.rating.average) : null,
    summary: stripHtml(toStringOrNull(data.summary)),
    tvmaze_url: toStringOrNull(data.url),
    seasons: groupEpisodesBySeason(episodes),
  };
}

/** Converte um item da programação (episódio com a série embutida). */
function toScheduleItem(raw: unknown): ScheduleItem | null {
  if (!isRecord(raw) || typeof raw.id !== "number" || !isRecord(raw.show)) {
    return null;
  }

  const show = toShowSummary(raw.show);
  if (show === null) {
    return null;
  }

  const runtime = toNumberOrNull(raw.runtime);

  return {
    id: raw.id,
    airtime: toStringOrNull(raw.airtime),
    season: toNumberOrNull(raw.season),
    number: toNumberOrNull(raw.number),
    episode_name: toStringOrNull(raw.name) ?? "Episódio sem título",
    runtime_minutes: runtime !== null && runtime > 0 ? runtime : null,
    summary: stripHtml(toStringOrNull(raw.summary)),
    show: {
      ...show,
      network: toNetworkName(raw.show.network, raw.show.webChannel),
    },
  };
}

/**
 * Programação de TV de um país em uma data.
 * Endpoint externo: GET /schedule?country=:country&date=:date
 * A data e o país já chegam validados pela rota. Devolve null quando a
 * TVmaze rejeita o país (422 = código ISO inexistente, ex.: "XX").
 */
export async function getSchedule(date: string, country: string): Promise<Schedule | null> {
  const params = new URLSearchParams({ country, date });
  const data = await getJson(`/schedule?${params.toString()}`, { nullOnStatus: 422 });

  if (data === null) {
    return null;
  }

  if (!Array.isArray(data)) {
    throw new ExternalApiError("Formato inesperado na programação");
  }

  const items: ScheduleItem[] = [];
  for (const rawItem of data) {
    const item = toScheduleItem(rawItem);
    if (item !== null) {
      items.push(item);
    }
  }

  return { date, country, items };
}
