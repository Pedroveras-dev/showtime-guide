// Operações SQL da lista pessoal. Todas usam prepared statements: os valores
// vão separados do comando (marcadores @nome), nunca concatenados no SQL.
import "server-only";

import { getDb } from "@/lib/db";
import type { WatchlistItem, WatchStatus } from "@/lib/types";

// Observação sobre tipos: o better-sqlite3 não sabe o formato das linhas, então
// ele é informado no prepare<Parâmetros, Linha>(). O CHECK da tabela garante
// que `status` só contém want_to_watch, watching ou finished.

/** Lista todos os itens, do mais recente para o mais antigo. */
export function listWatchlist(): WatchlistItem[] {
  return getDb()
    .prepare<[], WatchlistItem>(
      `SELECT id, show_id, name, image_url, status, note, created_at
       FROM watchlist
       ORDER BY created_at DESC, id DESC`,
    )
    .all();
}

export function findByShowId(showId: number): WatchlistItem | undefined {
  return getDb()
    .prepare<{ show_id: number }, WatchlistItem>(
      `SELECT id, show_id, name, image_url, status, note, created_at
       FROM watchlist
       WHERE show_id = @show_id`,
    )
    .get({ show_id: showId });
}

export type NewWatchlistItem = {
  show_id: number;
  name: string;
  image_url: string | null;
  status: WatchStatus;
  note: string | null;
};

/**
 * Insere um item e devolve o registro criado.
 * Devolve null se a série já estiver na lista (show_id é UNIQUE): cobre o caso
 * raro de dois pedidos iguais chegarem ao mesmo tempo.
 */
export function insertWatchlistItem(item: NewWatchlistItem): WatchlistItem | null {
  try {
    const created = getDb()
      .prepare<NewWatchlistItem, WatchlistItem>(
        `INSERT INTO watchlist (show_id, name, image_url, status, note)
         VALUES (@show_id, @name, @image_url, @status, @note)
         RETURNING id, show_id, name, image_url, status, note, created_at`,
      )
      .get(item);
    return created ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return null;
    }
    throw error;
  }
}

/** Campos editáveis. Campo ausente = não alterar; note null = apagar a anotação. */
export type WatchlistChanges = {
  status?: WatchStatus;
  note?: string | null;
};

/**
 * Atualiza só os campos informados e devolve o registro atualizado,
 * ou null se o id não existir.
 * O SQL é fixo: `has_note` diz se a anotação deve ser trocada, pois
 * "note ausente" (manter) é diferente de "note null" (apagar).
 */
export function updateWatchlistItem(id: number, changes: WatchlistChanges): WatchlistItem | null {
  const updated = getDb()
    .prepare<
      { id: number; status: WatchStatus | null; has_note: number; note: string | null },
      WatchlistItem
    >(
      `UPDATE watchlist
       SET status = COALESCE(@status, status),
           note   = CASE WHEN @has_note = 1 THEN @note ELSE note END
       WHERE id = @id
       RETURNING id, show_id, name, image_url, status, note, created_at`,
    )
    .get({
      id,
      status: changes.status ?? null,
      has_note: "note" in changes ? 1 : 0,
      note: changes.note ?? null,
    });
  return updated ?? null;
}

/** Remove um item. Devolve false se o id não existir. */
export function deleteWatchlistItem(id: number): boolean {
  const result = getDb()
    .prepare<{ id: number }>("DELETE FROM watchlist WHERE id = @id")
    .run({ id });
  return result.changes > 0;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
