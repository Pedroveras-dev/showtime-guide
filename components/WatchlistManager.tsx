"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import StatusMessage from "@/components/StatusMessage";
import WatchlistItemCard from "@/components/WatchlistItemCard";
import type { WatchlistItem } from "@/lib/types";

type WatchlistManagerProps = {
  initialItems: WatchlistItem[];
};

/**
 * Guarda a lista no estado do React. Cada cartão avisa quando um item foi
 * alterado (onUpdated) ou removido (onRemoved), e a lista é atualizada sem
 * recarregar a página.
 */
export default function WatchlistManager({ initialItems }: WatchlistManagerProps) {
  const [items, setItems] = useState(initialItems);
  // Aviso exibido acima da lista (ex.: após remover um item, cujo cartão some).
  const [notice, setNotice] = useState<string | null>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  // Depois de uma remoção o cartão some; o foco vai para o aviso, para que
  // quem usa teclado ou leitor de tela não fique "perdido" na página.
  useEffect(() => {
    if (notice !== null) {
      noticeRef.current?.focus();
    }
  }, [notice]);

  function handleUpdated(updated: WatchlistItem) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleRemoved(removed: WatchlistItem) {
    setItems((current) => current.filter((item) => item.id !== removed.id));
    setNotice(`“${removed.name}” foi removida da sua lista.`);
  }

  return (
    <>
      {/* Região sempre presente para que leitores de tela anunciem o aviso. */}
      <div aria-live="polite">
        {notice && (
          <p ref={noticeRef} tabIndex={-1} className="message message--success">
            {notice}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <StatusMessage kind="info">
          Sua lista está vazia. <Link href="/">Busque uma série</Link> e use o botão “Adicionar à
          minha lista”.
        </StatusMessage>
      ) : (
        <>
          <p className="list-count">
            {items.length === 1 ? "1 série na lista" : `${items.length} séries na lista`}
          </p>
          <ul className="watchlist">
            {items.map((item) => (
              <li key={item.id}>
                <WatchlistItemCard item={item} onUpdated={handleUpdated} onRemoved={handleRemoved} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
