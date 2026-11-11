"use client";

import { useEffect, useState } from "react";

import ShowCard from "@/components/ShowCard";
import StatusMessage from "@/components/StatusMessage";
import { requestApi } from "@/lib/api-client";
import type { ShowSummary } from "@/lib/types";

type SearchResultsProps = {
  query: string;
};

type SearchState =
  | { kind: "loading" }
  | { kind: "success"; shows: ShowSummary[] }
  | { kind: "error"; message: string };

/**
 * Busca as séries no backend (GET /api/shows?q=...) e mostra o resultado.
 * A página recria este componente (prop `key`) a cada novo termo, então o
 * estado sempre começa em "carregando".
 */
export default function SearchResults({ query }: SearchResultsProps) {
  const [state, setState] = useState<SearchState>({ kind: "loading" });

  useEffect(() => {
    // Cancela a requisição se o componente sair da tela antes da resposta.
    const controller = new AbortController();

    async function loadShows() {
      const params = new URLSearchParams({ q: query });
      try {
        const result = await requestApi<ShowSummary[]>(`/api/shows?${params.toString()}`, {
          signal: controller.signal,
        });
        setState(
          result.ok
            ? { kind: "success", shows: result.data }
            : { kind: "error", message: result.error },
        );
      } catch {
        // Requisição cancelada: o componente não está mais na tela.
      }
    }

    loadShows();
    return () => controller.abort();
  }, [query]);

  if (state.kind === "loading") {
    return <StatusMessage kind="loading">Buscando séries…</StatusMessage>;
  }

  if (state.kind === "error") {
    return <StatusMessage kind="error">{state.message}</StatusMessage>;
  }

  if (state.shows.length === 0) {
    return (
      <StatusMessage kind="info">
        Nenhuma série encontrada para “{query}”. Confira a grafia ou tente outro nome.
      </StatusMessage>
    );
  }

  return (
    <section aria-labelledby="results-title">
      <h2 id="results-title" className="results-title">
        {state.shows.length === 1
          ? `1 série encontrada para “${query}”`
          : `${state.shows.length} séries encontradas para “${query}”`}
      </h2>
      <ul className="card-grid">
        {state.shows.map((show) => (
          <li key={show.id}>
            <ShowCard show={show} />
          </li>
        ))}
      </ul>
    </section>
  );
}
