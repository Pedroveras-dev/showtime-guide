"use client";

import Link from "next/link";
import { useState } from "react";

import StatusMessage from "@/components/StatusMessage";
import { requestApi } from "@/lib/api-client";
import type { WatchlistItem } from "@/lib/types";

type AddToWatchlistButtonProps = {
  showId: number;
  initiallyInList: boolean;
};

type AddState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "added" }
  | { kind: "already" }
  | { kind: "error"; message: string };

/** Botão que inclui a série na lista pessoal (POST /api/watchlist). */
export default function AddToWatchlistButton({ showId, initiallyInList }: AddToWatchlistButtonProps) {
  const [state, setState] = useState<AddState>(initiallyInList ? { kind: "already" } : { kind: "idle" });

  async function handleAdd() {
    setState({ kind: "saving" });

    const result = await requestApi<WatchlistItem>("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show_id: showId }),
    });

    if (result.ok) {
      setState({ kind: "added" });
    } else if (result.status === 409) {
      setState({ kind: "already" });
    } else {
      setState({ kind: "error", message: result.error });
    }
  }

  if (state.kind === "added" || state.kind === "already") {
    return (
      <StatusMessage kind="success">
        {state.kind === "added" ? "Série adicionada à sua lista. " : "Esta série já está na sua lista. "}
        <Link href="/watchlist">Ver minha lista</Link>
      </StatusMessage>
    );
  }

  return (
    <div className="add-to-watchlist">
      <button type="button" onClick={handleAdd} disabled={state.kind === "saving"}>
        {state.kind === "saving" ? "Adicionando…" : "Adicionar à minha lista"}
      </button>
      {state.kind === "saving" && (
        <StatusMessage kind="loading">Adicionando a série à sua lista…</StatusMessage>
      )}
      {state.kind === "error" && <StatusMessage kind="error">{state.message}</StatusMessage>}
    </div>
  );
}
