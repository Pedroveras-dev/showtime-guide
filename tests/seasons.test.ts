import assert from "node:assert/strict";
import { test } from "node:test";

import { groupEpisodesBySeason, type EpisodeWithSeason } from "../lib/seasons.ts";

function episode(id: number, season: number, runtime: number | null): EpisodeWithSeason {
  return { id, season, number: id, name: `Ep ${id}`, airdate: null, runtime_minutes: runtime, summary: null };
}

test("agrupa por temporada, em ordem crescente, somando as durações", () => {
  const seasons = groupEpisodesBySeason([episode(3, 2, 45), episode(1, 1, 60), episode(2, 1, 60)]);

  assert.deepEqual(
    seasons.map((s) => [s.season, s.episode_count, s.total_runtime_minutes]),
    [
      [1, 2, 120],
      [2, 1, 45],
    ],
  );
  // o número da temporada não se repete dentro de cada episódio
  assert.equal("season" in seasons[0].episodes[0], false);
});

test("duração desconhecida fica fora da soma e é contada à parte", () => {
  const [season] = groupEpisodesBySeason([episode(1, 1, 30), episode(2, 1, null)]);
  assert.equal(season.total_runtime_minutes, 30);
  assert.equal(season.episodes_without_runtime, 1);
});

test("temporada sem nenhuma duração conhecida tem total null, não 0", () => {
  const [season] = groupEpisodesBySeason([episode(1, 1, null), episode(2, 1, null)]);
  assert.equal(season.total_runtime_minutes, null);
  assert.equal(season.episodes_without_runtime, 2);
});

test("lista vazia gera nenhuma temporada", () => {
  assert.deepEqual(groupEpisodesBySeason([]), []);
});
