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
