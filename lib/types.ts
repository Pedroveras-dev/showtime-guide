// Contratos das respostas da API própria (/api/...).
// Estes tipos descrevem apenas o JSON trocado entre backend e frontend,
// por isso podem ser importados nos dois lados sem expor código do servidor.

/** Formato padrão de todas as respostas de erro. */
export type ApiError = {
  error: string;
};

/** Série resumida, usada nos resultados da busca (GET /api/shows). */
export type ShowSummary = {
  id: number;
  name: string;
  image_url: string | null;
  genres: string[];
  premiered: string | null;
};

/** Episódio de uma série. A duração é sempre em minutos. */
export type Episode = {
  id: number;
  number: number | null;
  name: string;
  airdate: string | null;
  runtime_minutes: number | null;
  summary: string | null;
};

/** Temporada com os totais calculados pelo backend. */
export type Season = {
  season: number;
  episode_count: number;
  /** Soma das durações conhecidas, em minutos; null se nenhuma for conhecida. */
  total_runtime_minutes: number | null;
  /** Quantos episódios não têm duração informada pela TVmaze. */
  episodes_without_runtime: number;
  episodes: Episode[];
};

/** Detalhe de uma série (GET /api/shows/[id]). */
export type ShowDetail = ShowSummary & {
  ended: string | null;
  status: string | null;
  language: string | null;
  network: string | null;
  rating: number | null;
  /** Sinopse em texto puro, sem marcações HTML. */
  summary: string | null;
  /** Página da série na TVmaze, usada na atribuição da fonte. */
  tvmaze_url: string | null;
  seasons: Season[];
};
