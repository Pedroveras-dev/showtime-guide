import type { Metadata } from "next";

import StatusMessage from "@/components/StatusMessage";
import WatchlistManager from "@/components/WatchlistManager";
import { requestApiFromServer } from "@/lib/server-api";
import type { WatchlistItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Minha lista | Guia de Séries de TV",
};

// Página da lista pessoal. A lista inicial vem do backend (GET /api/watchlist);
// as alterações seguintes são feitas no navegador pelo WatchlistManager.
export default async function WatchlistPage() {
  const result = await requestApiFromServer<WatchlistItem[]>("/api/watchlist");

  return (
    <>
      <h1>Minha lista</h1>
      <p className="lead">
        Acompanhe as séries que você quer assistir, está assistindo ou já concluiu.
      </p>
      {result.ok ? (
        <WatchlistManager initialItems={result.data} />
      ) : (
        <StatusMessage kind="error">{result.error}</StatusMessage>
      )}
    </>
  );
}
