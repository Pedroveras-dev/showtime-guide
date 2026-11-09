import type { Episode, Season } from "@/lib/types";

/** Episódio já normalizado, ainda com o número da temporada a que pertence. */
export type EpisodeWithSeason = Episode & { season: number };

/**
 * Agrupa os episódios por temporada e calcula, para cada uma:
 * - episode_count: quantidade de episódios;
 * - total_runtime_minutes: soma das durações conhecidas, em minutos;
 * - episodes_without_runtime: quantos episódios não têm duração.
 *
 * Durações desconhecidas NÃO são estimadas: elas ficam fora da soma e são
 * contadas à parte. Se nenhum episódio da temporada tiver duração, o total
 * é null (desconhecido), e não 0.
 */
export function groupEpisodesBySeason(episodes: EpisodeWithSeason[]): Season[] {
  const seasonsByNumber = new Map<number, Season>();

  for (const { season: seasonNumber, ...episode } of episodes) {
    let season = seasonsByNumber.get(seasonNumber);
    if (season === undefined) {
      season = {
        season: seasonNumber,
        episode_count: 0,
        total_runtime_minutes: null,
        episodes_without_runtime: 0,
        episodes: [],
      };
      seasonsByNumber.set(seasonNumber, season);
    }

    season.episodes.push(episode);
    season.episode_count += 1;

    if (episode.runtime_minutes === null) {
      season.episodes_without_runtime += 1;
    } else {
      season.total_runtime_minutes =
        (season.total_runtime_minutes ?? 0) + episode.runtime_minutes;
    }
  }

  // Temporadas em ordem crescente (1, 2, 3...).
  return [...seasonsByNumber.values()].sort((a, b) => a.season - b.season);
}
