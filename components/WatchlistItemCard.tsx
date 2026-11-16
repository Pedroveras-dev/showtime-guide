"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import StatusMessage from "@/components/StatusMessage";
import { requestApi } from "@/lib/api-client";
import { formatTimestampDate, WATCH_STATUS_LABELS } from "@/lib/format";
import { WATCH_STATUSES, type WatchlistItem, type WatchStatus } from "@/lib/types";
import { MAX_NOTE_LENGTH } from "@/lib/validation";

type WatchlistItemCardProps = {
  item: WatchlistItem;
  onUpdated: (item: WatchlistItem) => void;
  onRemoved: (item: WatchlistItem) => void;
};

type Feedback = { kind: "loading" | "info" | "success" | "error"; text: string } | null;

/** Cartão de um item da lista: situação, anotação e remoção. */
export default function WatchlistItemCard({ item, onUpdated, onRemoved }: WatchlistItemCardProps) {
  const [noteDraft, setNoteDraft] = useState(item.note ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // ids únicos por item, para ligar cada <label> ao seu campo.
  const statusId = `status-${item.id}`;
  const noteId = `note-${item.id}`;
  const noteHintId = `note-hint-${item.id}`;

  const savedNote = item.note ?? "";
  const noteChanged = noteDraft.trim() !== savedNote;

  /**
   * PATCH /api/watchlist/[id] com os campos alterados.
   * Os controles não são desabilitados durante o envio (isso tiraria o foco de
   * quem usa teclado); em vez disso, um novo envio é ignorado enquanto `busy`.
   */
  async function saveChanges(
    changes: { status?: WatchStatus; note?: string | null },
    successText: string,
  ) {
    if (busy) {
      return;
    }
    setBusy(true);
    setFeedback({ kind: "loading", text: "Salvando…" });

    const result = await requestApi<WatchlistItem>(`/api/watchlist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });

    setBusy(false);
    if (result.ok) {
      onUpdated(result.data);
      // Só atualiza o campo se a anotação foi enviada; assim, mudar a situação
      // não apaga um texto que ainda está sendo digitado.
      if ("note" in changes) {
        setNoteDraft(result.data.note ?? "");
      }
      setFeedback({ kind: "success", text: successText });
    } else {
      setFeedback({ kind: "error", text: result.error });
    }
  }

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const status = WATCH_STATUSES.find((value) => value === event.target.value);
    if (status) {
      saveChanges({ status }, `Situação alterada para “${WATCH_STATUS_LABELS[status]}”.`);
    }
  }

  function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // o formulário é enviado por fetch, sem recarregar a página
    if (!noteChanged) {
      setFeedback({ kind: "info", text: "A anotação não foi alterada." });
      return;
    }
    saveChanges({ note: noteDraft }, noteDraft.trim() === "" ? "Anotação apagada." : "Anotação salva.");
  }

  function handleClearNote() {
    if (savedNote === "") {
      setFeedback({ kind: "info", text: "Não há anotação para apagar." });
      return;
    }
    saveChanges({ note: null }, "Anotação apagada.");
  }

  async function handleRemove() {
    if (busy || !window.confirm(`Remover “${item.name}” da sua lista?`)) {
      return;
    }
    setBusy(true);
    setFeedback({ kind: "loading", text: "Removendo…" });

    const result = await requestApi<null>(`/api/watchlist/${item.id}`, { method: "DELETE" });

    if (result.ok) {
      onRemoved(item); // o cartão sai da tela; o aviso aparece acima da lista
    } else {
      setBusy(false);
      setFeedback({ kind: "error", text: result.error });
    }
  }

  return (
    <article className="watch-card" aria-labelledby={`title-${item.id}`} aria-busy={busy}>
      {item.image_url ? (
        <Image
          className="watch-card__image"
          src={item.image_url}
          alt={`Pôster da série ${item.name}`}
          width={210}
          height={295}
        />
      ) : (
        <div className="watch-card__image card__image--empty" aria-hidden="true">
          Sem imagem
        </div>
      )}

      <div className="watch-card__body">
        <h2 id={`title-${item.id}`} className="watch-card__title">
          <Link href={`/shows/${item.show_id}`}>{item.name}</Link>
        </h2>
        <p className="watch-card__meta">Adicionada em {formatTimestampDate(item.created_at)}</p>

        <div className="field">
          <label htmlFor={statusId}>Situação</label>
          <select id={statusId} value={item.status} onChange={handleStatusChange}>
            {WATCH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {WATCH_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <form className="note-form" onSubmit={handleNoteSubmit}>
          <label htmlFor={noteId}>Anotação</label>
          <textarea
            id={noteId}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            aria-describedby={noteHintId}
          />
          <p id={noteHintId} className="note-form__hint">
            Opcional. {noteDraft.length}/{MAX_NOTE_LENGTH} caracteres.
          </p>
          <div className="button-row">
            <button type="submit">Salvar anotação</button>
            <button type="button" className="button--secondary" onClick={handleClearNote}>
              Apagar anotação
            </button>
          </div>
        </form>

        <button type="button" className="button--danger" onClick={handleRemove}>
          Remover da lista
        </button>

        {feedback && <StatusMessage kind={feedback.kind}>{feedback.text}</StatusMessage>}
      </div>
    </article>
  );
}
